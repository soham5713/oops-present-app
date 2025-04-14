"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { useUser } from "../context/UserContext"
import { getAttendanceByDateRange, type AttendanceRecord } from "../firebase/attendanceService"
import { spacing, createShadow } from "../utils/spacing"
import { AllSubjects } from "../timetable"
import { getHolidays } from "../utils/holidays"
import { db } from "../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { format } from "date-fns"

type AttendanceCalculatorProps = {
  subject: string | null
  timetable: any[]
  attendance: any
  selectedDate: string
}

const AttendanceCalculator: React.FC<AttendanceCalculatorProps> = ({
  subject: initialSubject,
  timetable,
  attendance,
  selectedDate,
}) => {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { user, userProfile } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [subject, setSubject] = useState<string | null>(initialSubject)
  const [subjectModalVisible, setSubjectModalVisible] = useState(false)
  const [attendanceStats, setAttendanceStats] = useState<{
    totalLectures: number
    attendedLectures: number
    missedLectures: number
    currentPercentage: number
    canSkip: number
    requiredToAttend: number
    remainingLectures: number
    totalLecturesWithRemaining: number
    requiredForMinimum: number
    isPossibleToReach75: boolean
    shortByLectures: number
    maxPossiblePercentage: number
    importedData: {
      theoryTotal: number
      theoryAttended: number
      labTotal: number
      labAttended: number
    }
  }>({
    totalLectures: 0,
    attendedLectures: 0,
    missedLectures: 0,
    currentPercentage: 0,
    canSkip: 0,
    requiredToAttend: 0,
    remainingLectures: 0,
    totalLecturesWithRemaining: 0,
    requiredForMinimum: 0,
    isPossibleToReach75: true,
    shortByLectures: 0,
    maxPossiblePercentage: 0,
    importedData: {
      theoryTotal: 0,
      theoryAttended: 0,
      labTotal: 0,
      labAttended: 0,
    },
  })

  // Set initial subject if provided
  useEffect(() => {
    if (initialSubject && !subject) {
      setSubject(initialSubject)
    }
  }, [initialSubject, subject])

  // Helper function to get the day of week from a date string
  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[date.getDay()]
  }

  // Helper function to determine which days of the week have lectures for a subject
  const getSubjectScheduleByDays = (subjectName: string | null, division?: string, batch?: string) => {
    if (!subjectName || !division || !batch) {
      return {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
      }
    }

    // Import the necessary functions from timetable.js
    const { getDaySubjects } = require("../timetable")

    // Initialize schedule for each day
    const schedule = {
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false,
    }

    // Check each weekday for the subject
    Object.keys(schedule).forEach((day) => {
      if (day === "Saturday" || day === "Sunday") return // Skip weekends

      const daySubjects = getDaySubjects(division, batch, day)
      // Only consider theory lectures, not lab
      const hasThisSubject = daySubjects.some((s: any) => s.subject === subjectName && s.type.includes("theory"))

      if (hasThisSubject) {
        schedule[day] = true
      }
    })

    return schedule
  }

  // Load attendance data for the selected subject
  useEffect(() => {
    if (!subject || !user?.uid) return

    const loadAttendanceData = async () => {
      setIsLoading(true)
      try {
        // Get the semester start and end dates
        const semesterStartDate = userProfile?.semesterStartDate || "2024-01-20"
        const semesterEndDate = userProfile?.semesterEndDate || "2024-05-16"

        // Get records for the date range
        const records = await getAttendanceByDateRange(user.uid, semesterStartDate, semesterEndDate)

        // Get imported attendance data from Firebase
        const importedData = await getImportedAttendanceData(user.uid, subject)

        // Count total lectures, attended lectures, and missed lectures for the subject
        // Only count theory lectures, not lab
        let totalLectures = 0
        let attendedLectures = 0
        let missedLectures = 0

        // Add imported data to totals - ONLY THEORY, NOT LAB
        totalLectures += importedData.theoryTotal || 0
        attendedLectures += importedData.theoryAttended || 0
        missedLectures += importedData.theoryTotal - importedData.theoryAttended

        // Get holidays
        const holidays = getHolidays()

        // Determine which days of the week have lectures for this subject
        const subjectSchedule = getSubjectScheduleByDays(subject, userProfile?.division, userProfile?.batch)

        // Process attendance records
        Object.entries(records).forEach(([date, dateRecords]) => {
          // Skip if date is a holiday
          if (holidays.includes(date)) return

          // Check if this date has a lecture for the selected subject
          const dayOfWeek = getDayOfWeek(date)
          if (!subjectSchedule[dayOfWeek]) return // Skip if no lecture on this day

          dateRecords.forEach((record: AttendanceRecord) => {
            if (record.subject === subject && record.type === "theory") {
              // Only count theory lectures, explicitly exclude lab
              // Only count if not part of imported data
              if (!importedData.startDate || date > importedData.startDate) {
                totalLectures++
                if (record.status === "present") {
                  attendedLectures++
                } else if (record.status === "absent") {
                  missedLectures++
                }
              }
            }
          })
        })

        // Add today's attendance if available
        if (timetable.length > 0) {
          timetable.forEach((item) => {
            if (item.subject === subject && item.type === "theory") {
              // Only count theory lectures, explicitly exclude lab
              const key = `${item.subject}_${item.type}`
              if (attendance[key]) {
                // This lecture is part of today's timetable
                if (attendance[key].status === "present") {
                  // Only count if not already in the records
                  if (
                    !records[selectedDate] ||
                    !records[selectedDate].some((r: AttendanceRecord) => r.subject === subject && r.type === item.type)
                  ) {
                    attendedLectures++
                    totalLectures++
                  }
                } else if (attendance[key].status === "absent") {
                  // Only count if not already in the records
                  if (
                    !records[selectedDate] ||
                    !records[selectedDate].some((r: AttendanceRecord) => r.subject === subject && r.type === item.type)
                  ) {
                    missedLectures++
                    totalLectures++
                  }
                }
              }
            }
          })
        }

        // Calculate current attendance percentage
        const currentPercentage = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0

        // Calculate how many more lectures can be skipped while maintaining 75% attendance
        // Formula: canSkip = 0.25 * totalLectures - missedLectures
        const canSkip = Math.floor(0.25 * totalLectures - missedLectures)

        // Calculate minimum lectures required to reach 75% attendance
        // Formula: requiredToAttend = 0.75 * totalLectures - attendedLectures
        const requiredToAttend = Math.ceil(0.75 * totalLectures - attendedLectures)

        // Calculate remaining lectures until semester end
        const remainingLectures = await calculateRemainingLectures(
          subject,
          selectedDate,
          semesterEndDate,
          holidays,
          subjectSchedule,
        )

        // Calculate total lectures including remaining ones
        const totalLecturesWithRemaining = totalLectures + remainingLectures

        // Calculate how many lectures needed to reach 75% of total
        const requiredForMinimum = Math.ceil(0.75 * totalLecturesWithRemaining)

        // Check if it's possible to reach 75% attendance
        const isPossibleToReach75 = attendedLectures + remainingLectures >= requiredForMinimum

        // Calculate how many lectures short if not possible
        const shortByLectures = isPossibleToReach75 ? 0 : requiredForMinimum - (attendedLectures + remainingLectures)

        // Calculate maximum possible percentage if all remaining lectures are attended
        const maxPossiblePercentage =
          totalLecturesWithRemaining > 0
            ? Math.round(((attendedLectures + remainingLectures) / totalLecturesWithRemaining) * 100)
            : 0

        setAttendanceStats({
          totalLectures,
          attendedLectures,
          missedLectures,
          currentPercentage,
          canSkip: Math.max(0, canSkip),
          requiredToAttend: Math.max(0, requiredToAttend),
          remainingLectures,
          totalLecturesWithRemaining,
          requiredForMinimum,
          isPossibleToReach75,
          shortByLectures,
          maxPossiblePercentage,
          importedData: {
            theoryTotal: importedData.theoryTotal || 0,
            theoryAttended: importedData.theoryAttended || 0,
            labTotal: importedData.labTotal || 0,
            labAttended: importedData.labAttended || 0,
          },
        })
      } catch (error) {
        console.error("Error loading attendance data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAttendanceData()
  }, [subject, user?.uid, selectedDate, timetable, attendance, userProfile])

  // Get imported attendance data from Firebase
  const getImportedAttendanceData = async (userId: string, subjectName: string) => {
    try {
      // Fetch imported data from Firebase
      const importedDataRef = doc(db, "importedAttendance", `${userId}_${subjectName}`)
      const importedDoc = await getDoc(importedDataRef)

      if (importedDoc.exists()) {
        const data = importedDoc.data()
        return {
          theoryTotal: data.theoryTotal || 0,
          theoryAttended: data.theoryAttended || 0,
          labTotal: data.labTotal || 0,
          labAttended: data.labAttended || 0,
          startDate: data.importDate || null,
        }
      }

      return {
        theoryTotal: 0,
        theoryAttended: 0,
        labTotal: 0,
        labAttended: 0,
        startDate: null,
      }
    } catch (error) {
      console.error("Error fetching imported attendance data:", error)
      return {
        theoryTotal: 0,
        theoryAttended: 0,
        labTotal: 0,
        labAttended: 0,
        startDate: null,
      }
    }
  }

  // Add a new function to calculate remaining lectures
  const calculateRemainingLectures = async (
    subjectName: string | null,
    currentDate: string,
    semesterEndDate: string,
    holidays: string[],
    subjectSchedule: Record<string, boolean>,
  ): Promise<number> => {
    if (!subjectName) return 0

    let remainingLectures = 0
    const currentDateObj = new Date(currentDate)
    // Add one day to start from tomorrow
    currentDateObj.setDate(currentDateObj.getDate() + 1)
    const endDateObj = new Date(semesterEndDate)

    // Loop through each day from tomorrow until semester end
    while (currentDateObj <= endDateObj) {
      const dateStr = format(currentDateObj, "yyyy-MM-dd")

      // Skip if it's a holiday
      if (holidays.includes(dateStr)) {
        currentDateObj.setDate(currentDateObj.getDate() + 1)
        continue
      }

      // Check if this day has a theory lecture for the subject
      const dayOfWeek = getDayOfWeek(dateStr)
      if (subjectSchedule[dayOfWeek]) {
        // Only count theory lectures, not lab
        remainingLectures++
      }

      // Move to next day
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return remainingLectures
  }

  // If no subject is selected, show a message
  if (!subject && !isExpanded) return null

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
        <View style={styles.titleContainer}>
          <Ionicons name="calculator-outline" size={20} color={theme.primary} style={styles.icon} />
          <Text style={[styles.title, { color: theme.text }]}>Theory Attendance Calculator</Text>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.secondaryText} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Subject Selector */}
          <TouchableOpacity
            style={[styles.subjectSelector, { backgroundColor: theme.background }]}
            onPress={() => setSubjectModalVisible(true)}
          >
            <Text style={[styles.subjectSelectorLabel, { color: theme.secondaryText }]}>Subject:</Text>
            <Text style={[styles.subjectSelectorValue, { color: theme.text }]}>{subject || "Select a subject"}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.secondaryText} />
          </TouchableOpacity>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Calculating attendance...</Text>
            </View>
          ) : !subject ? (
            <View style={styles.noSubjectContainer}>
              <Text style={[styles.noSubjectText, { color: theme.secondaryText }]}>
                Please select a subject to view attendance calculations
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resultContainer}>
                <View style={[styles.resultItem, { backgroundColor: theme.primary + "15" }]}>
                  <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                  <View style={styles.resultTextContainer}>
                    <Text style={[styles.resultTitle, { color: theme.primary }]}>
                      {attendanceStats.remainingLectures} lectures remaining until semester end
                    </Text>
                    <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                      Total for semester: {attendanceStats.totalLecturesWithRemaining} lectures
                    </Text>
                  </View>
                </View>

                {attendanceStats.isPossibleToReach75 ? (
                  <View style={[styles.resultItem, { backgroundColor: theme.present + "30" }]}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                    <View style={styles.resultTextContainer}>
                      <Text style={[styles.resultTitle, { color: theme.success }]}>
                        You need to attend{" "}
                        {Math.max(0, attendanceStats.requiredForMinimum - attendanceStats.attendedLectures)} out of{" "}
                        {attendanceStats.remainingLectures} remaining lectures
                      </Text>
                      <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                        To reach the minimum 75% attendance
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.resultItem, { backgroundColor: theme.absent + "30" }]}>
                    <Ionicons name="alert-circle" size={24} color={theme.error} />
                    <View style={styles.resultTextContainer}>
                      <Text style={[styles.resultTitle, { color: theme.error }]}>
                        Cannot reach 75% attendance - short by {attendanceStats.shortByLectures} lecture
                        {attendanceStats.shortByLectures !== 1 ? "s" : ""}
                      </Text>
                      <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                        Maximum possible: {attendanceStats.maxPossiblePercentage}% if you attend all remaining lectures
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.resultItem, { backgroundColor: theme.info + "20" }]}>
                  <Ionicons name="information-circle" size={24} color={theme.info} />
                  <View style={styles.resultTextContainer}>
                    <Text style={[styles.resultTitle, { color: theme.info }]}>
                      Current attendance: {attendanceStats.attendedLectures}/{attendanceStats.totalLectures} (
                      {attendanceStats.currentPercentage}%)
                    </Text>
                    <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                      Need {attendanceStats.requiredForMinimum} lectures for 75% of total{" "}
                      {attendanceStats.totalLecturesWithRemaining}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.disclaimer, { color: theme.secondaryText }]}>
                * Calculations are based on theory lectures only. Lab attendance is expected to be 100%.
              </Text>
            </>
          )}
        </View>
      )}

      {/* Subject Selection Modal */}
      <Modal
        visible={subjectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Subject</Text>
              <TouchableOpacity onPress={() => setSubjectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {AllSubjects.map((subjectName) => (
                <TouchableOpacity
                  key={subjectName}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: theme.border },
                    subject === subjectName && { backgroundColor: theme.primary + "20" },
                  ]}
                  onPress={() => {
                    setSubject(subjectName)
                    setSubjectModalVisible(false)
                  }}
                >
                  <Text style={[styles.modalItemText, { color: theme.text }]}>{subjectName}</Text>
                  {subject === subjectName && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius.large,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    overflow: "hidden",
    ...createShadow(1),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
  },
  subjectSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
  },
  subjectSelectorLabel: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  subjectSelectorValue: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  noSubjectContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  noSubjectText: {
    fontSize: 14,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  importedDataContainer: {
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
  },
  importedDataTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  importedDataRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  importedDataColumn: {
    alignItems: "center",
  },
  importedDataLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  importedDataValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  percentageContainer: {
    alignItems: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
  },
  percentageLabel: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  percentageValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  resultContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
  },
  resultTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  resultDescription: {
    fontSize: 12,
  },
  disclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadius.large,
    borderTopRightRadius: spacing.borderRadius.large,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
})

export default AttendanceCalculator
