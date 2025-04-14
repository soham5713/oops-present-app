"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getDivisionTimetable } from "../timetable"
import { SafeAreaView } from "react-native-safe-area-context"
import Header from "../components/Header"
import { Ionicons } from "@expo/vector-icons"

// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function TimetableScreen() {
  const { userProfile } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  const [selectedDay, setSelectedDay] = useState("")
  const [timetable, setTimetable] = useState([])

  useEffect(() => {
    // Set the default selected day to the current weekday
    const today = new Date().getDay()
    // Convert from Sunday=0 to Monday=0 format and handle weekend
    const dayIndex = today === 0 || today === 6 ? 0 : today - 1
    setSelectedDay(DAYS[dayIndex])
  }, [])

  useEffect(() => {
    if (userProfile?.division && userProfile?.batch && selectedDay) {
      const schedule = getDivisionTimetable(userProfile.division, userProfile.batch, selectedDay)
      setTimetable(schedule)
    }
  }, [userProfile, selectedDay])

  const getSubjectColor = (subject, type) => {
    const colors = {
      DECA: ["#f87171", "#7f1d1d"],
      PSOOP: ["#60a5fa", "#1e40af"],
      BEE: ["#34d399", "#065f46"],
      DS: ["#a78bfa", "#5b21b6"],
      EG: ["#fbbf24", "#92400e"],
      EM: ["#f472b6", "#9d174d"],
      EP: ["#4ade80", "#166534"],
      EC: ["#fb923c", "#9a3412"],
      IKS: ["#a3e635", "#3f6212"],
      UHV: ["#c084fc", "#6b21a8"],
      TS: ["#2dd4bf", "#115e59"],
      SS1: ["#f43f5e", "#9f1239"],
    }

    const defaultColor = ["#94a3b8", "#475569"]
    const subjectColor = colors[subject] || defaultColor

    // Handle case where type might be undefined or not a string
    const actualType = typeof type === "string" ? type : "theory"
    return actualType === "lab" ? subjectColor[1] : subjectColor[0]
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Header
        title="Oops Present"
        subtitle={userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Timetable"}
      />

      <View style={[styles.daySelector, { backgroundColor: theme.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                {
                  backgroundColor: selectedDay === day ? theme.primary : "transparent",
                },
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  {
                    color: selectedDay === day ? "white" : theme.secondaryText,
                  },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.timetableContainer}>
        {timetable.length > 0 ? (
          timetable.map((item, index) => {
            // Skip items without a subject
            if (!item || !item.subject) return null

            // Handle case where type might be undefined
            const subjectType = typeof item.type === "string" ? item.type : "theory"

            return (
              <View
                key={index}
                style={[
                  styles.subjectCard,
                  { backgroundColor: theme.card, borderLeftColor: getSubjectColor(item.subject, item.type) },
                ]}
              >
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: theme.text }]}>{item.subject}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: isDarkMode ? theme.background : theme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.typeText, { color: getSubjectColor(item.subject, item.type) }]}>
                      {subjectType.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Room and Time Information */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={theme.secondaryText} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.secondaryText }]}>
                      {item.room || "Room not specified"}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color={theme.secondaryText} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.secondaryText }]}>
                      {item.time || "Time not specified"}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              No classes scheduled for {selectedDay}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Update the styles to use consistent spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  daySelector: {
    padding: spacing.sm,
    ...createShadow(1),
    zIndex: 1,
    margin: spacing.md,
    borderRadius: spacing.borderRadius.large,
  },
  dayButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  dayButtonText: {
    fontWeight: "500",
  },
  dayInfo: {
    padding: spacing.md,
    alignItems: "center",
  },
  selectedDay: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timetableContainer: {
    padding: spacing.md,
  },
  subjectCard: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...createShadow(1),
  },
  subjectInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.large / 2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  detailsContainer: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: spacing.xs,
  },
  detailText: {
    fontSize: 14,
  },
})
