"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useAttendance } from "../context/AttendanceContext"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isSameMonth, isValid } from "date-fns"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getAttendanceByDate, getAttendanceByDateRange, type AttendanceRecord } from "../firebase/attendanceService"
import { getSemesterTimetable } from "../timetable"
import { LinearGradient } from "expo-linear-gradient"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { SafeAreaView } from "react-native-safe-area-context"
import { getSemesterSettings, type SemesterSettings } from "../firebase/semesterService"
import { getHolidays } from "../utils/holidays"
import { BarChart, LineChart } from "react-native-chart-kit"
import AttendanceCalculator from "../components/AttendanceCalculator"
import { useFocusEffect } from "@react-navigation/native"

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
  theoryCancelled?: number
  labCancelled?: number
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
  const [semesterSettings, setSemesterSettings] = useState<SemesterSettings | null>(null)
  const [isLoadingSemester, setIsLoadingSemester] = useState(true)

  // Add state for caching data to prevent unnecessary reloads
  const [cachedOverallStats, setCachedOverallStats] = useState<SubjectAttendance[]>([])
  const [cachedMonthlyStats, setCachedMonthlyStats] = useState<{ [key: string]: SubjectAttendance[] }>({})
  const [cachedTrendData, setCachedTrendData] = useState<MonthlyDataPoint[]>([])

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

  // Load semester settings first
  useEffect(() => {
    const loadSemesterSettings = async () => {
      if (!user?.uid) return

      setIsLoadingSemester(true)
      try {
        console.log("[SEMESTER] Loading semester settings for user:", user.uid)
        const settings = await getSemesterSettings(user.uid)
        console.log("[SEMESTER] Loaded settings:", settings)
        setSemesterSettings(settings)
      } catch (error) {
        console.error("[SEMESTER] Error loading semester settings:", error)
        // Set default settings on error
        setSemesterSettings({
          startDate: "2025-08-04",
          endDate: "2025-11-26",
        })
      } finally {
        setIsLoadingSemester(false)
      }
    }

    loadSemesterSettings()
  }, [user?.uid])

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        const refreshSemesterSettings = async () => {
          try {
            const settings = await getSemesterSettings(user.uid)
            setSemesterSettings(settings)
          } catch (error) {
            console.error("Error refreshing semester settings:", error)
          }
        }
        refreshSemesterSettings()
      }
    }, [user?.uid])
  )

  const convertTimeToMinutes = useCallback((timeString) => {
    if (!timeString || timeString === "Time TBA") return 0

    // Extract first time from formats like "9:00-10:00" or "9:00"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/)
    if (!timeMatch) return 0

    let hours = Number.parseInt(timeMatch[1])
    const minutes = Number.parseInt(timeMatch[2])

    // If hour is less than 9, assume it's PM (like 1:00 = 13:00)
    if (hours < 9) hours += 12

    return hours * 60 + minutes
  }, [])

  // Get subjects for the user's division, batch, and semester
  const getUserSubjects = () => {
    if (!userProfile?.division || !userProfile?.batch || !userProfile?.semester) {
      console.log("[SUBJECTS] Missing user profile data:", {
        division: userProfile?.division,
        batch: userProfile?.batch,
        semester: userProfile?.semester,
      })
      return []
    }

    const subjects = new Map() // Use Map to store subject with time info
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    try {
      // Get semester-specific timetable
      const semesterTimetable = getSemesterTimetable(userProfile.semester)

      if (!semesterTimetable || !semesterTimetable[userProfile.division]) {
        console.log("[SUBJECTS] No timetable found for semester/division:", {
          semester: userProfile.semester,
          division: userProfile.division,
        })
        return []
      }

      const divisionData = semesterTimetable[userProfile.division]

      // Get subjects from shared schedule
      days.forEach((day) => {
        const sharedSubjects = divisionData.shared?.[day] || []
        sharedSubjects.forEach((subject) => {
          if (subject.subject && subject.time) {
            if (!subjects.has(subject.subject)) {
              subjects.set(subject.subject, convertTimeToMinutes(subject.time))
            }
          }
        })
      })

      // Get subjects from batch-specific schedule
      const batchData = divisionData.batches?.[userProfile.batch]
      if (batchData) {
        days.forEach((day) => {
          const batchSubjects = batchData[day] || []
          batchSubjects.forEach((subject) => {
            if (subject.subject && subject.time) {
              if (!subjects.has(subject.subject)) {
                subjects.set(subject.subject, convertTimeToMinutes(subject.time))
              }
            }
          })
        })
      }

      // Sort subjects by time and return just the subject names
      const sortedSubjects = Array.from(subjects.entries())
        .sort(([, timeA], [, timeB]) => timeA - timeB)
        .map(([subject]) => subject)

      console.log("[SUBJECTS] Found sorted subjects for semester", userProfile.semester, ":", sortedSubjects)
      return sortedSubjects
    } catch (error) {
      console.error("[SUBJECTS] Error getting subjects:", error)
      return []
    }
  }

  // Helper function to check if a date should be excluded (holidays or Sundays)
  const shouldExcludeDate = (dateString: string): boolean => {
    try {
      const date = new Date(dateString)
      if (!isValid(date)) {
        console.warn("[DATE] Invalid date:", dateString)
        return true
      }

      const dayOfWeek = date.getDay()
      const holidays = getHolidays()
      const isHolidayDate = holidays.includes(dateString)

      // Exclude Sundays (0) and holidays
      return dayOfWeek === 0 || isHolidayDate
    } catch (error) {
      console.error("[DATE] Error checking date exclusion:", error)
      return true
    }
  }

  // Load attendance statistics
  const loadAttendanceData = async () => {
    if (!user?.uid || !userProfile?.division || !userProfile?.batch || !userProfile?.semester || isLoadingSemester) {
      console.log("[LOAD] Missing required data:", {
        userId: !!user?.uid,
        division: userProfile?.division,
        batch: userProfile?.batch,
        semester: userProfile?.semester,
        isLoadingSemester,
      })
      return
    }

    console.log(`[LOAD] Starting to load ${activeTab} attendance data`)
    setIsLoading(true)
    setError(null)

    try {
      if (activeTab === "overall") {
        await loadOverallAttendance(user.uid)
      } else if (activeTab === "monthly") {
        await loadMonthlyAttendance(user.uid, selectedMonth)
      }

      // Load trend data only once
      if (trendData.length === 0 && activeTab === "overall") {
        console.log("[LOAD] Loading trend data")
        const newTrendData = await loadAttendanceTrend(user.uid)
        setTrendData(newTrendData)
      }

      // Load today's manual records count
      try {
        const todayRecords = await getAttendanceByDate(user.uid, format(new Date(), "yyyy-MM-dd"))
        const manualCount = todayRecords.filter(
          (record) => record.isManual || record.notes?.includes("[MANUAL]"),
        ).length
        setManualRecordsCount(manualCount)
      } catch (error) {
        console.error("[LOAD] Error loading manual records count:", error)
      }

      console.log(`[LOAD] Successfully loaded ${activeTab} attendance data`)
    } catch (error) {
      console.error("[LOAD] Error loading attendance data:", error)
      if (error instanceof Error) {
        if (error.toString().includes("requires an index")) {
          setError(
            "Firebase index required. Please follow the instructions in the console to create the necessary index.",
          )
        } else {
          setError(`Failed to load attendance data: ${error.message}`)
        }
      } else {
        setError("Failed to load attendance data. Please try again.")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Load overall attendance (semester-wide)
  const loadOverallAttendance = async (userId: string) => {
    try {
      console.log("[OVERALL] Loading overall attendance")

      // Get semester settings
      const startDate = semesterSettings?.startDate || "2025-08-04"
      const endDate = semesterSettings?.endDate || "2025-11-26"

      console.log("[OVERALL] Using date range:", { startDate, endDate })

      // Get user's subjects based on their division/batch/semester
      const userSubjects = getUserSubjects()

      if (userSubjects.length === 0) {
        console.log("[OVERALL] No subjects found for user's division/batch/semester")
        setOverallStats([])
        setOverallTheoryAttendance(0)
        setOverallLabAttendance(0)
        return
      }

      // Initialize stats for all subjects
      const stats: { [key: string]: SubjectAttendance } = {}

      userSubjects.forEach((subject) => {
        stats[subject] = {
          subject,
          theoryTotal: 0,
          theoryPresent: 0,
          theoryPercentage: 0,
          labTotal: 0,
          labPresent: 0,
          labPercentage: 0,
          theoryCancelled: 0,
          labCancelled: 0,
          importedData: {
            theoryTotal: 0,
            theoryAttended: 0,
            labTotal: 0,
            labAttended: 0,
          },
        }
      })

      // Get attendance records for the semester period
      const recordsByDate = await getAttendanceByDateRange(userId, startDate, endDate)
      console.log(`[OVERALL] Retrieved ${Object.keys(recordsByDate).length} days of records`)

      // Process all attendance records
      Object.entries(recordsByDate).forEach(([date, dateRecords]) => {
        // Skip if date should be excluded (holidays/Sundays)
        if (shouldExcludeDate(date)) {
          return
        }

        dateRecords.forEach((record: AttendanceRecord) => {
          if (!stats[record.subject]) {
            // Skip if subject is not in our list
            return
          }

          if (record.type === "theory") {
            if (record.status === "cancelled") {
              stats[record.subject].theoryCancelled++
            } else if (record.status && record.status !== "") {
              stats[record.subject].theoryTotal++
              if (record.status === "present") {
                stats[record.subject].theoryPresent++
              }
            }
          } else if (record.type === "lab") {
            if (record.status === "cancelled") {
              stats[record.subject].labCancelled++
            } else if (record.status && record.status !== "") {
              stats[record.subject].labTotal++
              if (record.status === "present") {
                stats[record.subject].labPresent++
              }
            }
          }
        })
      })

      // Fetch and add imported attendance data
      for (const subject of userSubjects) {
        try {
          const importedDataRef = doc(db, "importedAttendance", `${userId}_${subject}`)
          const importedDoc = await getDoc(importedDataRef)

          if (importedDoc.exists()) {
            const data = importedDoc.data()
            console.log(`[OVERALL] Found imported data for ${subject}:`, data)

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
          console.error(`[OVERALL] Error fetching imported data for ${subject}:`, error)
        }
      }

      // Calculate percentages with bounds checking
      Object.values(stats).forEach((stat) => {
        // Ensure values are non-negative
        stat.theoryPresent = Math.max(0, stat.theoryPresent)
        stat.theoryTotal = Math.max(0, stat.theoryTotal)
        stat.labPresent = Math.max(0, stat.labPresent)
        stat.labTotal = Math.max(0, stat.labTotal)

        // Ensure present doesn't exceed total
        stat.theoryPresent = Math.min(stat.theoryPresent, stat.theoryTotal)
        stat.labPresent = Math.min(stat.labPresent, stat.labTotal)

        // Calculate percentages
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0

        // Ensure percentages are within 0-100 range
        stat.theoryPercentage = Math.min(100, Math.max(0, stat.theoryPercentage))
        stat.labPercentage = Math.min(100, Math.max(0, stat.labPercentage))
      })

      // Filter out subjects with no attendance records and sort
      const filteredStats = Object.values(stats)
        .filter((stat) => stat.theoryTotal > 0 || stat.labTotal > 0)
        .sort((a, b) => a.subject.localeCompare(b.subject))

      // Assign colors to subjects
      filteredStats.forEach((stat, index) => {
        stat.color = subjectColors[index % subjectColors.length]
      })

      console.log(`[OVERALL] Final stats for ${filteredStats.length} subjects:`)
      filteredStats.forEach((stat) => {
        console.log(
          `  ${stat.subject}: Theory ${stat.theoryPresent}/${stat.theoryTotal} (${stat.theoryPercentage}%), Lab ${stat.labPresent}/${stat.labTotal} (${stat.labPercentage}%)`,
        )
      })

      setOverallStats(filteredStats)
      setCachedOverallStats(filteredStats)

      // Calculate overall attendance percentages with bounds checking
      const totalTheoryPresent = filteredStats.reduce((sum, stat) => sum + stat.theoryPresent, 0)
      const totalTheoryClasses = filteredStats.reduce((sum, stat) => sum + stat.theoryTotal, 0)
      const overallTheoryPercentage =
        totalTheoryClasses > 0
          ? Math.min(100, Math.max(0, Math.round((totalTheoryPresent / totalTheoryClasses) * 100)))
          : 0
      setOverallTheoryAttendance(overallTheoryPercentage)

      const totalLabPresent = filteredStats.reduce((sum, stat) => sum + stat.labPresent, 0)
      const totalLabClasses = filteredStats.reduce((sum, stat) => sum + stat.labTotal, 0)
      const overallLabPercentage =
        totalLabClasses > 0 ? Math.min(100, Math.max(0, Math.round((totalLabPresent / totalLabClasses) * 100))) : 0
      setOverallLabAttendance(overallLabPercentage)

      console.log(`[OVERALL] Overall percentages - Theory: ${overallTheoryPercentage}%, Lab: ${overallLabPercentage}%`)
    } catch (error) {
      console.error("[OVERALL] Error loading overall attendance:", error)
      throw error
    }
  }

  // Load monthly attendance
  const loadMonthlyAttendance = async (userId: string, month: Date) => {
    try {
      console.log(`[MONTHLY] Loading attendance for ${format(month, "MMMM yyyy")}`)

      // Clear any existing monthly stats first to prevent showing stale data
      setMonthlyStats([])

      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const startDateStr = format(monthStart, "yyyy-MM-dd")
      const endDateStr = format(monthEnd, "yyyy-MM-dd")

      // Get semester settings
      const semesterStart = semesterSettings?.startDate || "2025-08-04"
      const semesterEnd = semesterSettings?.endDate || "2025-11-26"

      // Ensure we only look at dates within the semester
      const actualStartDate = startDateStr > semesterStart ? startDateStr : semesterStart
      const actualEndDate = endDateStr < semesterEnd ? endDateStr : semesterEnd

      console.log(`[MONTHLY] Date range: ${actualStartDate} to ${actualEndDate}`)

      // If the month is outside the semester, return empty
      if (actualStartDate > actualEndDate) {
        console.log(`[MONTHLY] Month ${format(month, "MMMM yyyy")} is outside semester range`)
        setMonthlyStats([])
        return
      }

      // Check if we have cached data for this month
      const monthKey = format(month, "yyyy-MM")
      if (cachedMonthlyStats[monthKey]) {
        console.log(`[MONTHLY] Using cached data for ${format(month, "MMMM yyyy")}`)
        setMonthlyStats(cachedMonthlyStats[monthKey])
        return
      }

      // Get user's subjects
      const userSubjects = getUserSubjects()

      if (userSubjects.length === 0) {
        console.log("[MONTHLY] No subjects found")
        setMonthlyStats([])
        return
      }

      // Get records for specific date range
      const recordsByDate = await getAttendanceByDateRange(userId, actualStartDate, actualEndDate)

      // Check if there are any records for this month
      const hasRecordsForMonth = Object.keys(recordsByDate).length > 0

      // If no records exist for this month, set empty stats and return
      if (!hasRecordsForMonth) {
        console.log(`[MONTHLY] No attendance records found for ${format(month, "MMMM yyyy")}`)
        setMonthlyStats([])
        return
      }

      // Initialize stats for subjects that have records this month
      const stats: { [key: string]: SubjectAttendance } = {}

      userSubjects.forEach((subject) => {
        stats[subject] = {
          subject,
          theoryTotal: 0,
          theoryPresent: 0,
          theoryPercentage: 0,
          labTotal: 0,
          labPresent: 0,
          labPercentage: 0,
          theoryCancelled: 0,
          labCancelled: 0,
          importedData: {
            theoryTotal: 0,
            theoryAttended: 0,
            labTotal: 0,
            labAttended: 0,
          },
        }
      })

      // Process all records for this month
      Object.entries(recordsByDate).forEach(([date, dateRecords]) => {
        // Skip if date should be excluded (holidays/Sundays)
        if (shouldExcludeDate(date)) {
          return
        }

        dateRecords.forEach((record) => {
          // Skip imported data
          if (record.notes?.includes("[IMPORTED]")) {
            return
          }

          if (!stats[record.subject]) {
            // Skip if subject is not in our list
            return
          }

          if (record.type === "theory") {
            if (record.status === "cancelled") {
              stats[record.subject].theoryCancelled++
            } else if (record.status && record.status !== "") {
              // Only count records with actual status (present/absent) as conducted
              stats[record.subject].theoryTotal++
              if (record.status === "present") {
                stats[record.subject].theoryPresent++
              }
            }
          } else if (record.type === "lab") {
            if (record.status === "cancelled") {
              stats[record.subject].labCancelled++
            } else if (record.status && record.status !== "") {
              // Only count records with actual status (present/absent) as conducted
              stats[record.subject].labTotal++
              if (record.status === "present") {
                stats[record.subject].labPresent++
              }
            }
          }
        })
      })

      // Calculate percentages with bounds checking
      Object.values(stats).forEach((stat) => {
        // Ensure values are non-negative
        stat.theoryPresent = Math.max(0, stat.theoryPresent)
        stat.theoryTotal = Math.max(0, stat.theoryTotal)
        stat.labPresent = Math.max(0, stat.labPresent)
        stat.labTotal = Math.max(0, stat.labTotal)

        // Ensure present doesn't exceed total
        stat.theoryPresent = Math.min(stat.theoryPresent, stat.theoryTotal)
        stat.labPresent = Math.min(stat.labPresent, stat.labTotal)

        // Calculate percentages
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0

        // Ensure percentages are within 0-100 range
        stat.theoryPercentage = Math.min(100, Math.max(0, stat.theoryPercentage))
        stat.labPercentage = Math.min(100, Math.max(0, stat.labPercentage))
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

      console.log(`[MONTHLY] Final stats for ${filteredStats.length} subjects in ${format(month, "MMMM yyyy")}`)

      // Cache the results
      setCachedMonthlyStats((prev) => ({
        ...prev,
        [monthKey]: filteredStats,
      }))

      // Update state with the new stats
      setMonthlyStats(filteredStats)
    } catch (error) {
      console.error(`[MONTHLY] Error loading monthly attendance for ${format(month, "MMMM yyyy")}:`, error)
      setMonthlyStats([])
      throw error
    }
  }

  // Load attendance trend (6 months)
  const loadAttendanceTrend = async (userId: string): Promise<MonthlyDataPoint[]> => {
    try {
      console.log("[TREND] Loading attendance trend for semester period")

      // If we have cached trend data, use it
      if (cachedTrendData.length > 0) {
        console.log("[TREND] Using cached trend data")
        return cachedTrendData
      }

      // Get semester settings
      const semesterStart = semesterSettings?.startDate || "2025-08-04"
      const semesterEnd = semesterSettings?.endDate || "2025-11-26"

      console.log("[TREND] Semester period:", { semesterStart, semesterEnd })

      // Parse semester dates
      const startDate = new Date(semesterStart)
      const endDate = new Date(semesterEnd)

      // Validate dates
      if (!isValid(startDate) || !isValid(endDate)) {
        console.error("[TREND] Invalid semester dates")
        return []
      }

      // Generate all months from semester start to end
      const months: Date[] = []
      let currentMonth = startOfMonth(startDate)
      const lastMonth = startOfMonth(endDate)

      while (currentMonth <= lastMonth) {
        months.push(new Date(currentMonth))
        currentMonth = addMonths(currentMonth, 1)
      }

      console.log(`[TREND] Generated ${months.length} months for trend:`, months.map(m => format(m, "MMM yyyy")))

      // Get user's subjects
      const userSubjects = getUserSubjects()

      if (userSubjects.length === 0) {
        console.log("[TREND] No subjects found")
        // Return empty data with month labels
        return months.map(month => ({
          month: format(month, "MMM"),
          theoryAttendance: 0,
          labAttendance: 0,
        }))
      }

      // Fetch all attendance data at once to reduce Firebase calls
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", userId),
        where("date", ">=", semesterStart),
        where("date", "<=", semesterEnd),
      )
      const querySnapshot = await getDocs(attendanceQuery)

      // Store all records in memory for faster processing
      const allRecords: { [date: string]: AttendanceRecord[] } = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.date && data.records && Array.isArray(data.records)) {
          allRecords[data.date] = data.records
        }
      })

      console.log(`[TREND] Retrieved ${Object.keys(allRecords).length} days of records for trend analysis`)

      // Process each month using the in-memory records
      const trendData: MonthlyDataPoint[] = []

      for (const month of months) {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        const startDateStr = format(monthStart, "yyyy-MM-dd")
        const endDateStr = format(monthEnd, "yyyy-MM-dd")

        // Ensure we only look at dates within the semester
        const actualStartDate = startDateStr > semesterStart ? startDateStr : semesterStart
        const actualEndDate = endDateStr < semesterEnd ? endDateStr : semesterEnd

        let theoryPresent = 0
        let theoryTotal = 0
        let labPresent = 0
        let labTotal = 0

        // If month is within semester range
        if (actualStartDate <= actualEndDate) {
          // Process records for this month
          Object.entries(allRecords).forEach(([date, records]) => {
            if (date >= actualStartDate && date <= actualEndDate && !shouldExcludeDate(date)) {
              records.forEach((record: any) => {
                // Skip imported data for trend analysis
                if (record.notes?.includes("[IMPORTED]")) {
                  return
                }

                if (!userSubjects.includes(record.subject)) {
                  return // Skip subjects not in user's timetable
                }

                if (record.status === "cancelled") {
                  return // Skip cancelled classes
                }

                if (record.type === "theory" && record.status && record.status !== "") {
                  theoryTotal++
                  if (record.status === "present") {
                    theoryPresent++
                  }
                } else if (record.type === "lab" && record.status && record.status !== "") {
                  labTotal++
                  if (record.status === "present") {
                    labPresent++
                  }
                }
              })
            }
          })
        }

        const theoryPercentage = theoryTotal > 0 ? Math.round((theoryPresent / theoryTotal) * 100) : 0
        const labPercentage = labTotal > 0 ? Math.round((labPresent / labTotal) * 100) : 0

        trendData.push({
          month: format(month, "MMM"),
          theoryAttendance: theoryPercentage,
          labAttendance: labPercentage,
        })

        console.log(`[TREND] ${format(month, "MMM yyyy")}: Theory ${theoryPresent}/${theoryTotal} (${theoryPercentage}%), Lab ${labPresent}/${labTotal} (${labPercentage}%)`)
      }

      // Cache the trend data
      setCachedTrendData(trendData)

      console.log("[TREND] Final trend data:", trendData)
      return trendData
    } catch (error) {
      console.error("[TREND] Error loading attendance trend:", error)

      // Return empty data with semester month labels if there's an error
      if (semesterSettings) {
        const startDate = new Date(semesterSettings.startDate)
        const endDate = new Date(semesterSettings.endDate)

        if (isValid(startDate) && isValid(endDate)) {
          const months: MonthlyDataPoint[] = []
          let currentMonth = startOfMonth(startDate)
          const lastMonth = startOfMonth(endDate)

          while (currentMonth <= lastMonth) {
            months.push({
              month: format(currentMonth, "MMM"),
              theoryAttendance: 0,
              labAttendance: 0,
            })
            currentMonth = addMonths(currentMonth, 1)
          }

          return months
        }
      }

      // Fallback to current semester months if semester settings are not available
      const fallbackStart = new Date("2025-08-04")
      const fallbackEnd = new Date("2025-11-26")
      const months: MonthlyDataPoint[] = []
      let currentMonth = startOfMonth(fallbackStart)
      const lastMonth = startOfMonth(fallbackEnd)

      while (currentMonth <= lastMonth) {
        months.push({
          month: format(currentMonth, "MMM"),
          theoryAttendance: 0,
          labAttendance: 0,
        })
        currentMonth = addMonths(currentMonth, 1)
      }

      return months
    }
  }

  // Update the trend chart width calculation to accommodate variable number of months
  const getTrendChartWidth = () => {
    const monthCount = trendData.length
    const minWidth = SCREEN_WIDTH - 64
    const dynamicWidth = Math.max(minWidth, monthCount * 60) // 60px per month minimum
    return dynamicWidth
  }

  // Add effect to clear cache when user changes
  useEffect(() => {
    if (user?.uid) {
      // Clear cache when user changes
      setCachedOverallStats([])
      setCachedMonthlyStats({})
      setCachedTrendData([])
    }
  }, [user?.uid, userProfile?.semester])

  // Load data when component mounts or when tab/month changes
  useEffect(() => {
    if (
      user?.uid &&
      userProfile?.division &&
      userProfile?.batch &&
      userProfile?.semester &&
      semesterSettings &&
      !isLoadingSemester
    ) {
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
      }, 300)

      return () => {
        // Clean up timer on unmount or when dependencies change
        clearTimeout(timer)
      }
    }
  }, [
    user?.uid,
    userProfile?.division,
    userProfile?.batch,
    userProfile?.semester,
    activeTab,
    selectedMonth,
    semesterSettings,
    isLoadingSemester,
  ])

  // Refresh data
  const refreshData = () => {
    console.log("[REFRESH] Refreshing data")
    setIsRefreshing(true)

    // Clear cache to force re-fetch
    setCachedOverallStats([])
    setCachedMonthlyStats({})
    setCachedTrendData([])
    setTrendData([])

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
    }

    // Update the active tab
    setActiveTab(tab)
  }

  // Update the goToPreviousMonth and goToNextMonth functions
  const goToPreviousMonth = () => {
    const newMonth = subMonths(selectedMonth, 1)
    console.log(`[NAV] Navigating from ${format(selectedMonth, "MMMM yyyy")} to ${format(newMonth, "MMMM yyyy")}`)

    // Show loading indicator and clear monthly stats immediately
    setIsLoading(true)
    setMonthlyStats([])

    // Update the selected month state
    setSelectedMonth(newMonth)
  }

  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1)
    console.log(`[NAV] Navigating from ${format(selectedMonth, "MMMM yyyy")} to ${format(nextMonth, "MMMM yyyy")}`)

    // Show loading indicator and clear monthly stats immediately
    setIsLoading(true)
    setMonthlyStats([])

    // Update the selected month state
    setSelectedMonth(nextMonth)
  }

  const getSemesterInfo = () => {
    const startDate = semesterSettings?.startDate || "2025-08-04"
    const endDate = semesterSettings?.endDate || "2025-11-26"

    return `Semester ${userProfile?.semester || ""} attendance from ${format(new Date(startDate), "MMM d")} to ${format(new Date(endDate), "MMM d, yyyy")}`
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
            <Text style={[styles.headerCell, styles.subjectCell, { color: "white", verticalAlign: "middle" }]}>Subject</Text>
            <View style={styles.theoryLabCell}>
              <Text style={[styles.headerCell, { color: "white" }]}>Theory</Text>
              <View style={styles.attendanceDetails}>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Att.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Cond.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>%</Text>
              </View>
            </View>
            <View style={styles.theoryLabCell}>
              <Text style={[styles.headerCell, { color: "white" }]}>Lab</Text>
              <View style={styles.attendanceDetails}>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Att.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>Cond.</Text>
                <Text style={[styles.smallHeaderCell, { color: "rgba(255,255,255,0.8)" }]}>%</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Table Rows */}
          {stats.map((stat, index) => {
            return (
              <React.Fragment key={stat.subject}>
                <View
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
                      <View
                        style={[styles.percentageBadge, { backgroundColor: getPercentageColor(stat.labPercentage) }]}
                      >
                        <Text style={styles.percentageText}>{stat.labPercentage}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            )
          })}
        </View>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
          <Ionicons name="home" size={28} color="white" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.appName, { color: theme.text }]}>Dashboard</Text>
          <Text style={[styles.appSubtitle, { color: theme.secondaryText }]}>
            {userProfile?.division
              ? `Division ${userProfile.division} - Batch ${userProfile.batch}${userProfile?.semester ? ` - Semester ${userProfile.semester}` : ""
              }`
              : "Your Attendance Overview"}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData} disabled={isRefreshing}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  )

  // Show loading if semester settings are still loading
  if (isLoadingSemester) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />

        <LinearGradient colors={[theme.primary + "10", theme.background]} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={[]}>
            <View style={styles.statusBarSpacer} />
            {renderHeader()}

            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading semester settings...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    )
  }

  // Show setup message if user hasn't completed setup
  if (!userProfile?.division || !userProfile?.batch || !userProfile?.semester) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />

        <LinearGradient colors={[theme.primary + "10", theme.background]} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={[]}>
            <View style={styles.statusBarSpacer} />
            {renderHeader()}

            <View style={[styles.setupContainer, { backgroundColor: theme.card }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + "20" }]}>
                <Ionicons name="settings-outline" size={40} color={theme.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Setup Required</Text>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                Please complete your profile setup including division, batch, and semester to view attendance statistics
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate("Settings")}
              >
                <Text style={styles.emptyStateButtonText}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* Status Bar Configuration */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      <LinearGradient colors={[theme.primary + "10", theme.background]} style={styles.container}>
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1, { backgroundColor: theme.primary + "20" }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: theme.primary + "15" }]} />
        <View style={[styles.circle, styles.circle3, { backgroundColor: theme.primary + "10" }]} />

        <SafeAreaView style={styles.safeArea} edges={[]}>
          <View style={styles.statusBarSpacer} />
          {renderHeader()}

          {/* Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
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
              style={[
                styles.tab,
                activeTab === "calculator" && [styles.activeTab, { borderBottomColor: theme.primary }],
              ]}
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
            <View style={[styles.monthSelector, { backgroundColor: theme.card }]}>
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
                style={[styles.monthNavButton, { backgroundColor: theme.primary + "15" }]}
                onPress={goToNextMonth}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />}
            showsVerticalScrollIndicator={false}
          >
            {/* Tab Content */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading attendance data...</Text>
              </View>
            ) : error ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="alert-circle" size={40} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={refreshData}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : activeTab === "calculator" ? (
              // Calculator Tab Content
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance Calculator</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                  Calculate your attendance requirements for 75% criteria
                </Text>

                <AttendanceCalculator isTabView={true} />
              </View>
            ) : (
              <>
                {/* Attendance Table */}
                <View style={styles.tableSection}>
                  <Text style={[styles.tableSectionTitle, { color: theme.text }]}>Detailed Attendance</Text>
                  {renderAttendanceTable(activeTab === "overall" ? overallStats : monthlyStats)}
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
                        fromZero={true}
                        segments={4}
                        yAxisInterval={1}
                        chartConfig={{
                          backgroundColor: theme.card,
                          backgroundGradientFrom: theme.card,
                          backgroundGradientTo: theme.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => "#4f46e5",
                          labelColor: (opacity = 1) => theme.text,
                          barPercentage: 0.6,
                          yAxisMin: 0,
                          yAxisMax: 100,
                          formatYLabel: (value) => {
                            const numValue = parseFloat(value);
                            if (numValue === 0) return "0";
                            if (numValue === 25) return "25";
                            if (numValue === 50) return "50";
                            if (numValue === 75) return "75";
                            if (numValue === 100) return "100";
                            return "0";
                          },
                        }}
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                        showValuesOnTopOfBars
                      />
                    </ScrollView>
                  </View>

                  <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Lab Attendance (%)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={getLabBarChartData()}
                        width={Math.max(SCREEN_WIDTH - 64, getLabBarChartData().labels.length * 60)}
                        height={180}
                        yAxisSuffix="%"
                        fromZero={true}
                        segments={4}
                        yAxisInterval={1}
                        chartConfig={{
                          backgroundColor: theme.card,
                          backgroundGradientFrom: theme.card,
                          backgroundGradientTo: theme.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => "#0ea5e9",
                          labelColor: (opacity = 1) => theme.text,
                          barPercentage: 0.6,
                          yAxisMin: 0,
                          yAxisMax: 100,
                          formatYLabel: (value) => {
                            const numValue = parseFloat(value);
                            if (numValue === 0) return "0";
                            if (numValue === 25) return "25";
                            if (numValue === 50) return "50";
                            if (numValue === 75) return "75";
                            if (numValue === 100) return "100";
                            return "0";
                          },
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
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <LineChart
                            data={getTheoryTrendData()}
                            width={getTrendChartWidth()}
                            height={180}
                            yAxisSuffix="%"
                            chartConfig={{
                              backgroundColor: theme.card,
                              backgroundGradientFrom: theme.card,
                              backgroundGradientTo: theme.card,
                              decimalPlaces: 0,
                              color: (opacity = 1) => "#4f46e5",
                              labelColor: (opacity = 1) => theme.text,
                              propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: "#4f46e5",
                              },
                              yAxisMin: 0,
                              yAxisMax: 100,
                              formatYLabel: (value) => {
                                const numValue = parseFloat(value);
                                if (numValue === 0) return "0";
                                if (numValue === 25) return "25";
                                if (numValue === 50) return "50";
                                if (numValue === 75) return "75";
                                if (numValue === 100) return "100";
                                return "";
                              },
                            }}
                            segments={4}
                            bezier
                            style={{
                              marginVertical: 8,
                              borderRadius: 16,
                            }}
                          />
                        </ScrollView>
                      </View>

                      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.chartTitle, { color: theme.text }]}>Lab Attendance Trend</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <LineChart
                            data={getLabTrendData()}
                            width={getTrendChartWidth()}
                            height={180}
                            yAxisSuffix="%"
                            chartConfig={{
                              backgroundColor: theme.card,
                              backgroundGradientFrom: theme.card,
                              backgroundGradientTo: theme.card,
                              decimalPlaces: 0,
                              color: (opacity = 1) => "#0ea5e9",
                              labelColor: (opacity = 1) => theme.text,
                              propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: "#0ea5e9",
                              },
                              yAxisMin: 0,
                              yAxisMax: 100,
                              formatYLabel: (value) => {
                                const numValue = parseFloat(value);
                                if (numValue === 0) return "0";
                                if (numValue === 25) return "25";
                                if (numValue === 50) return "50";
                                if (numValue === 75) return "75";
                                if (numValue === 100) return "100";
                                return "";
                              },
                            }}
                            segments={4}
                            bezier
                            style={{
                              marginVertical: 8,
                              borderRadius: 16,
                            }}
                          />
                        </ScrollView>
                      </View>
                    </>
                  )}
                </View>
                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.summaryTitle, { color: theme.text }]}>
                    {activeTab === "overall" ? "Overall Summary" : "Monthly Summary"}
                  </Text>
                  <Text style={[styles.summarySubtitle, { color: theme.secondaryText }]}>
                    {activeTab === "overall"
                      ? getSemesterInfo()
                      : `Attendance for ${format(selectedMonth, "MMMM yyyy")}`}
                  </Text>

                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStatItem}>
                      <Text style={[styles.summaryStatLabel, { color: theme.secondaryText }]}>Theory (Att/Cond)</Text>
                      <Text style={[styles.summaryStatValue, { color: theme.text }]}>
                        {(activeTab === "overall" ? overallStats : monthlyStats).reduce(
                          (sum, stat) => sum + stat.theoryPresent,
                          0,
                        )}
                        /
                        {(activeTab === "overall" ? overallStats : monthlyStats).reduce(
                          (sum, stat) => sum + stat.theoryTotal,
                          0,
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.summaryStatPercentage,
                          {
                            color: overallTheoryAttendance >= 75 ? theme.present : theme.absent,
                          },
                        ]}
                      >
                        {activeTab === "overall"
                          ? overallTheoryAttendance
                          : activeTab === "monthly" && monthlyStats.length > 0
                            ? Math.round(
                              (monthlyStats.reduce((sum, stat) => sum + stat.theoryPresent, 0) /
                                Math.max(
                                  1,
                                  monthlyStats.reduce((sum, stat) => sum + stat.theoryTotal, 0),
                                )) *
                              100,
                            )
                            : 0}
                        %
                      </Text>
                    </View>

                    <View style={styles.summaryStatItem}>
                      <Text style={[styles.summaryStatLabel, { color: theme.secondaryText }]}>Lab (Att/Cond)</Text>
                      <Text style={[styles.summaryStatValue, { color: theme.text }]}>
                        {(activeTab === "overall" ? overallStats : monthlyStats).reduce(
                          (sum, stat) => sum + stat.labPresent,
                          0,
                        )}
                        /
                        {(activeTab === "overall" ? overallStats : monthlyStats).reduce(
                          (sum, stat) => sum + stat.labTotal,
                          0,
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.summaryStatPercentage,
                          {
                            color: overallLabAttendance >= 75 ? theme.present : theme.absent,
                          },
                        ]}
                      >
                        {activeTab === "overall"
                          ? overallLabAttendance
                          : activeTab === "monthly" && monthlyStats.length > 0
                            ? Math.round(
                              (monthlyStats.reduce((sum, stat) => sum + stat.labPresent, 0) /
                                Math.max(
                                  1,
                                  monthlyStats.reduce((sum, stat) => sum + stat.labTotal, 0),
                                )) *
                              100,
                            )
                            : 0}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  statusBarSpacer: {
    height: 44,
    width: "100%",
  },
  circle: {
    position: "absolute",
    borderRadius: 9999,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 200,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 150,
    right: -50,
  },
  header: {
    padding: 16,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4f46e520",
    justifyContent: "center",
    alignItems: "center",
  },
  setupContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionCard: {
    width: "31%",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 16,
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
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorContainer: {
    padding: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 8,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryStatItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryStatPercentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartsContainer: {
    marginBottom: 24,
  },
  chartCard: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  tableSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  tableSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    width: "33%",
  },
  subjectCell: {
    flex: 2,
    textAlign: "left",
  },
  theoryLabCell: {
    flex: 2.5,
    alignItems: "center",
    marginLeft: 30,
  },
  attendanceDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  attendanceValue: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    width: "33%",
  },
  percentageBadge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  emptyState: {
    margin: 16,
    padding: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "white",
    fontWeight: "600",
  },
})