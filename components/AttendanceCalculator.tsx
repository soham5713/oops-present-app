"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { useUser } from "../context/UserContext"
import { getAttendanceByDateRange, type AttendanceRecord } from "../firebase/attendanceService"
import { spacing, createShadow } from "../utils/spacing"
import { getHolidays } from "../utils/holidays"
import { db } from "../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { format, eachDayOfInterval, parseISO } from "date-fns"
import { getSemesterSettings } from "../firebase/semesterService"

type AttendanceCalculatorProps = {
  isTabView?: boolean
  subject?: string | null
  timetable?: any[]
  attendance?: Record<string, any>
  selectedDate?: string
}

type SubjectCalculation = {
  subject: string
  // Theory calculations
  theoryTotalSemester: number
  theoryAttended: number
  theoryPercentage: number
  theoryCanSkip: number
  theoryNeedToAttend: number
  theoryMaxPossible: number
  // Lab calculations
  labTotalSemester: number
  labAttended: number
  labPercentage: number
  labCanSkip: number
  labNeedToAttend: number
  labMaxPossible: number
  // Remaining lectures
  theoryRemaining: number
  labRemaining: number
  // Status
  theoryCanReach75: boolean
  labCanReach75: boolean
  // Conducted lectures (excluding cancelled)
  theoryConducted: number
  labConducted: number
  // Cancelled lectures
  theoryCancelled: number
  labCancelled: number
  // Manual (extra) lectures
  theoryManual: number
  labManual: number
  importedData: {
    theoryTotal: number
    theoryAttended: number
    labTotal: number
    labAttended: number
  }
}

