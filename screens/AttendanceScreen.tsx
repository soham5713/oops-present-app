"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getDaySubjects } from "../timetable"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns"
import { saveAttendance, getAttendanceByDate, type AttendanceRecord } from "../firebase/attendanceService"

// Define the subject type based on the timetable structure
type SubjectType = {
  subject: string
  type: string[]
}

export default function AttendanceScreen() {
  const { user, userProfile } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

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
      Alert.alert("Error", "You must be logged in to save attendance")
      return
    }

    if (timetable.length === 0) {
      Alert.alert("Error", "No classes to mark attendance for")
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

      // Show success message instead of alert
      showSuccessMessage("Attendance saved successfully!")

      // Update marked dates
      setMarkedDates((prev) => ({
        ...prev,
        [selectedDate]: true,
      }))
    } catch (error) {
      console.error("Error saving attendance:", error)
      Alert.alert("Error", "Failed to save attendance records")
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Attendance</Text>
        <Text style={[styles.headerSubtitle, { color: theme.headerText + "CC" }]}>
          {userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : ""}
        </Text>
      </View>

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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  successMessage: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  successText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  calendarContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
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
    marginBottom: 8,
    paddingBottom: 8,
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
    padding: 4,
  },
  dayButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
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
    marginBottom: 16,
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subjectCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  subjectHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  attendanceOptions: {
    padding: 16,
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  statusText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
})
