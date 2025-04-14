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
import { format, addYears, subYears, isSameMonth, setMonth, getMonth, isBefore, isAfter } from "date-fns"
import { spacing, createShadow } from "../utils/spacing"

type MonthPickerProps = {
  visible: boolean
  onClose: () => void
  onSelectMonth: (date: Date) => void
  initialDate?: Date
  minDate?: Date
  maxDate?: Date
  title?: string
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  visible,
  onClose,
  onSelectMonth,
  initialDate,
  minDate,
  maxDate,
  title = "Select Month",
}) => {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
  const [currentYear, setCurrentYear] = useState(initialDate ? initialDate.getFullYear() : new Date().getFullYear())
  const slideAnim = React.useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
      setCurrentYear(initialDate.getFullYear())
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

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1)
  }

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1)
  }

  const isMonthSelectable = (date: Date) => {
    if (minDate && isBefore(date, minDate)) {
      return false
    }
    if (maxDate && isAfter(date, maxDate)) {
      return false
    }
    return true
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const renderMonthGrid = () => {
    return (
      <View style={styles.monthGrid}>
        {months.map((month, index) => {
          const monthDate = new Date(currentYear, index, 1)
          const isSelected = isSameMonth(monthDate, selectedDate)
          const isSelectable = isMonthSelectable(monthDate)

          return (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthItem,
                isSelected && { backgroundColor: theme.primary },
                !isSelectable && { opacity: 0.3 },
              ]}
              onPress={() => {
                if (isSelectable) {
                  setSelectedDate(monthDate)
                }
              }}
              disabled={!isSelectable}
            >
              <Text
                style={[
                  styles.monthText,
                  isSelected && { color: "white" },
                  !isSelected && { color: theme.text },
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          )
        })}
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

          <View style={styles.yearSelector}>
            <TouchableOpacity
              onPress={goToPreviousYear}
              style={[styles.yearNavButton, { backgroundColor: theme.primary + "15" }]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.yearText, { color: theme.text }]}>{currentYear}</Text>
            <TouchableOpacity
              onPress={goToNextYear}
              style={[styles.yearNavButton, { backgroundColor: theme.primary + "15" }]}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {renderMonthGrid()}
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
              onPress={() => onSelectMonth(selectedDate)}
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
  yearSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  yearNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    padding: spacing.md,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "500",
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
})

export default MonthPicker