const AttendanceCalculator: React.FC<AttendanceCalculatorProps> = ({
  isTabView = false,
  subject: initialSubject = null,
  timetable = [],
  attendance = {},
  selectedDate = format(new Date(), "yyyy-MM-dd"),
}) => {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { user, userProfile } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubject)
  const [subjectCalculations, setSubjectCalculations] = useState<{
    [subject: string]: SubjectCalculation
  }>({})

  // Get subjects for the user's division, batch, and semester
  const getUserSubjects = () => {
    if (!userProfile?.division || !userProfile?.batch || !userProfile?.semester) {
      return []
    }

    const subjects = new Set<string>()
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    try {
      const { getSemesterTimetable } = require("../timetable")
      const semesterTimetable = getSemesterTimetable(userProfile.semester)

      if (!semesterTimetable || !semesterTimetable[userProfile.division]) {
        return []
      }

      const divisionData = semesterTimetable[userProfile.division]

      // Get subjects from shared schedule
      days.forEach((day) => {
        const sharedSubjects = divisionData.shared?.[day] || []
        sharedSubjects.forEach((subject: any) => {
          if (subject.subject) {
            subjects.add(subject.subject)
          }
        })
      })

      // Get subjects from batch-specific schedule
      const batchData = divisionData.batches?.[userProfile.batch]
      if (batchData) {
        days.forEach((day) => {
          const batchSubjects = batchData[day] || []
          batchSubjects.forEach((subject: any) => {
            if (subject.subject) {
              subjects.add(subject.subject)
            }
          })
        })
      }

      return Array.from(subjects)
    } catch (error) {
      console.error("[CALCULATOR] Error getting subjects:", error)
      return []
    }
  }

  // Get subject schedule for a specific subject
  const getSubjectSchedule = (subjectName: string) => {
    if (!userProfile?.division || !userProfile?.batch || !userProfile?.semester) {
      return { theory: {}, lab: {} }
    }

    const schedule = { theory: {}, lab: {} }
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    try {
      const { getSemesterTimetable } = require("../timetable")
      const semesterTimetable = getSemesterTimetable(userProfile.semester)

      if (!semesterTimetable || !semesterTimetable[userProfile.division]) {
        return schedule
      }

      const divisionData = semesterTimetable[userProfile.division]
      const batchData = divisionData.batches?.[userProfile.batch]

      days.forEach((day) => {
        // Check shared schedule
        const sharedSubjects = divisionData.shared?.[day] || []
        sharedSubjects.forEach((s: any) => {
          if (s.subject === subjectName) {
            if (s.type === "theory") {
              schedule.theory[day] = true
            } else if (s.type === "lab") {
              schedule.lab[day] = true
            }
          }
        })

        // Check batch-specific schedule
        if (batchData) {
          const batchSubjects = batchData[day] || []
          batchSubjects.forEach((s: any) => {
            if (s.subject === subjectName) {
              if (s.type === "theory") {
                schedule.theory[day] = true
              } else if (s.type === "lab") {
                schedule.lab[day] = true
              }
            }
          })
        }
      })

      return schedule
    } catch (error) {
      console.error("[CALCULATOR] Error getting subject schedule:", error)
      return { theory: {}, lab: {} }
    }
  }

  // Calculate total expected lectures for a subject in the semester
  const calculateExpectedLectures = (
    subjectName: string,
    startDate: string,
    endDate: string,
  ): { theory: number; lab: number } => {
    try {
      const start = parseISO(startDate)
      const end = parseISO(endDate)
      const allDates = eachDayOfInterval({ start, end })
      const holidays = getHolidays()
      const schedule = getSubjectSchedule(subjectName)

      let theoryCount = 0
      let labCount = 0

      allDates.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayName = format(date, "EEEE")
        const dayOfWeek = date.getDay()

        // Skip Sundays and holidays
        if (dayOfWeek === 0 || holidays.includes(dateStr)) {
          return
        }

        if (schedule.theory[dayName]) {
          theoryCount++
        }
        if (schedule.lab[dayName]) {
          labCount++
        }
      })

      return { theory: theoryCount, lab: labCount }
    } catch (error) {
      console.error("[CALCULATOR] Error calculating expected lectures:", error)
      return { theory: 0, lab: 0 }
    }
  }

  // Calculate remaining lectures from today until semester end
  const calculateRemainingLectures = (
    subjectName: string,
    semesterEndDate: string,
  ): { theory: number; lab: number } => {
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const end = parseISO(semesterEndDate)
      if (tomorrow > end) {
        return { theory: 0, lab: 0 }
      }

      const remainingDates = eachDayOfInterval({ start: tomorrow, end })
      const holidays = getHolidays()
      const schedule = getSubjectSchedule(subjectName)

      let theoryCount = 0
      let labCount = 0

      remainingDates.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayName = format(date, "EEEE")
        const dayOfWeek = date.getDay()

        // Skip Sundays and holidays
        if (dayOfWeek === 0 || holidays.includes(dateStr)) {
          return
        }

        if (schedule.theory[dayName]) {
          theoryCount++
        }
        if (schedule.lab[dayName]) {
          labCount++
        }
      })

      return { theory: theoryCount, lab: labCount }
    } catch (error) {
      console.error("[CALCULATOR] Error calculating remaining lectures:", error)
      return { theory: 0, lab: 0 }
    }
  }

  // Get imported attendance data
  const getImportedData = async (userId: string, subjectName: string) => {
    try {
      const importedDataRef = doc(db, "importedAttendance", `${userId}_${subjectName}`)
      const importedDoc = await getDoc(importedDataRef)

      if (importedDoc.exists()) {
        const data = importedDoc.data()
        return {
          theoryTotal: data.theoryTotal || 0,
          theoryAttended: data.theoryAttended || 0,
          labTotal: data.labTotal || 0,
          labAttended: data.labAttended || 0,
        }
      }

      return {
        theoryTotal: 0,
        theoryAttended: 0,
        labTotal: 0,
        labAttended: 0,
      }
    } catch (error) {
      console.error("[CALCULATOR] Error fetching imported data:", error)
      return {
        theoryTotal: 0,
        theoryAttended: 0,
        labTotal: 0,
        labAttended: 0,
      }
    }
  }

  // Load and calculate attendance data for all subjects
  useEffect(() => {
    if (!user?.uid || !userProfile?.division || !userProfile?.batch || !userProfile?.semester) return

    const loadCalculations = async () => {
      setIsLoading(true)
      try {
        // Get semester settings
        const semesterSettings = await getSemesterSettings(user.uid)
        const semesterStartDate = semesterSettings.startDate
        const semesterEndDate = semesterSettings.endDate

        // Get user subjects
        const userSubjects = getUserSubjects()
        if (userSubjects.length === 0) {
          setSubjectCalculations({})
          return
        }

        // Get attendance records for the semester
        const records = await getAttendanceByDateRange(user.uid, semesterStartDate, semesterEndDate)
        const holidays = getHolidays()

        const calculations: { [subject: string]: SubjectCalculation } = {}

        for (const subject of userSubjects) {
          // Get imported data
          const importedData = await getImportedData(user.uid, subject)

          // Calculate expected lectures for the entire semester
          const expectedLectures = calculateExpectedLectures(subject, semesterStartDate, semesterEndDate)

          // Calculate remaining lectures
          const remainingLectures = calculateRemainingLectures(subject, semesterEndDate)

          // Count actual attendance from records
          let theoryAttendedFromRecords = 0
          let theoryConductedFromRecords = 0
          let theoryCancelledFromRecords = 0
          let theoryManualFromRecords = 0
          let labAttendedFromRecords = 0
          let labConductedFromRecords = 0
          let labCancelledFromRecords = 0
          let labManualFromRecords = 0

          Object.entries(records).forEach(([date, dateRecords]) => {
            const dayOfWeek = new Date(date).getDay()
            if (dayOfWeek === 0 || holidays.includes(date)) {
              return // Skip Sundays and holidays
            }

            dateRecords.forEach((record: AttendanceRecord) => {
              if (record.subject === subject) {
                if (record.type === "theory") {
                  if (record.status === "cancelled") {
                    theoryCancelledFromRecords++
                    // Don't count cancelled lectures in conducted count
                  } else if (record.status && record.status !== "") {
                    // Only count records with actual status (present/absent) as conducted
                    theoryConductedFromRecords++
                    if (record.status === "present") {
                      theoryAttendedFromRecords++
                    }

                    // Check if this is a manual (extra) lecture
                    if (record.isManual || (record.notes && record.notes.includes("[MANUAL]"))) {
                      theoryManualFromRecords++
                    }
                  }
                  // Empty status means lecture was not conducted - don't count it anywhere
                } else if (record.type === "lab") {
                  if (record.status === "cancelled") {
                    labCancelledFromRecords++
                    // Don't count cancelled lectures in conducted count
                  } else if (record.status && record.status !== "") {
                    // Only count records with actual status (present/absent) as conducted
                    labConductedFromRecords++
                    if (record.status === "present") {
                      labAttendedFromRecords++
                    }

                    // Check if this is a manual (extra) lecture
                    if (record.isManual || (record.notes && record.notes.includes("[MANUAL]"))) {
                      labManualFromRecords++
                    }
                  }
                  // Empty status means lecture was not conducted - don't count it anywhere
                }
              }
            })
          })

          // Calculate conducted lectures (imported + from records, excluding cancelled)
          const theoryConducted = theoryConductedFromRecords + importedData.theoryTotal
          const labConducted = labConductedFromRecords + importedData.labTotal

          // Calculate total attended (imported + from records)
          const theoryAttended = theoryAttendedFromRecords + importedData.theoryAttended
          const labAttended = labAttendedFromRecords + importedData.labAttended

          // Calculate current percentage based on conducted lectures (excluding cancelled)
          const theoryPercentage = theoryConducted > 0 ? Math.round((theoryAttended / theoryConducted) * 100) : 0
          const labPercentage = labConducted > 0 ? Math.round((labAttended / labConducted) * 100) : 0

          // Total semester lectures (expected - cancelled + manual extra lectures)
          const theoryTotalSemester = expectedLectures.theory - theoryCancelledFromRecords + theoryManualFromRecords
          const labTotalSemester = expectedLectures.lab - labCancelledFromRecords + labManualFromRecords

          // Calculate requirements for 75% of total semester
          const theoryRequired75 = Math.ceil(theoryTotalSemester * 0.75)
          const labRequired75 = Math.ceil(labTotalSemester * 0.75)

          // Calculate how many more needed to reach 75% of total semester
          const theoryNeedToAttend = Math.max(0, theoryRequired75 - theoryAttended)
          const labNeedToAttend = Math.max(0, labRequired75 - labAttended)

          // Calculate actual remaining lectures (scheduled remaining + manual extra lectures that could be added)
          // For remaining lectures, we use the original scheduled remaining lectures
          // plus any potential for manual extra lectures (which we can't predict, so we keep it as scheduled)
          const theoryActualRemaining = Math.max(0, theoryTotalSemester - theoryConducted)
          const labActualRemaining = Math.max(0, labTotalSemester - labConducted)

          // Calculate how many can be skipped from remaining lectures while maintaining 75%
          const theoryCanSkip = Math.max(0, theoryActualRemaining - theoryNeedToAttend)
          const labCanSkip = Math.max(0, labActualRemaining - labNeedToAttend)

          // Check if 75% is achievable
          const theoryCanReach75 = theoryAttended + theoryActualRemaining >= theoryRequired75
          const labCanReach75 = labAttended + labActualRemaining >= labRequired75

          // Calculate maximum possible percentage
          const theoryMaxPossible =
            theoryTotalSemester > 0
              ? Math.round(((theoryAttended + theoryActualRemaining) / theoryTotalSemester) * 100)
              : 0
          const labMaxPossible =
            labTotalSemester > 0 ? Math.round(((labAttended + labActualRemaining) / labTotalSemester) * 100) : 0

          calculations[subject] = {
            subject,
            theoryTotalSemester,
            theoryAttended,
            theoryPercentage,
            theoryCanSkip,
            theoryNeedToAttend,
            theoryMaxPossible,
            labTotalSemester,
            labAttended,
            labPercentage,
            labCanSkip,
            labNeedToAttend,
            labMaxPossible,
            theoryRemaining: theoryActualRemaining,
            labRemaining: labActualRemaining,
            theoryCanReach75,
            labCanReach75,
            importedData,
            // Add conducted lectures for display (excluding cancelled)
            theoryConducted,
            labConducted,
            // Add cancelled lectures for reference
            theoryCancelled: theoryCancelledFromRecords,
            labCancelled: labCancelledFromRecords,
            // Add manual (extra) lectures for reference
            theoryManual: theoryManualFromRecords,
            labManual: labManualFromRecords,
          }
        }

        setSubjectCalculations(calculations)

        // Set first subject as selected if none selected
        if (!selectedSubject && Object.keys(calculations).length > 0) {
          setSelectedSubject(Object.keys(calculations)[0])
        }
      } catch (error) {
        console.error("[CALCULATOR] Error loading calculations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCalculations()
  }, [user?.uid, userProfile])

  // Get status color based on percentage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return theme.success || "#10b981"
    if (percentage >= 60) return theme.warning || "#f59e0b"
    return theme.error || "#ef4444"
  }

  // Render subject card for tab view
  const renderSubjectCard = (subject: string) => {
    const calc = subjectCalculations[subject]
    if (!calc) return null

    return (
      <View style={[styles.subjectCard, { backgroundColor: theme.card }]}>
        <View style={styles.subjectHeader}>
          <Text style={[styles.subjectName, { color: theme.text }]}>{subject}</Text>
          <View style={styles.percentageContainer}>
            <View style={[styles.percentageBadge, { backgroundColor: getStatusColor(calc.theoryPercentage) }]}>
              <Text style={styles.percentageText}>T: {calc.theoryPercentage}%</Text>
            </View>
            <View
              style={[styles.percentageBadge, { backgroundColor: getStatusColor(calc.labPercentage), marginLeft: 8 }]}
            >
              <Text style={styles.percentageText}>L: {calc.labPercentage}%</Text>
            </View>
          </View>
        </View>

        {/* Theory Section */}
        <View style={[styles.typeSection, { borderLeftColor: "#4f46e5" }]}>
          <Text style={[styles.typeTitle, { color: "#4f46e5" }]}>Theory Lectures</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Attended</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.theoryAttended}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Conducted</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.theoryConducted}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.theoryRemaining}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Can Skip</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.theoryCanSkip}</Text>
            </View>
          </View>

          {/* Show cancelled and manual lecture info */}
          <View style={styles.lectureInfoContainer}>
            {calc.theoryCancelled > 0 && (
              <View style={[styles.lectureInfo, { backgroundColor: theme.error + "20" }]}>
                <Ionicons name="close-circle" size={16} color={theme.error} />
                <Text style={[styles.lectureInfoText, { color: theme.error }]}>{calc.theoryCancelled} cancelled</Text>
              </View>
            )}
            {calc.theoryManual > 0 && (
              <View style={[styles.lectureInfo, { backgroundColor: theme.success + "20" }]}>
                <Ionicons name="add-circle" size={16} color={theme.success} />
                <Text style={[styles.lectureInfoText, { color: theme.success }]}>{calc.theoryManual} extra</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.requirementCard,
              {
                backgroundColor: calc.theoryCanReach75 ? theme.success + "20" : theme.error + "20",
              },
            ]}
          >
            <Ionicons
              name={calc.theoryCanReach75 ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={calc.theoryCanReach75 ? theme.success : theme.error}
            />
            <Text
              style={[
                styles.requirementText,
                {
                  color: calc.theoryCanReach75 ? theme.success : theme.error,
                },
              ]}
            >
              {calc.theoryCanReach75
                ? `Need ${calc.theoryNeedToAttend} more to reach 75%`
                : `Cannot reach 75% (Max: ${calc.theoryMaxPossible}%)`}
            </Text>
          </View>
        </View>

        {/* Lab Section */}
        <View style={[styles.typeSection, { borderLeftColor: "#0ea5e9" }]}>
          <Text style={[styles.typeTitle, { color: "#0ea5e9" }]}>Lab Sessions</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Attended</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.labAttended}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Conducted</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.labConducted}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.labRemaining}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Can Skip</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{calc.labCanSkip}</Text>
            </View>
          </View>

          {/* Show cancelled and manual lecture info */}
          <View style={styles.lectureInfoContainer}>
            {calc.labCancelled > 0 && (
              <View style={[styles.lectureInfo, { backgroundColor: theme.error + "20" }]}>
                <Ionicons name="close-circle" size={16} color={theme.error} />
                <Text style={[styles.lectureInfoText, { color: theme.error }]}>{calc.labCancelled} cancelled</Text>
              </View>
            )}
            {calc.labManual > 0 && (
              <View style={[styles.lectureInfo, { backgroundColor: theme.success + "20" }]}>
                <Ionicons name="add-circle" size={16} color={theme.success} />
                <Text style={[styles.lectureInfoText, { color: theme.success }]}>{calc.labManual} extra</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.requirementCard,
              {
                backgroundColor: calc.labCanReach75 ? theme.success + "20" : theme.error + "20",
              },
            ]}
          >
            <Ionicons
              name={calc.labCanReach75 ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={calc.labCanReach75 ? theme.success : theme.error}
            />
            <Text
              style={[
                styles.requirementText,
                {
                  color: calc.labCanReach75 ? theme.success : theme.error,
                },
              ]}
            >
              {calc.labCanReach75
                ? `Need ${calc.labNeedToAttend} more to reach 75%`
                : `Cannot reach 75% (Max: ${calc.labMaxPossible}%)`}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // Tab view - show all subjects
  if (isTabView) {
    const subjects = Object.keys(subjectCalculations).sort((a, b) => {
      const aAvg = (subjectCalculations[a].theoryPercentage + subjectCalculations[a].labPercentage) / 2
      const bAvg = (subjectCalculations[b].theoryPercentage + subjectCalculations[b].labPercentage) / 2
      return aAvg - bAvg // Sort by average percentage ascending (lowest first)
    })

    return (
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Calculating attendance...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="calculator-outline" size={40} color={theme.secondaryText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No attendance data available</Text>
            <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
              Start marking attendance to see calculations
            </Text>
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item}
            renderItem={({ item }) => renderSubjectCard(item)}
            contentContainerStyle={styles.subjectList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    )
  }

  // Single subject view with selector
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.content}>
        {/* Subject Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectSelector}>
          {Object.keys(subjectCalculations).map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                {
                  backgroundColor: selectedSubject === subject ? theme.primary : theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[styles.subjectChipText, { color: selectedSubject === subject ? "white" : theme.text }]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Calculating...</Text>
          </View>
        ) : !selectedSubject || !subjectCalculations[selectedSubject] ? (
          <View style={styles.noSubjectContainer}>
            <Text style={[styles.noSubjectText, { color: theme.secondaryText }]}>
              Select a subject to view calculations
            </Text>
          </View>
        ) : (
          renderSubjectCard(selectedSubject)
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  subjectSelector: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  subjectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  noSubjectContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  noSubjectText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.large,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  subjectList: {
    padding: spacing.sm,
  },
  subjectCard: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...createShadow(2),
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  percentageContainer: {
    flexDirection: "row",
  },
  percentageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  percentageText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  typeSection: {
    borderLeftWidth: 4,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  lectureInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm,
  },
  lectureInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.medium,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  lectureInfoText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: "500",
  },
  requirementCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
  },
  requirementText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
})

export default AttendanceCalculator
