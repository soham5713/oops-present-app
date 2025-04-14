"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
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
// Add import for getDoc and doc
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { SafeAreaView } from "react-native-safe-area-context"
import Header from "../components/Header"

// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"
// Add a new import for the AttendanceCalculator component
import AttendanceCalculator from "../components/AttendanceCalculator"

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
  importedData?: {
    theoryTotal: number
    theoryAttended: number
    labTotal: number
    labAttended: number
  }
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
  const { user, userProfile } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

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

  // Add state for caching data to prevent unnecessary reloads
  const [cachedOverallStats, setCachedOverallStats] = useState<SubjectAttendance[]>([])
  const [cachedMonthlyStats, setCachedMonthlyStats] = useState<{ [key: string]: SubjectAttendance[] }>({})
  const [cachedTrendData, setCachedTrendData] = useState<MonthlyDataPoint[]>([])

  // Load attendance statistics
  const loadAttendanceData = async () => {
    if (!user?.uid) return

    if (activeTab === "monthly") {
    }

    setIsLoading(true)
    setError(null)

    try {
      if (activeTab === "overall") {
        // For overall tab, fetch all attendance records directly from Firebase
        await loadOverallAttendance(user.uid)
      } else if (activeTab === "monthly") {
        // For monthly tab, always load fresh data
        await loadMonthlyAttendance(user.uid, selectedMonth)
      }

      // Load trend data if not already loaded
      if (trendData.length === 0) {
        const newTrendData = await loadAttendanceTrend(user.uid)
        setTrendData(newTrendData)
      }

      // Count manual records
      const todayRecords = await getAttendanceByDate(user.uid, format(new Date(), "yyyy-MM-dd"))
      const manualCount = todayRecords.filter((record) => record.isManual || record.notes?.includes("[MANUAL]")).length
      setManualRecordsCount(manualCount)
    } catch (error) {
      console.error("[ERROR] Error loading attendance data:", error)
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
          importedData: {
            theoryTotal: 0,
            theoryAttended: 0,
            labTotal: 0,
            labAttended: 0,
          },
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

      // Fetch and add imported attendance data
      for (const subject of AllSubjects) {
        try {
          const importedDataRef = doc(db, "importedAttendance", `${userId}_${subject}`)
          const importedDoc = await getDoc(importedDataRef)

          if (importedDoc.exists()) {
            const data = importedDoc.data()

            // Add imported data to the stats
            stats[subject].importedData = {
              theoryTotal: data.theoryTotal || 0,
              theoryAttended: data.theoryAttended || 0,
              labTotal: data.labTotal || 0,
              labAttended: data.labAttended || 0,
            }

            // Add imported data to totals
            stats[subject].theoryTotal += data.theoryTotal || 0
            stats[subject].theoryPresent += data.theoryAttended || 0
            stats[subject].labTotal += data.labTotal || 0
            stats[subject].labPresent += data.labAttended || 0
          }
        } catch (error) {
          console.error(`Error fetching imported data for ${subject}:`, error)
        }
      }

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

  // Update the loadMonthlyAttendance function to exclude imported data for the current month
  const loadMonthlyAttendance = async (userId: string, month: Date) => {
    try {

      // Clear any existing monthly stats first to prevent showing stale data
      setMonthlyStats([])

      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const startDateStr = format(monthStart, "yyyy-MM-dd")
      const endDateStr = format(monthEnd, "yyyy-MM-dd")


      // Get records for specific date range
      const recordsByDate = await getAttendanceByDateRange(userId, startDateStr, endDateStr)

      // Check if there are any records for this month
      const hasRecordsForMonth = Object.keys(recordsByDate).length > 0

      // If no records exist for this month, set empty stats and return
      if (!hasRecordsForMonth) {
        console.log(`[LOAD] No attendance records found for ${format(month, "MMMM yyyy")}`)
        setMonthlyStats([])
        return
      }

      // Initialize stats for subjects that have records this month
      const stats: { [key: string]: SubjectAttendance } = {}

      // Process all records for this month
      Object.values(recordsByDate).forEach((dateRecords) => {
        dateRecords.forEach((record) => {
          // Skip imported data
          if (record.notes?.includes("[IMPORTED]")) {
            return
          }

          // Initialize subject stats if not already done
          if (!stats[record.subject]) {
            stats[record.subject] = {
              subject: record.subject,
              theoryTotal: 0,
              theoryPresent: 0,
              theoryPercentage: 0,
              labTotal: 0,
              labPresent: 0,
              labPercentage: 0,
              importedData: {
                theoryTotal: 0,
                theoryAttended: 0,
                labTotal: 0,
                labAttended: 0,
              },
            }
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

      console.log(`[LOAD] Loaded ${filteredStats.length} subjects for ${format(month, "MMMM yyyy")}`)

      // Update state with the new stats
      setMonthlyStats(filteredStats)
    } catch (error) {
      console.error(`[ERROR] Error loading monthly attendance for ${format(month, "MMMM yyyy")}:`, error)
      // Make sure to set empty stats on error to avoid showing stale data
      setMonthlyStats([])
      throw error
    }
  }

  // Optimize the loadAttendanceTrend function to be more efficient
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

      // Fetch all attendance data at once to reduce Firebase calls
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId))
      const querySnapshot = await getDocs(attendanceQuery)

      // Store all records in memory for faster processing
      const allRecords: { [date: string]: AttendanceRecord[] } = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.date && data.records && Array.isArray(data.records)) {
          allRecords[data.date] = data.records
        }
      })

      // Process each month using the in-memory records
      for (const month of months) {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        const startDateStr = format(monthStart, "yyyy-MM-dd")
        const endDateStr = format(monthEnd, "yyyy-MM-dd")

        let theoryPresent = 0
        let theoryTotal = 0
        let labPresent = 0
        let labTotal = 0

        // Process records for this month
        Object.entries(allRecords).forEach(([date, records]) => {
          if (date >= startDateStr && date <= endDateStr) {
            records.forEach((record: any) => {
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
        })

        const theoryPercentage = theoryTotal > 0 ? Math.round((theoryPresent / theoryTotal) * 100) : 0
        const labPercentage = labTotal > 0 ? Math.round((labPresent / labTotal) * 100) : 0

        trendData.push({
          month: format(month, "MMM"),
          theoryAttendance: theoryPercentage,
          labAttendance: labPercentage,
        })
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

  // Add effect to clear cache when user changes
  useEffect(() => {
    if (user?.uid) {
      // Clear cache when user changes
      setCachedOverallStats([])
      setCachedMonthlyStats({})
      setCachedTrendData([])
    }
  }, [user?.uid])

  // Load data when component mounts or when tab/month changes
  useEffect(() => {
    if (user?.uid) {
      // Reset monthly stats when changing months to prevent showing stale data
      if (activeTab === "monthly") {
        console.log(`[EFFECT] Month changed to: ${format(selectedMonth, "MMMM yyyy")}`)
        // Clear monthly stats immediately
        setMonthlyStats([])
        // Show loading indicator
        setIsLoading(true)
      }

      // Add a delay before loading data to ensure state updates are processed
      const timer = setTimeout(() => {
        console.log(`[EFFECT] Loading data for ${activeTab} view, month: ${format(selectedMonth, "MMMM yyyy")}`)
        loadAttendanceData()
      }, 500)

      return () => {
        // Clean up timer on unmount or when dependencies change
        clearTimeout(timer)
      }
    }
  }, [user?.uid, activeTab, selectedMonth])

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)

    // Force re-fetch data
    loadAttendanceData()
  }

  // Update the switchTab function to clear monthly stats when switching tabs
  const switchTab = (tab: string) => {
    if (tab === activeTab) return

    console.log(`[TAB] Switching from ${activeTab} to ${tab}`)

    // Show loading indicator
    setIsLoading(true)

    // Clear monthly stats when switching tabs to prevent showing stale data
    if (tab === "monthly") {
      setMonthlyStats([])
      // Clear cached monthly stats to ensure fresh data
      setCachedMonthlyStats({})
    }

    // Update the active tab
    setActiveTab(tab)

    // Load data with a delay to ensure state updates are processed
    setTimeout(() => {
      console.log(`[TAB] Loading data after tab switch to ${tab}`)
      loadAttendanceData()
    }, 500)
  }

  // Update the goToPreviousMonth and goToNextMonth functions to show loading state
  const goToPreviousMonth = () => {
    // Calculate the new month first
    const newMonth = subMonths(selectedMonth, 1)
    console.log(`[NAV] Navigating from ${format(selectedMonth, "MMMM yyyy")} to ${format(newMonth, "MMMM yyyy")}`)

    // Show loading indicator and clear monthly stats immediately
    setIsLoading(true)
    setMonthlyStats([])

    // Update the selected month state
    setSelectedMonth(newMonth)

    // Remove any cached data for the target month
    const monthKey = format(newMonth, "yyyy-MM")
    setCachedMonthlyStats((prev) => {
      const newCache = { ...prev }
      delete newCache[monthKey]
      return newCache
    })

    // Force a fresh data load with a delay to ensure state updates are processed
    setTimeout(() => {
      console.log(`[NAV] Loading data for ${format(newMonth, "MMMM yyyy")} after navigation`)
      loadAttendanceData()
    }, 500)
  }

  // Similarly update goToNextMonth
  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1)
    // Don't allow selecting future months beyond current
    if (nextMonth <= new Date()) {
      console.log(`[NAV] Navigating from ${format(selectedMonth, "MMMM yyyy")} to ${format(nextMonth, "MMMM yyyy")}`)

      // Show loading indicator and clear monthly stats immediately
      setIsLoading(true)
      setMonthlyStats([])

      // Update the selected month state
      setSelectedMonth(nextMonth)

      // Remove any cached data for the target month
      const monthKey = format(nextMonth, "yyyy-MM")
      setCachedMonthlyStats((prev) => {
        const newCache = { ...prev }
        delete newCache[monthKey]
        return newCache
      })

      // Force a fresh data load with a delay to ensure state updates are processed
      setTimeout(() => {
        console.log(`[NAV] Loading data for ${format(nextMonth, "MMMM yyyy")} after navigation`)
        loadAttendanceData()
      }, 500)
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
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.card,
            },
          ]}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Ionicons name="calendar-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Attendance Data</Text>
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            {activeTab === "monthly"
              ? `No attendance records found for ${format(selectedMonth, "MMMM yyyy")}`
              : "Start taking attendance to see statistics"}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Attendance")}
          >
            <Text style={styles.emptyStateButtonText}>Take Attendance</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View>
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
                      style={[styles.percentageBadge, { backgroundColor: getPercentageColor(stat.theoryPercentage) }]}
                    >
                      <Text style={styles.percentageText}>{stat.theoryPercentage}%</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.theoryLabCell}>
                  <View style={styles.attendanceDetails}>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.labPresent}</Text>
                    <Text style={[styles.attendanceValue, { color: theme.text }]}>{stat.labTotal}</Text>
                    <View style={[styles.percentageBadge, { backgroundColor: getPercentageColor(stat.labPercentage) }]}>
                      <Text style={styles.percentageText}>{stat.labPercentage}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  // Create a refresh button component for the header
  const RefreshButton = () => (
    <TouchableOpacity style={styles.refreshButton} onPress={refreshData} disabled={isRefreshing}>
      <Ionicons name="refresh" size={24} color="white" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Header
        title="Oops Present"
        subtitle={userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Dashboard"}
        rightComponent={<RefreshButton />}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} colors={[theme.primary]} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
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
        </View>

        {/* Tab Selector */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: theme.card,
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

          <TouchableOpacity
            style={[styles.tab, activeTab === "calculator" && [styles.activeTab, { borderBottomColor: theme.primary }]]}
            onPress={() => switchTab("calculator")}
          >
            <Ionicons
              name="calculator"
              size={18}
              color={activeTab === "calculator" ? theme.primary : theme.secondaryText}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.secondaryText },
                activeTab === "calculator" && { color: theme.primary, fontWeight: "600" },
              ]}
            >
              Calculator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector (only for monthly tab) */}
        {activeTab === "monthly" && (
          <View
            style={[
              styles.monthSelector,
              {
                backgroundColor: theme.card,
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
          </View>
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
          ) : activeTab === "calculator" ? (
            // Calculator Tab Content
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance Calculator</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                Calculate your attendance requirements
              </Text>

              {overallStats.length > 0 ? (
                <AttendanceCalculator
                  subject={overallStats[0]?.subject || null}
                  timetable={[]}
                  attendance={{}}
                  selectedDate={format(new Date(), "yyyy-MM-dd")}
                />
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "20" }]}>
                    <Ionicons name="calculator-outline" size={40} color={theme.primary} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Attendance Data</Text>
                  <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                    Start taking attendance to use the calculator
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                    onPress={() => navigation.navigate("Attendance")}
                  >
                    <Text style={styles.emptyStateButtonText}>Take Attendance</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Title */}
              <View style={styles.sectionHeader}>
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
              </View>

              {/* Charts Section */}
              <View style={styles.chartsContainer}>
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
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Update the styles to use consistent spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.screenPadding,
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
    marginTop: spacing.md,
  },
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingBottom: spacing.md,
  },
  statCard: {
    width: "31%",
    borderRadius: spacing.borderRadius.large,
    padding: spacing.sm,
    alignItems: "center",
  },
  statCardElevated: {
    ...createShadow(2),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
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
    marginTop: spacing.xs,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
    ...createShadow(1),
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
    marginRight: spacing.xs,
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
    borderRadius: spacing.borderRadius.large,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...createShadow(1),
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.borderRadius.large,
    marginLeft: spacing.sm,
  },
  currentMonthText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  dashboardContainer: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  chartsContainer: {
    marginBottom: spacing.xl,
  },
  chartCard: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...createShadow(1),
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
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
    marginBottom: spacing.xl,
  },
  tableSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  tableContainer: {
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
    ...createShadow(1),
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
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
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "center",
    alignSelf: "center",
  },
  theoryLabCell: {
    flex: 1.5,
    alignItems: "center",
  },
  attendanceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: spacing.xs,
  },
  attendanceValue: {
    fontSize: 13,
    flex: 1,
    textAlign: "center",
    fontWeight: "500",
  },
  percentageBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.borderRadius.large,
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
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
  },
  errorContainer: {
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  emptyStateButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.large,
  },
  emptyStateButtonText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.xl,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.md,
    width: "31%",
    alignItems: "center",
    ...createShadow(1),
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
    fontWeight: "500",
  },
})
