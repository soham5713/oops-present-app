"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useAttendance } from "../context/AttendanceContext"
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths } from "date-fns"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getAttendanceByDate, getAttendanceByDateRange, type AttendanceRecord } from "../firebase/attendanceService"
import { AllSubjects } from "../timetable"
import { BarChart, LineChart } from "react-native-chart-kit"
import { LinearGradient } from "expo-linear-gradient"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"
import { SafeAreaView } from "react-native-safe-area-context"

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Define types for our attendance statistics
type SubjectAttendance = {
  subject: string
  theoryTotal: number
  theoryPresent: number
  theoryPercentage: number
  labTotal: number
  labPresent: number
  labPercentage: number
  color?: string
}

// Define type for monthly data points
type MonthlyDataPoint = {
  month: string
  theoryAttendance: number
  labAttendance: number
}

export default function HomeScreen() {
  const navigation = useNavigation()
  const { attendees } = useAttendance()
  const { user } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const spinAnim = useRef(new Animated.Value(0)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  // State for dashboard
  const [activeTab, setActiveTab] = useState("overall")
  const [isLoading, setIsLoading] = useState(false)
  const [overallStats, setOverallStats] = useState<SubjectAttendance[]>([])
  const [monthlyStats, setMonthlyStats] = useState<SubjectAttendance[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [manualRecordsCount, setManualRecordsCount] = useState(0)
  const [trendData, setTrendData] = useState<MonthlyDataPoint[]>([])
  const [overallTheoryAttendance, setOverallTheoryAttendance] = useState(0)
  const [overallLabAttendance, setOverallLabAttendance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subject colors for charts
  const subjectColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#8AC926",
    "#1982C4",
    "#6A4C93",
    "#FF595E",
  ]

  // Spin animation for refresh icon
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Animate progress bar based on overall attendance
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: overallTheoryAttendance / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start()
  }, [overallTheoryAttendance])

  // Load attendance statistics
  useEffect(() => {
    if (!user?.uid) return

    loadAttendanceData()
  }, [user?.uid, selectedMonth, activeTab])

  const loadAttendanceData = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    setError(null)

    try {
      if (activeTab === "overall") {
        // For overall tab, fetch all attendance records directly from Firebase
        await loadOverallAttendance(user.uid)
      } else {
        // For monthly tab, fetch records for the selected month
        await loadMonthlyAttendance(user.uid, selectedMonth)
      }

      // Load trend data (last 6 months)
      const trendData = await loadAttendanceTrend(user.uid)
      setTrendData(trendData)

      // Count manual records
      const todayRecords = await getAttendanceByDate(user.uid, format(new Date(), "yyyy-MM-dd"))
      const manualCount = todayRecords.filter((record) => record.isManual || record.notes?.includes("[MANUAL]")).length
      setManualRecordsCount(manualCount)
    } catch (error) {
      console.error("Error loading attendance data:", error)
      if (error instanceof Error && error.toString().includes("requires an index")) {
        setError(
          "Firebase index required. Please follow the instructions in the console to create the necessary index.",
        )
      } else {
        setError("Failed to load attendance data. Please try again.")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Load overall attendance (all records)
  const loadOverallAttendance = async (userId: string) => {
    try {
      // Query all attendance records for this user
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId))
      const querySnapshot = await getDocs(attendanceQuery)

      // Initialize stats for all subjects
      const stats: { [key: string]: SubjectAttendance } = {}

      AllSubjects.forEach((subject) => {
        stats[subject] = {
          subject,
          theoryTotal: 0,
          theoryPresent: 0,
          theoryPercentage: 0,
          labTotal: 0,
          labPresent: 0,
          labPercentage: 0,
        }
      })

      // Process all attendance records
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.records && Array.isArray(data.records)) {
          data.records.forEach((record: AttendanceRecord) => {
            if (!stats[record.subject]) {
              // Skip if subject is not in our list
              return
            }

            if (record.type === "theory") {
              stats[record.subject].theoryTotal++
              if (record.status === "present") {
                stats[record.subject].theoryPresent++
              }
            } else if (record.type === "lab") {
              stats[record.subject].labTotal++
              if (record.status === "present") {
                stats[record.subject].labPresent++
              }
            }
          })
        }
      })

      // Calculate percentages
      Object.values(stats).forEach((stat) => {
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0
      })

      // Filter out subjects with no attendance records and sort
      const filteredStats = Object.values(stats)
        .filter((stat) => stat.theoryTotal > 0 || stat.labTotal > 0)
        .sort((a, b) => a.subject.localeCompare(b.subject))

      // Assign colors to subjects
      filteredStats.forEach((stat, index) => {
        stat.color = subjectColors[index % subjectColors.length]
      })

      setOverallStats(filteredStats)

      // Calculate overall theory attendance percentage
      const totalTheoryPresent = filteredStats.reduce((sum, stat) => sum + stat.theoryPresent, 0)
      const totalTheoryClasses = filteredStats.reduce((sum, stat) => sum + stat.theoryTotal, 0)
      const overallTheoryPercentage =
        totalTheoryClasses > 0 ? Math.round((totalTheoryPresent / totalTheoryClasses) * 100) : 0
      setOverallTheoryAttendance(overallTheoryPercentage)

      // Calculate overall lab attendance percentage
      const totalLabPresent = filteredStats.reduce((sum, stat) => sum + stat.labPresent, 0)
      const totalLabClasses = filteredStats.reduce((sum, stat) => sum + stat.labTotal, 0)
      const overallLabPercentage = totalLabClasses > 0 ? Math.round((totalLabPresent / totalLabClasses) * 100) : 0
      setOverallLabAttendance(overallLabPercentage)
    } catch (error) {
      console.error("Error loading overall attendance:", error)
      throw error
    }
  }

  // Load monthly attendance
  const loadMonthlyAttendance = async (userId: string, month: Date) => {
    try {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const startDateStr = format(monthStart, "yyyy-MM-dd")
      const endDateStr = format(monthEnd, "yyyy-MM-dd")

      // Get records for specific date range
      const recordsByDate = await getAttendanceByDateRange(userId, startDateStr, endDateStr)

      // Initialize stats for all subjects
      const stats: { [key: string]: SubjectAttendance } = {}

      AllSubjects.forEach((subject) => {
        stats[subject] = {
          subject,
          theoryTotal: 0,
          theoryPresent: 0,
          theoryPercentage: 0,
          labTotal: 0,
          labPresent: 0,
          labPercentage: 0,
        }
      })

      // Process all records for this month
      Object.values(recordsByDate).forEach((dateRecords) => {
        dateRecords.forEach((record) => {
          if (!stats[record.subject]) {
            // Skip if subject is not in our list
            return
          }

          if (record.type === "theory") {
            stats[record.subject].theoryTotal++
            if (record.status === "present") {
              stats[record.subject].theoryPresent++
            }
          } else if (record.type === "lab") {
            stats[record.subject].labTotal++
            if (record.status === "present") {
              stats[record.subject].labPresent++
            }
          }
        })
      })

      // Calculate percentages
      Object.values(stats).forEach((stat) => {
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0
      })

      // Filter out subjects with no attendance records and sort
      const filteredStats = Object.values(stats)
        .filter((stat) => stat.theoryTotal > 0 || stat.labTotal > 0)
        .sort((a, b) => a.subject.localeCompare(b.subject))

      // Assign colors to subjects (matching with overall stats if possible)
      filteredStats.forEach((stat, index) => {
        const matchingStat = overallStats.find((s) => s.subject === stat.subject)
        if (matchingStat) {
          stat.color = matchingStat.color
        } else {
          stat.color = subjectColors[index % subjectColors.length]
        }
      })

      setMonthlyStats(filteredStats)
    } catch (error) {
      console.error("Error loading monthly attendance:", error)
      throw error
    }
  }

  // Load attendance trend data for the last 6 months
  const loadAttendanceTrend = async (userId: string): Promise<MonthlyDataPoint[]> => {
    try {
      const now = new Date()
      const sixMonthsAgo = subMonths(now, 5) // Get 6 months including current

      // Create array of the last 6 months
      const months: Date[] = []
      for (let i = 0; i < 6; i++) {
        months.push(addMonths(sixMonthsAgo, i))
      }

      // Get attendance data for each month
      const trendData: MonthlyDataPoint[] = []

      for (const month of months) {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        const startDateStr = format(monthStart, "yyyy-MM-dd")
        const endDateStr = format(monthEnd, "yyyy-MM-dd")

        try {
          // Use a simpler query that doesn't require a composite index
          // Just query by userId and then filter the results in memory
          const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId))

          const querySnapshot = await getDocs(attendanceQuery)

          let theoryPresent = 0
          let theoryTotal = 0
          let labPresent = 0
          let labTotal = 0

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            // Check if the date is within our range
            if (data.date && data.date >= startDateStr && data.date <= endDateStr) {
              if (data.records && Array.isArray(data.records)) {
                data.records.forEach((record: any) => {
                  if (record.type === "theory") {
                    theoryTotal++
                    if (record.status === "present") {
                      theoryPresent++
                    }
                  } else if (record.type === "lab") {
                    labTotal++
                    if (record.status === "present") {
                      labPresent++
                    }
                  }
                })
              }
            }
          })

          const theoryPercentage = theoryTotal > 0 ? Math.round((theoryPresent / theoryTotal) * 100) : 0
          const labPercentage = labTotal > 0 ? Math.round((labPresent / labTotal) * 100) : 0

          trendData.push({
            month: format(month, "MMM"),
            theoryAttendance: theoryPercentage,
            labAttendance: labPercentage,
          })
        } catch (error) {
          console.log(`Error fetching data for ${format(month, "MMM")}:`, error)
          // Add a placeholder value if there's an error
          trendData.push({
            month: format(month, "MMM"),
            theoryAttendance: 0,
            labAttendance: 0,
          })
        }
      }

      return trendData
    } catch (error) {
      console.error("Error loading attendance trend:", error)
      // Return empty data with month labels if there's an error
      const now = new Date()
      const sixMonthsAgo = subMonths(now, 5)
      const months: MonthlyDataPoint[] = []

      for (let i = 0; i < 6; i++) {
        const month = addMonths(sixMonthsAgo, i)
        months.push({
          month: format(month, "MMM"),
          theoryAttendance: 0,
          labAttendance: 0,
        })
      }

      return months
    }
  }

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)

    // Start spin animation
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      spinAnim.setValue(0)
    })

    // Force re-fetch data
    loadAttendanceData()
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    // Animate the change
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setSelectedMonth((prevMonth) => subMonths(prevMonth, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1)
    // Don't allow selecting future months beyond current
    if (nextMonth <= new Date()) {
      // Animate the change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      setSelectedMonth(nextMonth)
    }
  }

  // Get gradient colors based on attendance percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) {
      return isDarkMode ? "#059669" : "#10b981" // Green
    } else if (percentage >= 60) {
      return isDarkMode ? "#d97706" : "#f59e0b" // Amber
    } else {
      return isDarkMode ? "#dc2626" : "#ef4444" // Red
    }
  }

  // Switch tabs with animation
  const switchTab = (tab: string) => {
    if (tab === activeTab) return

    // Animate tab change
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
    ]).start()

    setActiveTab(tab)
  }

  // Prepare data for theory bar chart
  const getTheoryBarChartData = () => {
    const stats = activeTab === "overall" ? overallStats : monthlyStats

    if (stats.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      }
    }

    return {
      labels: stats.map((stat) => stat.subject),
      datasets: [
        {
          data: stats.map((stat) => stat.theoryPercentage),
          colors: stats.map((stat, index) => () => stat.color || subjectColors[index % subjectColors.length]),
        },
      ],
    }
  }

  // Prepare data for lab bar chart
  const getLabBarChartData = () => {
    const stats = activeTab === "overall" ? overallStats : monthlyStats

    if (stats.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      }
    }

    return {
      labels: stats.map((stat) => stat.subject),
      datasets: [
        {
          data: stats.map((stat) => stat.labPercentage),
          colors: stats.map((stat, index) => () => stat.color || subjectColors[index % subjectColors.length]),
        },
      ],
    }
  }

  // Prepare data for line chart (trend)
  const getTheoryTrendData = () => {
    if (trendData.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      }
    }

    return {
      labels: trendData.map((point) => point.month),
      datasets: [
        {
          data: trendData.map((point) => point.theoryAttendance),
          color: () => "#4f46e5", // Theory color
          strokeWidth: 3,
        },
      ],
    }
  }

  // Prepare data for line chart (trend)
  const getLabTrendData = () => {
    if (trendData.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      }
    }

    return {
      labels: trendData.map((point) => point.month),
      datasets: [
        {
          data: trendData.map((point) => point.labAttendance),
          color: () => "#0ea5e9", // Lab color
          strokeWidth: 3,
        },
      ],
    }
  }

  // Render attendance statistics table
  const renderAttendanceTable = (stats: SubjectAttendance[]) => {
    if (stats.length === 0) {
      return (
        <Animated.View
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.card,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Ionicons name="calendar-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Attendance Data</Text>
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            {activeTab === "monthly"
              ? "No attendance records for this month"
              : "Start taking attendance to see statistics"}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Attendance")}
          >
            <Text style={styles.emptyStateButtonText}>Take Attendance</Text>
          </TouchableOpacity>
        </Animated.View>
      )
    }

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <LinearGradient
            colors={[theme.primary, theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tableHeader}
          >
            <Text style={[styles.headerCell, styles.subjectCell, { color: "white" }]}>Subject</Text>
            <View style={styles.theoryLabCell}>
              <Text style={[styles.headerCell, { color: "white" }]}>Theory</Text>
              <View style={styles.attendanceDetails}>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Att.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Total</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>%</Text>
              </View>
            </View>
            <View style={styles.theoryLabCell}>
              <Text style={[styles.headerCell, { color: "white" }]}>Lab</Text>
              <View style={styles.attendanceDetails}>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Att.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Total</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>%</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Table Rows */}
          {stats.map((stat, index) => {

            return (
              <View
                key={stat.subject}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: theme.card,
                    borderLeftWidth: 4,
                    borderLeftColor: stat.color || subjectColors[index % subjectColors.length],
                  },
                  index % 2 === 0 && { backgroundColor: isDarkMode ? theme.background : "#f9fafb" },
                ]}
              >
                <Text style={[styles.subjectCell, { color: theme.text }]}>{stat.subject}</Text>

                <View style={styles.theoryLabCell}>
                  <View style={styles.attendanceDetails}>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.theoryPresent}</Text>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.theoryTotal}</Text>
                    <View
                      style={[
                        styles.percentageBadge,
                        { backgroundColor: getPercentageColor(stat.theoryPercentage) }
                      ]}
                    >
                      <Text style={styles.percentageText}>{stat.theoryPercentage}%</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.theoryLabCell}>
                  <View style={styles.attendanceDetails}>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.labPresent}</Text>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.labTotal}</Text>
                    <View
                      style={[
                        styles.percentageBadge,
                        { backgroundColor: getPercentageColor(stat.labPercentage) }
                      ]}
                    >
                      <Text style={styles.percentageText}>{stat.labPercentage}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.primary + "DD", theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Attendance Dashboard</Text>
              <Text style={styles.date}>{format(new Date(), "EEEE, MMMM d, yyyy")}</Text>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={refreshData} disabled={isRefreshing}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={24} color="white" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} colors={[theme.primary]} />}
      >
        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("Attendance")}
          >
            <LinearGradient colors={["#4f46e5", "#4338ca"]} style={styles.actionIconContainer}>
              <Ionicons name="checkbox" size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.actionText, { color: theme.text }]}>Mark Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("Manual")}
          >
            <LinearGradient colors={["#0ea5e9", "#0284c7"]} style={styles.actionIconContainer}>
              <Ionicons name="create" size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.actionText, { color: theme.text }]}>Manual Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("Timetable")}
          >
            <LinearGradient colors={["#f97316", "#ea580c"]} style={styles.actionIconContainer}>
              <Ionicons name="calendar" size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.actionText, { color: theme.text }]}>View Timetable</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View
          style={[
            styles.tabContainer,
            {
              backgroundColor: theme.card,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "overall" && [styles.activeTab, { borderBottomColor: theme.primary }]]}
            onPress={() => switchTab("overall")}
          >
            <Ionicons
              name="stats-chart"
              size={18}
              color={activeTab === "overall" ? theme.primary : theme.secondaryText}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.secondaryText },
                activeTab === "overall" && { color: theme.primary, fontWeight: "600" },
              ]}
            >
              Overall
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "monthly" && [styles.activeTab, { borderBottomColor: theme.primary }]]}
            onPress={() => switchTab("monthly")}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={activeTab === "monthly" ? theme.primary : theme.secondaryText}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.secondaryText },
                activeTab === "monthly" && { color: theme.primary, fontWeight: "600" },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Month Selector (only for monthly tab) */}
        {activeTab === "monthly" && (
          <Animated.View
            style={[
              styles.monthSelector,
              {
                backgroundColor: theme.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.monthNavButton, { backgroundColor: theme.primary + "15" }]}
              onPress={goToPreviousMonth}
            >
              <Ionicons name="chevron-back" size={20} color={theme.primary} />
            </TouchableOpacity>

            <View style={styles.monthTitleContainer}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>{format(selectedMonth, "MMMM yyyy")}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.monthNavButton,
                { backgroundColor: theme.primary + "15" },
                isSameMonth(selectedMonth, new Date()) && { opacity: 0.5 },
              ]}
              onPress={goToNextMonth}
              disabled={isSameMonth(selectedMonth, new Date())}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Dashboard Content */}
        <View style={styles.dashboardContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading attendance data...</Text>
            </View>
          ) : error ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="alert-circle" size={40} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={refreshData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Title */}
              <Animated.View
                style={[
                  styles.sectionHeader,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Attendance Table */}
                <View style={styles.tableSection}>
                  <Text style={[styles.tableSectionTitle, { color: theme.text }]}>Detailed Attendance</Text>
                  {renderAttendanceTable(activeTab === "overall" ? overallStats : monthlyStats)}
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {activeTab === "overall" ? "Overall Attendance" : "Monthly Attendance"}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                  {activeTab === "overall"
                    ? "Combined attendance from all months"
                    : `Attendance for ${format(selectedMonth, "MMMM yyyy")}`}
                </Text>
              </Animated.View>

              {/* Charts Section */}
              <Animated.View
                style={[
                  styles.chartsContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                  },
                ]}
              >
                {/* Theory Bar Chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>Theory Attendance (%)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                      data={getTheoryBarChartData()}
                      width={Math.max(SCREEN_WIDTH - 64, getTheoryBarChartData().labels.length * 60)}
                      height={180}
                      yAxisSuffix="%"
                      chartConfig={{
                        backgroundColor: theme.card,
                        backgroundGradientFrom: theme.card,
                        backgroundGradientTo: theme.card,
                        decimalPlaces: 0,
                        color: (opacity = 1) => "#4f46e5", // Theory color
                        labelColor: (opacity = 1) => theme.text,
                        barPercentage: 0.6,
                      }}
                      style={{
                        marginVertical: 8,
                        borderRadius: 16,
                      }}
                      showValuesOnTopOfBars
                    />
                  </ScrollView>
                </View>

                {/* Lab Bar Chart */}
                <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>Lab Attendance (%)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                      data={getLabBarChartData()}
                      width={Math.max(SCREEN_WIDTH - 64, getLabBarChartData().labels.length * 60)}
                      height={180}
                      yAxisSuffix="%"
                      chartConfig={{
                        backgroundColor: theme.card,
                        backgroundGradientFrom: theme.card,
                        backgroundGradientTo: theme.card,
                        decimalPlaces: 0,
                        color: (opacity = 1) => "#0ea5e9", // Lab color
                        labelColor: (opacity = 1) => theme.text,
                        barPercentage: 0.6,
                      }}
                      style={{
                        marginVertical: 8,
                        borderRadius: 16,
                      }}
                      showValuesOnTopOfBars
                    />
                  </ScrollView>
                </View>

                {/* Trend Charts (only for overall) */}
                {activeTab === "overall" && (
                  <>
                    <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                      <Text style={[styles.chartTitle, { color: theme.text }]}>Theory Attendance Trend</Text>
                      <LineChart
                        data={getTheoryTrendData()}
                        width={SCREEN_WIDTH - 64}
                        height={180}
                        yAxisSuffix="%"
                        chartConfig={{
                          backgroundColor: theme.card,
                          backgroundGradientFrom: theme.card,
                          backgroundGradientTo: theme.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => "#4f46e5", // Theory color
                          labelColor: (opacity = 1) => theme.text,
                          propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#4f46e5",
                          },
                        }}
                        bezier
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                      <Text style={[styles.chartTitle, { color: theme.text }]}>Lab Attendance Trend</Text>
                      <LineChart
                        data={getLabTrendData()}
                        width={SCREEN_WIDTH - 64}
                        height={180}
                        yAxisSuffix="%"
                        chartConfig={{
                          backgroundColor: theme.card,
                          backgroundGradientFrom: theme.card,
                          backgroundGradientTo: theme.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => "#0ea5e9", // Lab color
                          labelColor: (opacity = 1) => theme.text,
                          propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#0ea5e9",
                          },
                        }}
                        bezier
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />
                    </View>
                  </>
                )}
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  progressValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  statCard: {
    width: "31%",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  statCardElevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statInfo: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
  },
  tabIcon: {
    marginRight: 6,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  monthTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  currentMonthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  currentMonthText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  dashboardContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  chartsContainer: {
    marginBottom: 24,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  pieChartContainer: {
    alignItems: "center",
  },
  noChartData: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  noChartDataText: {
    fontSize: 15,
  },
  tableSection: {
    marginBottom: 24,
  },
  tableSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  tableContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  smallHeaderCell: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  subjectCell: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: 'center', // Add this for Android
    alignSelf: 'center', // This helps for cross-platform alignment
  },
  theoryLabCell: {
    flex: 1.5,
    alignItems: "center",
  },
  attendanceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 4,
  },
  attendanceValue: {
    fontSize: 13,
    flex: 1,
    textAlign: "center",
    fontWeight: "500",
  },
  percentageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  totalText: {
    fontSize: 13,
    flex: 1,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    borderRadius: 16,
    padding: 16,
    width: "31%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
})
