"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/ToastContext"
import { colors } from "../utils/theme"
import { getDivisionTimetable } from "../timetable"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { spacing, createShadow } from "../utils/spacing"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function TimetableScreen() {
  const { userProfile } = useUser()
  const { isDarkMode } = useTheme()
  const { showToast } = useToast()
  const theme = isDarkMode ? colors.dark : colors.light

  const [selectedDay, setSelectedDay] = useState("")
  const [timetable, setTimetable] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Set the default selected day to the current weekday
    const today = new Date().getDay()
    // Convert from Sunday=0 to Monday=0 format and handle weekend
    const dayIndex = today === 0 || today === 6 ? 0 : today - 1
    setSelectedDay(DAYS[dayIndex])
  }, [])

  useEffect(() => {
    if (userProfile?.division && userProfile?.batch && selectedDay) {
      loadTimetable()
    }
  }, [userProfile, selectedDay])

  const loadTimetable = async () => {
    try {
      setIsLoading(true)
      const schedule = getDivisionTimetable(userProfile.division, userProfile.batch, selectedDay)
      setTimetable(schedule)
    } catch (error) {
      showToast("Failed to load timetable", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadTimetable()
    setRefreshing(false)
    // showToast("Timetable refreshed", "success")
  }

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
    const actualType = typeof type === "string" ? type : "theory"
    return actualType === "lab" ? subjectColor[1] : subjectColor[0]
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
          <Ionicons name="time" size={28} color="white" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.appName, { color: theme.text }]}>Timetable</Text>
          <Text style={[styles.appSubtitle, { color: theme.secondaryText }]}>
            {userProfile?.division && userProfile?.batch
              ? `Division ${userProfile.division} - Batch ${userProfile.batch}${
                  userProfile?.semester ? ` - Semester ${userProfile.semester}` : ""
                }`
              : "Your Schedule"}
          </Text>
        </View>
      </View>
    </View>
  )

  const renderDaySelector = () => (
    <View style={[styles.daySelectorContainer, { backgroundColor: theme.card }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
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
            <LinearGradient
              colors={selectedDay === day ? [theme.primary, theme.primaryDark] : ["transparent", "transparent"]}
              style={styles.dayButtonGradient}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  {
                    color: selectedDay === day ? "white" : theme.secondaryText,
                    fontWeight: selectedDay === day ? "600" : "400",
                  },
                ]}
              >
                {day.substring(0, 3)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderSubjectCard = (item, index) => {
    if (!item || !item.subject) return null

    const subjectType = typeof item.type === "string" ? item.type : "theory"
    const subjectColor = getSubjectColor(item.subject, item.type)

    return (
      <View
        key={index}
        style={[
          styles.subjectCard,
          {
            backgroundColor: theme.card,
            borderLeftColor: subjectColor,
          },
        ]}
      >
        <View style={styles.subjectHeader}>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: theme.text }]}>{item.subject}</Text>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: subjectColor + "20",
                },
              ]}
            >
              <Text style={[styles.typeText, { color: subjectColor }]}>{subjectType.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Ionicons name="location" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.detailText, { color: theme.secondaryText }]}>{item.room || "Room TBA"}</Text>
          </View>

          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Ionicons name="time" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.detailText, { color: theme.secondaryText }]}>{item.time || "Time TBA"}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={[styles.emptyStateIcon, { backgroundColor: theme.primary + "20" }]}>
        <Ionicons name="calendar-outline" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Classes Today</Text>
      <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
        No classes are scheduled for {selectedDay}. Enjoy your free time!
      </Text>
    </View>
  )

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
          {renderDaySelector()}

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading timetable...</Text>
              </View>
            ) : timetable.length > 0 ? (
              <View style={styles.timetableContainer}>
                {timetable.map((item, index) => renderSubjectCard(item, index))}
              </View>
            ) : (
              renderEmptyState()
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
    height: StatusBar.currentHeight || 44, // Android status bar height or iOS safe area
    width: '100%',
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
    padding: spacing.md,
    paddingBottom: spacing.lg,
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
    marginRight: spacing.md,
    ...createShadow(2),
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs / 2,
  },
  appSubtitle: {
    fontSize: 14,
  },
  daySelectorContainer: {
    marginHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.large,
    ...createShadow(1),
    marginBottom: spacing.md,
  },
  daySelector: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dayButton: {
    // marginHorizontal: spacing.xs,
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
  },
  dayButtonGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  timetableContainer: {
    padding: spacing.md,
  },
  subjectCard: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...createShadow(2),
  },
  subjectHeader: {
    marginBottom: spacing.md,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.medium,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
})