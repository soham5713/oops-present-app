"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { getDivisionTimetable } from "../timetable"

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
    return type === "lab" ? subjectColor[1] : subjectColor[0]
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Timetable"}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>{selectedDay}</Text>
      </View>

      <ScrollView style={styles.timetableContainer}>
        {timetable.length > 0 ? (
          timetable.map((item, index) => (
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
                    {item.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              No classes scheduled for {selectedDay}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  daySelector: {
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  dayButtonText: {
    fontWeight: "500",
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  timetableContainer: {
    padding: 16,
  },
  subjectCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
})
