"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { format, parseISO, addDays, subDays, isSameDay } from "date-fns"
import {
  saveManualRecord,
  getAttendanceByDate,
  deleteManualRecord,
  type AttendanceRecord,
} from "../firebase/attendanceService"
import { AllSubjects } from "../timetable"
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"

// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"

type ManualAttendanceRecord = {
  id: string
  subject: string
  type: string
  status: "present" | "absent" | "cancelled"
  date: string
  notes?: string
  isManual: boolean
}

const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default function ManualAttendanceScreen() {
  const { userProfile } = useUser()
  const { user } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { showToast } = useToast()

  const [records, setRecords] = useState<ManualAttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0) // Used to force refresh

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const addButtonScale = useRef(new Animated.Value(1)).current
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Simple date picker modal
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [tempDate, setTempDate] = useState(selectedDate) // Temporary date for the picker
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("")
  const datePickerSlide = useRef(new Animated.Value(300)).current

  // Form state for adding new record
  const [newRecord, setNewRecord] = useState<{
    subject: string
    type: string
    status: "present" | "absent" | "cancelled"
    notes: string
  }>({
    subject: "",
    type: "theory",
    status: "present",
    notes: "",
  })

  // Update day of week when selected date changes
  useEffect(() => {
    setSelectedDayOfWeek(format(parseISO(selectedDate), "EEEE"))
  }, [selectedDate])

  // Show success toast
  // Remove this function
  // const showToast = (message: string) => {
  //   setSuccessMessage(message)
  //   setShowSuccessToast(true)

  //   // Reset animation values
  //   fadeAnim.setValue(0)
  //   slideAnim.setValue(50)

  //   // Animate in
  //   Animated.parallel([
  //     Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 300,
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(slideAnim, {
  //       toValue: 0,
  //       duration: 300,
  //       useNativeDriver: true,
  //     }),
  //   ]).start()

  //   // Animate out after delay
  //   setTimeout(() => {
  //     Animated.parallel([
  //       Animated.timing(fadeAnim, {
  //         toValue: 0,
  //         duration: 300,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(slideAnim, {
  //         toValue: 50,
  //         duration: 300,
  //         useNativeDriver: true,
  //       }),
  //     ]).start(() => {
  //       setShowSuccessToast(false)
  //     })
  //   }, 2500)
  // }

  // Load records for the selected date
  const loadRecords = useCallback(async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      const fetchedRecords = await getAttendanceByDate(user.uid, selectedDate)

      // Convert to our internal format
      const formattedRecords: ManualAttendanceRecord[] = fetchedRecords.map((record) => ({
        id: record.id || `${record.subject}_${record.type}_${Date.now()}`,
        subject: record.subject,
        type: record.type,
        status: record.status || "present", // Default to present if status is missing
        date: selectedDate,
        notes: record.notes || "",
        isManual: record.isManual || record.notes?.includes("[MANUAL]") || false,
      }))

      setRecords(formattedRecords)
    } catch (error) {
      console.error("Error loading records:", error)
      Alert.alert("Error", "Failed to load attendance records")
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, user?.uid])

  // Load records when component mounts or date changes
  useEffect(() => {
    loadRecords()
  }, [loadRecords, refreshKey])

  // Add a new manual record
  const addManualRecord = async () => {
    if (!user?.uid) {
      showToast({
        message: "You must be logged in to add records",
        type: "error",
      })
      return
    }

    if (!newRecord.subject) {
      showToast({
        message: "Please select a subject",
        type: "warning",
      })
      return
    }

    setIsSaving(true)
    try {
      const recordId = `${newRecord.subject}_${newRecord.type}_${Date.now()}`
      const manualNote = newRecord.notes ? `[MANUAL] ${newRecord.notes}` : "[MANUAL] Added manually"

      const recordToSave: AttendanceRecord = {
        id: recordId,
        subject: newRecord.subject,
        type: newRecord.type,
        status: newRecord.status,
        date: selectedDate,
        notes: manualNote,
        isManual: true,
      }

      // Save to Firebase
      await saveManualRecord(user.uid, recordToSave)

      // Reset form and close modal
      setNewRecord({
        subject: "",
        type: "theory",
        status: "present",
        notes: "",
      })
      setModalVisible(false)

      // Force refresh the records
      setRefreshKey((prev) => prev + 1)

      // Show success toast
      showToast({
        message: "Record added successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error adding manual record:", error)
      showToast({
        message: "Failed to add manual record",
        type: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete a record
  const deleteRecord = async (recordId: string) => {
    if (!user?.uid) return

    Alert.alert("Delete Record", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteManualRecord(user.uid, selectedDate, recordId)

            // Update local state
            setRecords((prev) => prev.filter((record) => record.id !== recordId))

            // Show success toast
            showToast({
              message: "Record deleted successfully",
              type: "success",
            })
          } catch (error) {
            console.error("Error deleting record:", error)
            Alert.alert("Error", "Failed to delete record")
          }
        },
      },
    ])
  }

  // Change date functions
  const goToPreviousDay = () => {
    const currentDate = parseISO(tempDate)
    const previousDay = subDays(currentDate, 1)
    setTempDate(format(previousDay, "yyyy-MM-dd"))
  }

  const goToNextDay = () => {
    const currentDate = parseISO(tempDate)
    const nextDay = addDays(currentDate, 1)
    // Don't allow selecting future dates beyond tomorrow
    if (nextDay <= addDays(new Date(), 1)) {
      setTempDate(format(nextDay, "yyyy-MM-dd"))
    }
  }

  // Confirm date selection
  const confirmDateSelection = () => {
    setSelectedDate(tempDate)

    // Animate date picker out
    Animated.timing(datePickerSlide, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDatePickerVisible(false)
    })
  }

  // Open date picker
  const openDatePicker = () => {
    setTempDate(selectedDate) // Initialize temp date with current selection
    setDatePickerVisible(true)

    // Animate date picker in
    datePickerSlide.setValue(300)
    Animated.timing(datePickerSlide, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  // Animate add button on press
  const animateAddButton = () => {
    // Sequence of scaling down and up
    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(true)
    })
  }

  // Filter records based on search query
  const filteredRecords = records.filter(
    (record) =>
      record.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return {
          bg: theme.present,
          text: theme.presentText,
          icon: "checkmark-circle",
        }
      case "absent":
        return {
          bg: theme.absent,
          text: theme.absentText,
          icon: "close-circle",
        }
      case "cancelled":
        return {
          bg: theme.warning + "40",
          text: theme.warning,
          icon: "alert-circle",
        }
      default:
        return {
          bg: theme.present,
          text: theme.presentText,
          icon: "checkmark-circle",
        }
    }
  }

  // Simple date picker component
  const renderDatePicker = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={datePickerVisible}
      onRequestClose={() => {
        // Animate out on back button
        Animated.timing(datePickerSlide, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setDatePickerVisible(false)
        })
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.datePickerContent,
            {
              backgroundColor: theme.card,
              transform: [{ translateY: datePickerSlide }],
            },
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Date</Text>
            <TouchableOpacity
              onPress={() => {
                // Animate out on close
                Animated.timing(datePickerSlide, {
                  toValue: 300,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setDatePickerVisible(false)
                })
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarView}>
            {/* Current month and year */}
            <Text style={[styles.calendarMonth, { color: theme.text }]}>{format(parseISO(tempDate), "MMMM yyyy")}</Text>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {/* Days of week */}
              <View style={styles.weekdayHeader}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                  <Text key={index} style={[styles.weekdayText, { color: theme.secondaryText }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Date selector */}
              <View style={styles.dateSelector}>
                <TouchableOpacity
                  style={[styles.dateNavButton, { backgroundColor: theme.primary }]}
                  onPress={goToPreviousDay}
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View style={[styles.currentDateContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.currentDate, { color: theme.text }]}>{format(parseISO(tempDate), "d")}</Text>
                  <Text style={[styles.currentDay, { color: theme.secondaryText }]}>
                    {format(parseISO(tempDate), "EEEE")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.dateNavButton, { backgroundColor: theme.primary }]}
                  onPress={goToNextDay}
                >
                  <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Today indicator */}
              {isSameDay(parseISO(tempDate), new Date()) && (
                <View style={styles.todayIndicator}>
                  <Text style={[styles.todayText, { color: theme.primary }]}>Today</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmDateButton, { backgroundColor: theme.primary }]}
            onPress={confirmDateSelection}
          >
            <Text style={styles.confirmDateText}>Confirm Selection</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Header
        title="Oops Present"
        subtitle={
          userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Manual Attendance"
        }
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: theme.present,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.presentText} />
          <Text style={[styles.toastText, { color: theme.presentText }]}>{successMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.container}>
        {/* Date display */}
        <View style={[styles.dateDisplay, { backgroundColor: theme.card }]}>
          <View style={styles.dateInfo}>
            <Text style={[styles.dayOfWeek, { color: theme.primary }]}>{selectedDayOfWeek}</Text>
            <Text style={[styles.fullDate, { color: theme.text }]}>
              {format(parseISO(selectedDate), "MMMM d, yyyy")}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.datePickerButton, { backgroundColor: theme.primary + "15" }]}
            onPress={openDatePicker}
          >
            <Ionicons name="calendar" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search and refresh bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: isDarkMode ? theme.background : "#f9fafb" }]}>
            <Ionicons name="search" size={18} color={theme.secondaryText} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search records..."
              placeholderTextColor={theme.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={() => setRefreshKey((prev) => prev + 1)}
          >
            <Ionicons name="refresh" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Records count */}
        <View style={styles.recordsCountContainer}>
          <Text style={[styles.recordsCount, { color: theme.secondaryText }]}>
            {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"} found
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading records...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.recordsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const statusColors = getStatusColor(record.status)

                return (
                  <View
                    key={record.id}
                    style={[
                      styles.recordCard,
                      {
                        backgroundColor: theme.card,
                        borderLeftColor: record.isManual ? theme.warning : theme.primary,
                      },
                    ]}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.subjectContainer}>
                        <Text style={[styles.subjectText, { color: theme.text }]}>{record.subject}</Text>
                        <View style={[styles.typeTag, { backgroundColor: isDarkMode ? theme.background : "#f3f4f6" }]}>
                          <Text style={[styles.typeText, { color: theme.secondaryText }]}>
                            {record.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Ionicons
                          name={statusColors.icon}
                          size={14}
                          color={statusColors.text}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {record.status === "cancelled" ? "CANCELLED" : record.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {record.notes && (
                      <Text style={[styles.notesText, { color: theme.secondaryText }]}>
                        {record.notes.replace("[MANUAL]", "")}
                      </Text>
                    )}

                    {record.isManual && (
                      <View style={[styles.recordActions, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: theme.error + "15" }]}
                          onPress={() => deleteRecord(record.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.error} />
                          <Text style={[styles.actionText, { color: theme.error }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )
              })
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                <View style={[styles.emptyStateIcon, { backgroundColor: theme.primary + "15" }]}>
                  <Ionicons name="calendar-outline" size={40} color={theme.primary} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Records Found</Text>
                <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                  {searchQuery
                    ? "No records match your search criteria"
                    : "Tap the + button to add a manual attendance record"}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Add button */}
        <Animated.View
          style={{
            transform: [{ scale: addButtonScale }],
            position: "absolute",
            bottom: 24,
            right: 24,
          }}
        >
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={animateAddButton}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Date Picker */}
        {renderDatePicker()}

        {/* Add Record Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Manual Record</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Subject</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    { backgroundColor: isDarkMode ? theme.background : "#f9fafb", borderColor: theme.border },
                  ]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {AllSubjects.map((subject) => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.subjectChip,
                          {
                            backgroundColor: newRecord.subject === subject ? theme.primary : "transparent",
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => setNewRecord({ ...newRecord, subject })}
                      >
                        <Text
                          style={[
                            styles.subjectChipText,
                            { color: newRecord.subject === subject ? "white" : theme.text },
                          ]}
                        >
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>Type</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: newRecord.type === "theory" ? theme.primary : "transparent",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setNewRecord({ ...newRecord, type: "theory" })}
                  >
                    <Text
                      style={[styles.typeButtonText, { color: newRecord.type === "theory" ? "white" : theme.text }]}
                    >
                      Theory
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: newRecord.type === "lab" ? theme.primary : "transparent",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setNewRecord({ ...newRecord, type: "lab" })}
                  >
                    <Text style={[styles.typeButtonText, { color: newRecord.type === "lab" ? "white" : theme.text }]}>
                      Lab
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>Status</Text>
                <View style={styles.statusToggle}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleButton,
                      {
                        backgroundColor: newRecord.status === "present" ? theme.present : "transparent",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setNewRecord({ ...newRecord, status: "present" })}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={newRecord.status === "present" ? theme.presentText : theme.secondaryText}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: newRecord.status === "present" ? theme.presentText : theme.text },
                      ]}
                    >
                      Present
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleButton,
                      {
                        backgroundColor: newRecord.status === "absent" ? theme.absent : "transparent",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setNewRecord({ ...newRecord, status: "absent" })}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={newRecord.status === "absent" ? theme.absentText : theme.secondaryText}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: newRecord.status === "absent" ? theme.absentText : theme.text },
                      ]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleButton,
                      {
                        backgroundColor: newRecord.status === "cancelled" ? theme.warning + "20" : "transparent",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setNewRecord({ ...newRecord, status: "cancelled" })}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color={newRecord.status === "cancelled" ? theme.warning : theme.secondaryText}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: newRecord.status === "cancelled" ? theme.warning : theme.text },
                      ]}
                    >
                      Cancelled
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: isDarkMode ? theme.background : "#f9fafb",
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Add notes about this record..."
                  placeholderTextColor={theme.secondaryText}
                  value={newRecord.notes}
                  onChangeText={(text) => setNewRecord({ ...newRecord, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: newRecord.subject ? theme.primary : theme.primary + "80",
                      opacity: newRecord.subject ? 1 : 0.8,
                    },
                  ]}
                  onPress={addManualRecord}
                  disabled={isSaving || !newRecord.subject}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={18} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.saveButtonText}>Add Record</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    zIndex: 1000,
    ...createShadow(2),
  },
  toastText: {
    marginLeft: spacing.sm,
    fontWeight: "500",
    fontSize: 14,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
    ...createShadow(1),
  },
  dateInfo: {
    flex: 1,
  },
  dayOfWeek: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  fullDate: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  datePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.sm,
    ...createShadow(1),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: spacing.borderRadius.large,
    paddingHorizontal: spacing.sm,
    height: 38,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  recordsCountContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  recordsCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  recordsList: {
    flex: 1,
  },
  recordCard: {
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    ...createShadow(1),
    borderLeftWidth: 3,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: spacing.sm,
    letterSpacing: 0.2,
  },
  typeTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.borderRadius.large / 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    marginTop: spacing.xs,
    lineHeight: 20,
    fontWeight: "400",
  },
  recordActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: spacing.xs,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    ...createShadow(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: "500",
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  emptyStateIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadius.large,
    borderTopRightRadius: spacing.borderRadius.large,
    maxHeight: "80%",
  },
  datePickerContent: {
    borderTopLeftRadius: spacing.borderRadius.large,
    borderTopRightRadius: spacing.borderRadius.large,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modalBody: {
    padding: spacing.md,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: spacing.borderRadius.large,
    padding: spacing.sm,
  },
  subjectChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  typeToggle: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  typeButtonText: {
    fontWeight: "500",
    fontSize: 14,
  },
  statusToggle: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  statusToggleButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginHorizontal: spacing.xs,
    borderRadius: spacing.borderRadius.large,
  },
  statusToggleText: {
    fontWeight: "500",
    marginLeft: spacing.xs,
    fontSize: 13,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: spacing.borderRadius.large,
    padding: spacing.sm,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: "row",
    padding: spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: spacing.borderRadius.large,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.borderRadius.large,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  calendarView: {
    padding: spacing.md,
    alignItems: "center",
  },
  calendarMonth: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  calendarGrid: {
    width: "100%",
    alignItems: "center",
  },
  weekdayHeader: {
    flexDirection: "row",
    width: "100%",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  currentDateContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    ...createShadow(1),
  },
  currentDate: {
    fontSize: 22,
    fontWeight: "bold",
  },
  currentDay: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  todayIndicator: {
    marginTop: spacing.sm,
  },
  todayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  confirmDateButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadius.large,
    alignItems: "center",
  },
  confirmDateText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
})
