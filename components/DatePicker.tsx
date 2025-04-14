"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { format, addDays, subDays, isSameDay, parseISO, isValid, addMonths, subMonths, startOfMonth, endOfMonth, getDay, isBefore, isAfter } from "date-fns"
import { spacing, createShadow } from "../utils/spacing"

type DatePickerProps = {
  visible: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
  initialDate?: Date
  minDate?: Date
  maxDate?: Date
  title?: string
}

const DatePicker: React.FC<DatePickerProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  minDate,
  maxDate,
  title = "Select Date",
}) => {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date())
  const slideAnim = React.useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (initialDate && isValid(initialDate)) {
      setSelectedDate(initialDate)
      setCurrentMonth(initialDate)
    }
  }, [initialDate])

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      // Reset animation value when modal is closed
      slideAnim.setValue(300)
    }
  }, [visible, slideAnim])

  const handleClose = () => {
    // Animate out
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose()
    })
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isDateSelectable = (date: Date) => {
    if (minDate && isBefore(date, minDate)) {
      return false
    }
    if (maxDate && isAfter(date, maxDate)) {
      return false
    }
    return true
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = monthStart
    const endDate = monthEnd

    // Calculate the day of the week for the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayOfMonth = getDay(startDate)

    // Create empty slots for days before the first day of the month
    const emptySlots = Array(firstDayOfMonth).fill(null)

    // Generate array of dates for the current month
    const daysInMonth = []
    let currentDate = startDate
    while (currentDate <= endDate) {
      daysInMonth.push(currentDate)
      currentDate = addDays(currentDate, 1)
    }

    // Calculate total cells needed (empty slots + days in month)
    const totalCells = emptySlots.length + daysInMonth.length

    // Calculate how many rows we need (7 columns per row)
    const rows = Math.ceil(totalCells / 7)

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={[styles.calendarNavButton, { backgroundColor: theme.primary + "15" }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthTitle, { color: theme.text }]}>
            {format(currentMonth, "MMMM yyyy")}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[styles.calendarNavButton, { backgroundColor: theme.primary + "15" }]}
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
          {daysInMonth.map((date) => {
            const isSelected = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, new Date())
            const isSelectable = isDateSelectable(date)

            return (
              <View key={date.toISOString()} style={styles.dayCell}>
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    isSelected && { backgroundColor: theme.primary },
                    isToday && !isSelected && { borderWidth: 1, borderColor: theme.primary },
                    !isSelectable && { opacity: 0.3 },
                  ]}
                  onPress={() => {
                    if (isSelectable) {
                      setSelectedDate(date)
                    }
                  }}
                  disabled={!isSelectable}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && { color: "white" },
                      !isSelected && { color: theme.text },
                      isToday && !isSelected && { color: theme.primary },
                    ]}
                  >
                    {format(date, "d")}
                  </Text>
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
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {renderCalendar()}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.primary }]}
              onPress={() => onSelectDate(selectedDate)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: "80%",
    overflow: "hidden",
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
  modalBody: {
    padding: spacing.md,
  },
  modalFooter: {
    flexDirection: "row",
    padding: spacing.md,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: spacing.borderRadius.large,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.borderRadius.large,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  calendarContainer: {
    marginBottom: spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  weekdayText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
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
})

export default DatePicker
