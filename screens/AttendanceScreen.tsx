"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getDaySubjects } from "../timetable"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns"
import { saveAttendance, getAttendanceByDate, type AttendanceRecord } from "../firebase/attendanceService"
import { useToast } from "../context/ToastContext"
import { SafeAreaView } from "react-native-safe-area-context"
import Header from "../components/Header"

// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"

// Add a new import for the AttendanceCalculator component
import AttendanceCalculator from "../components/AttendanceCalculator"

// Define the subject type based on the timetable structure
type SubjectType = {
  subject: string
  type: string[]
}

export default function AttendanceScreen() {
  const { user, userProfile } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { showToast } = useToast()

  // Success message animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [timetable, setTimetable] = useState<SubjectType[]>([])
  const [attendance, setAttendance] = useState<{ [key: string]: { status: "present" | "absent"; notes?: string } }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [markedDates, setMarkedDates] = useState<{ [date: string]: boolean }>({})
  const [loadingMarkedDates, setLoadingMarkedDates] = useState(false)

  // Show success message
  const showSuccessMessage = useCallback(
    (message: string) => {
      setSuccessMessage(message)
      setShowSuccess(true)

      // Animate the message
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false)
      })
    },
    [fadeAnim],
  )

  // Get day of week from date
  const getDayOfWeek = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[date.getDay()]
  }, [])

  // Load timetable for selected date
  const loadTimetable = useCallback(() => {
    if (!userProfile?.division || !userProfile?.batch) return []

    const dayOfWeek = getDayOfWeek(selectedDate)

    // Weekend check
    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
      return []
    }

    try {
      const subjects = getDaySubjects(userProfile.division, userProfile.batch, dayOfWeek)
      return subjects || []
    } catch (error) {
      console.error("Error loading timetable:", error)
      return []
    }
  }, [selectedDate, userProfile?.division, userProfile?.batch, getDayOfWeek])

  // Load attendance records for selected date
  const loadAttendance = useCallback(async () => {
    if (!user?.uid) return {}

    try {
      const records = await getAttendanceByDate(user.uid, selectedDate)

      // Convert array to object for easier access
      const attendanceMap: { [key: string]: { status: "present" | "absent"; notes?: string } } = {}
      records.forEach((record) => {
        const key = `${record.subject}_${record.type}`
        attendanceMap[key] = {
          status: record.status,
          notes: record.notes || "",
        }
      })

      return attendanceMap
    } catch (error) {
      console.error("Error loading attendance:", error)
      Alert.alert("Error", "Failed to load attendance records")
      return {}
    }
  }, [selectedDate, user?.uid])

  // Initialize attendance status for subjects without records
  const initializeAttendance = useCallback((currentTimetable: SubjectType[], currentAttendance: any) => {
    const newAttendance = { ...currentAttendance }

    currentTimetable.forEach((subject) => {
      subject.type.forEach((type) => {
        const key = `${subject.subject}_${type}`
        if (!newAttendance[key]) {
          newAttendance[key] = { status: "absent", notes: "" }
        }
      })
    })

    return newAttendance
  }, [])

  // Toggle attendance status
  const toggleAttendance = useCallback((subject: string, type: string) => {
    setAttendance((prev) => {
      const key = `${subject}_${type}`
      const currentStatus = prev[key]?.status || "absent"

      return {
        ...prev,
        [key]: {
          ...prev[key],
          status: currentStatus === "present" ? "absent" : "present",
        },
      }
    })
  }, [])

  // Load data when component mounts or date changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // Load timetable
      const newTimetable = loadTimetable()
      setTimetable(newTimetable)

      // Load attendance
      const newAttendance = await loadAttendance()

      // Initialize attendance with the new timetable and attendance data
      const initializedAttendance = initializeAttendance(newTimetable, newAttendance)
      setAttendance(initializedAttendance)

      setIsLoading(false)
    }

    fetchData()
  }, [selectedDate, loadTimetable, loadAttendance, initializeAttendance])

  // Load marked dates when month changes
  useEffect(() => {
    const fetchMarkedDates = async () => {
      if (!user?.uid) return

      setLoadingMarkedDates(true)

      try {
        // In a real app, you'd query Firebase for all dates with records in this month
        // For now, we'll just mark the selected date if it has records
        const records = await getAttendanceByDate(user.uid, selectedDate)
        const newMarkedDates: { [date: string]: boolean } = { ...markedDates }

        if (records.length > 0) {
          newMarkedDates[selectedDate] = true
        }

        setMarkedDates(newMarkedDates)
      } catch (error) {
        console.error("Error loading marked dates:", error)
      } finally {
        setLoadingMarkedDates(false)
      }
    }

    fetchMarkedDates()
    // We're intentionally not including markedDates in the dependency array
    // to avoid an infinite loop
  }, [currentMonth, selectedDate, user?.uid])

  // Save attendance records
  const saveAttendanceRecords = async () => {
    if (!user?.uid) {
      showToast({
        message: "You must be logged in to save attendance",
        type: "error",
      })
      return
    }

    if (timetable.length === 0) {
      showToast({
        message: "No classes to mark attendance for",
        type: "warning",
      })
      return
    }

    setIsSaving(true)
    try {
      const records: AttendanceRecord[] = []

      // Convert attendance object to array of records
      Object.entries(attendance).forEach(([key, value]) => {
        const [subject, type] = key.split("_")
        records.push({
          date: selectedDate,
          subject,
          type,
          status: value.status,
          notes: value.notes || "",
        })
      })

      await saveAttendance(user.uid, records)

      // Show success message with toast instead of animation
      showToast({
        message: "Attendance saved successfully!",
        type: "success",
      })

      // Update marked dates
      setMarkedDates((prev) => ({
        ...prev,
        [selectedDate]: true,
      }))
    } catch (error) {
      console.error("Error saving attendance:", error)
      showToast({
        message: "Failed to save attendance records",
        type: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Generate days for the current month
  const getDaysInMonth = useCallback(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const previousMonth = new Date(prev)
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      return previousMonth
    })
  }, [])

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const nextMonth = new Date(prev)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    })
  }, [])

  // Custom calendar component with improved UI
  const renderCalendar = useCallback(() => {
    const days = getDaysInMonth()
    const today = new Date()

    // Calculate the day of the week for the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayOfMonth = getDay(startOfMonth(currentMonth))

    // Create empty slots for days before the first day of the month
    const emptySlots = Array(firstDayOfMonth).fill(null)

    // Calculate total cells needed (empty slots + days in month)
    const totalCells = emptySlots.length + days.length

    // Calculate how many rows we need (7 columns per row)
    const rows = Math.ceil(totalCells / 7)

    return (
      <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={[styles.calendarNavButton, { backgroundColor: theme.primary + "20" }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthTitle, { color: theme.text }]}>{format(currentMonth, "MMMM yyyy")}</Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[styles.calendarNavButton, { backgroundColor: theme.primary + "20" }]}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <Text key={index} style={[styles.weekdayText, { color: theme.secondaryText }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {/* Empty slots for days before the first day of the month */}
          {emptySlots.map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}

          {/* Actual days of the month */}
          {days.map((date) => {
            const dateString = format(date, "yyyy-MM-dd")
            const isSelected = dateString === selectedDate
            const isToday = isSameDay(date, today)
            const isMarked = markedDates[dateString]
            const isWeekend = getDay(date) === 0 || getDay(date) === 6

            return (
              <View key={dateString} style={styles.dayCell}>
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    isSelected && { backgroundColor: theme.primary },
                    isToday && !isSelected && { borderWidth: 1, borderColor: theme.primary },
                    isWeekend && !isSelected && { backgroundColor: isDarkMode ? "#1a1f2e" : "#f5f5f5" },
                  ]}
                  onPress={() => setSelectedDate(dateString)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && { color: "white" },
                      !isSelected && { color: theme.text },
                      isToday && !isSelected && { color: theme.primary },
                      isWeekend && !isSelected && { color: theme.secondaryText },
                    ]}
                  >
                    {format(date, "d")}
                  </Text>
                  {isMarked && !isSelected && (
                    <View
                      style={[styles.markedDot, { backgroundColor: isToday ? theme.primary : theme.primary + "80" }]}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )
          })}

          {/* Add empty cells to complete the grid if needed */}
          {Array(rows * 7 - totalCells)
            .fill(null)
            .map((_, index) => (
              <View key={`filler-${index}`} style={styles.dayCell} />
            ))}
        </View>
      </View>
    )
  }, [currentMonth, getDaysInMonth, goToNextMonth, goToPreviousMonth, markedDates, selectedDate, theme, isDarkMode])

  // Add a function to display imported data in the UI
  const renderImportedDataInfo = () => {
    if (!user?.uid || !timetable.length) return null

    // Get unique subjects from timetable
    const subjects = [...new Set(timetable.map((item) => item.subject))]

    return (
      <View style={[styles.importedDataCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.importedDataTitle, { color: theme.text }]}>Imported Attendance Data</Text>
        <Text style={[styles.importedDataSubtitle, { color: theme.secondaryText }]}>
          Previously imported attendance data is included in your statistics
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Header
        title="Oops Present"
        subtitle={
          userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Attendance Tracker"
        }
      />

      {/* Success message */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successMessage,
            {
              backgroundColor: theme.present,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.presentText} />
          <Text style={[styles.successText, { color: theme.presentText }]}>{successMessage}</Text>
        </Animated.View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderCalendar()}

        <View style={styles.dateInfo}>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading timetable...</Text>
          </View>
        ) : timetable.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Ionicons name="calendar-outline" size={48} color={theme.secondaryText} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Classes Today</Text>
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              There are no classes scheduled for this day.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Classes</Text>

            {timetable.map((subject, index) => (
              <View key={index} style={[styles.subjectCard, { backgroundColor: theme.card }]}>
                <View style={[styles.subjectHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.subjectName, { color: theme.text }]}>{subject.subject}</Text>
                </View>

                <View style={styles.attendanceOptions}>
                  {subject.type.map((type, typeIndex) => (
                    <View key={typeIndex} style={styles.attendanceRow}>
                      <View style={styles.typeContainer}>
                        <Text style={[styles.typeLabel, { color: theme.secondaryText }]}>{type.toUpperCase()}</Text>
                      </View>

                      <View style={styles.statusButtons}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            {
                              backgroundColor:
                                attendance[`${subject.subject}_${type}`]?.status === "present"
                                  ? theme.present
                                  : theme.background,
                            },
                          ]}
                          onPress={() => toggleAttendance(subject.subject, type)}
                        >
                          <Ionicons
                            name={
                              attendance[`${subject.subject}_${type}`]?.status === "present"
                                ? "checkmark-circle"
                                : "checkmark-circle-outline"
                            }
                            size={24}
                            color={
                              attendance[`${subject.subject}_${type}`]?.status === "present"
                                ? theme.presentText
                                : theme.secondaryText
                            }
                          />
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  attendance[`${subject.subject}_${type}`]?.status === "present"
                                    ? theme.presentText
                                    : theme.secondaryText,
                              },
                            ]}
                          >
                            Present
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            {
                              backgroundColor:
                                attendance[`${subject.subject}_${type}`]?.status === "absent"
                                  ? theme.absent
                                  : theme.background,
                            },
                          ]}
                          onPress={() => toggleAttendance(subject.subject, type)}
                        >
                          <Ionicons
                            name={
                              attendance[`${subject.subject}_${type}`]?.status === "absent"
                                ? "close-circle"
                                : "close-circle-outline"
                            }
                            size={24}
                            color={
                              attendance[`${subject.subject}_${type}`]?.status === "absent"
                                ? theme.absentText
                                : theme.secondaryText
                            }
                          />
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  attendance[`${subject.subject}_${type}`]?.status === "absent"
                                    ? theme.absentText
                                    : theme.secondaryText,
                              },
                            ]}
                          >
                            Absent
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveAttendanceRecords}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Attendance</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Add the AttendanceCalculator component here */}
            <AttendanceCalculator
              subject={timetable.length > 0 ? timetable[0].subject : null}
              timetable={timetable}
              attendance={attendance}
              selectedDate={selectedDate}
            />
            {renderImportedDataInfo()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Update the styles to use consistent spacing
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  successMessage: {
    position: "absolute",
    top: 90,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    ...createShadow(2),
  },
  successText: {
    marginLeft: spacing.sm,
    fontWeight: "600",
    fontSize: 14,
  },
  calendarContainer: {
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...createShadow(1),
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  calendarNavButton: {
    padding: spacing.sm,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: "600",
    width: "14.28%",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: spacing.borderRadius.large,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  markedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 4,
  },
  dateInfo: {
    marginBottom: spacing.md,
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  subjectCard: {
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
    ...createShadow(1),
    overflow: "hidden",
  },
  subjectHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  attendanceOptions: {
    padding: spacing.md,
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  typeContainer: {
    width: 80,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusButtons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.large,
    flex: 1,
    marginHorizontal: spacing.xs,
    justifyContent: "center",
  },
  statusText: {
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: spacing.borderRadius.large,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...createShadow(2),
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  importedDataCard: {
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...createShadow(1),
  },
  importedDataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  importedDataSubtitle: {
    fontSize: 14,
  },
})
