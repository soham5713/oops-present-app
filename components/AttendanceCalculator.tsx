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
import { AllSubjects } from "../timetable"
import { getHolidays } from "../utils/holidays"
import { db } from "../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { format } from "date-fns"

type AttendanceCalculatorProps = {
  isTabView?: boolean
}

const AttendanceCalculator: React.FC<AttendanceCalculatorProps> = ({ isTabView = false }) => {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { user, userProfile } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [subjectStats, setSubjectStats] = useState<{
    [subject: string]: {
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
    }
  }>({})

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

  // Load attendance data for all subjects
  useEffect(() => {
    if (!user?.uid || !userProfile?.division || !userProfile?.batch) return

    const loadAllSubjectsData = async () => {
      setIsLoading(true)
      try {
        // Get the semester start and end dates
        const semesterStartDate = userProfile?.semesterStartDate || "2024-01-20"
        const semesterEndDate = userProfile?.semesterEndDate || "2024-05-16"
        const today = format(new Date(), "yyyy-MM-dd")

        // Get records for the date range
        const records = await getAttendanceByDateRange(user.uid, semesterStartDate, semesterEndDate)

        // Get holidays
        const holidays = getHolidays()

        // Process each subject
        const allSubjectStats: any = {}

        for (const subject of AllSubjects) {
          // Get imported attendance data from Firebase
          const importedData = await getImportedAttendanceData(user.uid, subject)

          // Determine which days of the week have lectures for this subject
          const subjectSchedule = getSubjectScheduleByDays(subject, userProfile?.division, userProfile?.batch)

          // Count total lectures, attended lectures, and missed lectures for the subject
          let totalLectures = 0
          let attendedLectures = 0
          let missedLectures = 0

          // Add imported data to totals - ONLY THEORY, NOT LAB
          totalLectures += importedData.theoryTotal || 0
          attendedLectures += importedData.theoryAttended || 0
          missedLectures += importedData.theoryTotal - importedData.theoryAttended

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
            today,
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

          // Only add subjects that have lectures
          if (totalLectures > 0 || remainingLectures > 0) {
            allSubjectStats[subject] = {
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
            }
          }
        }

        setSubjectStats(allSubjectStats)

        // Set the first subject as selected if none is selected
        if (!selectedSubject && Object.keys(allSubjectStats).length > 0) {
          setSelectedSubject(Object.keys(allSubjectStats)[0])
        }
      } catch (error) {
        console.error("Error loading attendance data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllSubjectsData()
  }, [user?.uid, userProfile])

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

  // Calculate remaining lectures
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

  // Get color based on attendance percentage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) {
      return theme.success
    } else if (percentage >= 60) {
      return theme.warning
    } else {
      return theme.error
    }
  }

  // Render a subject card
  const renderSubjectCard = (subject: string) => {
    const stats = subjectStats[subject]
    if (!stats) return null

    return (
      <View
        style={[
          styles.subjectCard,
          {
            backgroundColor: theme.card,
            borderLeftColor: getStatusColor(stats.currentPercentage),
          },
        ]}
      >
        <View style={styles.subjectHeader}>
          <Text style={[styles.subjectName, { color: theme.text }]}>{subject}</Text>
          <View style={[styles.percentageBadge, { backgroundColor: getStatusColor(stats.currentPercentage) }]}>
            <Text style={styles.percentageText}>{stats.currentPercentage}%</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Attended</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.attendedLectures}/{stats.totalLectures}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Remaining</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.remainingLectures}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Can Skip</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.canSkip}</Text>
          </View>
        </View>

        {stats.isPossibleToReach75 ? (
          <View style={[styles.resultItem, { backgroundColor: theme.present + "30" }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            <Text style={[styles.resultText, { color: theme.success }]}>
              Need to attend {Math.max(0, stats.requiredForMinimum - stats.attendedLectures)} out of{" "}
              {stats.remainingLectures} remaining lectures
            </Text>
          </View>
        ) : (
          <View style={[styles.resultItem, { backgroundColor: theme.absent + "30" }]}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={[styles.resultText, { color: theme.error }]}>
              Cannot reach 75% - short by {stats.shortByLectures} lecture{stats.shortByLectures !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <Text style={[styles.maxPossible, { color: theme.secondaryText }]}>
          Maximum possible: {stats.maxPossiblePercentage}% if you attend all remaining lectures
        </Text>
      </View>
    )
  }

  // Update the tab view rendering to improve UI consistency
  // If in tab view, render all subjects in a list
  if (isTabView) {
    const subjects = Object.keys(subjectStats).sort((a, b) => {
      const aPercentage = subjectStats[a].currentPercentage
      const bPercentage = subjectStats[b].currentPercentage
      return aPercentage - bPercentage // Sort by percentage ascending (lowest first)
    })

    return (
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Calculating attendance...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.card,
                borderRadius: spacing.borderRadius.large,
                padding: spacing.xl,
                ...createShadow(1),
              },
            ]}
          >
            <Ionicons name="calculator-outline" size={40} color={theme.secondaryText} />
            <Text style={[styles.emptyText, { color: theme.text, fontWeight: "600", marginTop: spacing.md }]}>
              No attendance data available
            </Text>
            <Text style={[{ color: theme.secondaryText, textAlign: "center", marginTop: spacing.sm }]}>
              Start marking attendance to see calculations.
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

  // Original component with subject selector
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.content}>
        {/* Subject Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectSelector}>
          {Object.keys(subjectStats).map((subject) => (
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
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Calculating attendance...</Text>
          </View>
        ) : !selectedSubject ? (
          <View style={styles.noSubjectContainer}>
            <Text style={[styles.noSubjectText, { color: theme.secondaryText }]}>
              Please select a subject to view attendance calculations
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultContainer}>
              {selectedSubject && subjectStats[selectedSubject] && (
                <>
                  <View
                    style={[
                      styles.resultItem,
                      { backgroundColor: theme.card, borderLeftColor: theme.primary, borderLeftWidth: 4 },
                    ]}
                  >
                    <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                    <View style={styles.resultTextContainer}>
                      <Text style={[styles.resultTitle, { color: theme.primary }]}>
                        {subjectStats[selectedSubject].remainingLectures} lectures remaining until semester end
                      </Text>
                      <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                        Total for semester: {subjectStats[selectedSubject].totalLecturesWithRemaining} lectures
                      </Text>
                    </View>
                  </View>

                  {subjectStats[selectedSubject].isPossibleToReach75 ? (
                    <View
                      style={[
                        styles.resultItem,
                        { backgroundColor: theme.card, borderLeftColor: theme.success, borderLeftWidth: 4 },
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                      <View style={styles.resultTextContainer}>
                        <Text style={[styles.resultTitle, { color: theme.success }]}>
                          You need to attend{" "}
                          {Math.max(
                            0,
                            subjectStats[selectedSubject].requiredForMinimum -
                              subjectStats[selectedSubject].attendedLectures,
                          )}{" "}
                          out of {subjectStats[selectedSubject].remainingLectures} remaining lectures
                        </Text>
                        <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                          To reach the minimum 75% attendance
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.resultItem,
                        { backgroundColor: theme.card, borderLeftColor: theme.error, borderLeftWidth: 4 },
                      ]}
                    >
                      <Ionicons name="alert-circle" size={24} color={theme.error} />
                      <View style={styles.resultTextContainer}>
                        <Text style={[styles.resultTitle, { color: theme.error }]}>
                          Cannot reach 75% attendance - short by {subjectStats[selectedSubject].shortByLectures} lecture
                          {subjectStats[selectedSubject].shortByLectures !== 1 ? "s" : ""}
                        </Text>
                        <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                          Maximum possible: {subjectStats[selectedSubject].maxPossiblePercentage}% if you attend all
                          remaining lectures
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    style={[
                      styles.resultItem,
                      { backgroundColor: theme.card, borderLeftColor: theme.info, borderLeftWidth: 4 },
                    ]}
                  >
                    <Ionicons name="information-circle" size={24} color={theme.info} />
                    <View style={styles.resultTextContainer}>
                      <Text style={[styles.resultTitle, { color: theme.info }]}>
                        Current attendance: {subjectStats[selectedSubject].attendedLectures}/
                        {subjectStats[selectedSubject].totalLectures} ({subjectStats[selectedSubject].currentPercentage}
                        %)
                      </Text>
                      <Text style={[styles.resultDescription, { color: theme.secondaryText }]}>
                        Need {subjectStats[selectedSubject].requiredForMinimum} lectures for 75% of total{" "}
                        {subjectStats[selectedSubject].totalLecturesWithRemaining}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <Text style={[styles.disclaimer, { color: theme.secondaryText }]}>
              * Calculations are based on theory lectures only. Lab attendance is expected to be 100%.
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
    ...createShadow(1),
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
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
  resultContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    ...createShadow(1),
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.md,
  },
  subjectList: {
    padding: spacing.sm,
  },
  subjectCard: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...createShadow(1),
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "600",
  },
  percentageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  percentageText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  maxPossible: {
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.sm,
  },
})

export default AttendanceCalculator
