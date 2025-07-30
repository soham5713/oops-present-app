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
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { format, parseISO, addDays, subDays, isSameDay, isWithinInterval } from "date-fns"
import {
  saveManualRecord,
  getAttendanceByDate,
  deleteManualRecord,
  type AttendanceRecord,
} from "../firebase/attendanceService"
import { getSemesterSettings } from "../firebase/semesterService"
import { getSubjectsForSemester } from "../timetable"
import { useToast } from "../context/ToastContext"
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
  const { userProfile, user } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light
  const { showToast } = useToast()

  const [records, setRecords] = useState<ManualAttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [semesterSubjects, setSemesterSubjects] = useState<string[]>([])
  const [semesterSettings, setSemesterSettings] = useState<{
    startDate: string
    endDate: string
  } | null>(null)

  // Animation values
  const addButtonScale = useRef(new Animated.Value(1)).current
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("")

  // Date picker modal
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [tempDate, setTempDate] = useState(selectedDate)
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

  // Load semester settings and subjects
  useEffect(() => {
    const loadSemesterData = async () => {
      if (!user?.uid || !userProfile?.semester) return

      try {
        // Load semester settings
        const settings = await getSemesterSettings(user.uid)
        setSemesterSettings(settings)

        // Load subjects for the current semester
        const subjects = getSubjectsForSemester(userProfile.semester)
        setSemesterSubjects(subjects)
      } catch (error) {
        console.error("Error loading semester data:", error)
      }
    }

    loadSemesterData()
  }, [user?.uid, userProfile?.semester])

  // Update day of week when selected date changes
  useEffect(() => {
    setSelectedDayOfWeek(format(parseISO(selectedDate), "EEEE"))
  }, [selectedDate])

  // Load records for the selected date
  const loadRecords = useCallback(async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      const fetchedRecords = await getAttendanceByDate(user.uid, selectedDate)

      // Filter records by semester if semester settings are available
      let filteredRecords = fetchedRecords
      if (semesterSettings && semesterSubjects.length > 0) {
        // Check if the selected date is within the semester
        const isDateInSemester = isWithinInterval(parseISO(selectedDate), {
          start: parseISO(semesterSettings.startDate),
          end: parseISO(semesterSettings.endDate),
        })

        if (isDateInSemester) {
          // Filter records to only show subjects from the current semester
          filteredRecords = fetchedRecords.filter((record) => semesterSubjects.includes(record.subject))
        } else {
          // If date is outside semester, show no records
          filteredRecords = []
        }
      }

      // Convert to our internal format
      const formattedRecords: ManualAttendanceRecord[] = filteredRecords.map((record) => ({
        id: record.id || `${record.subject}_${record.type}_${Date.now()}`,
        subject: record.subject,
        type: record.type,
        status: record.status || "present",
        date: selectedDate,
        notes: record.notes || "",
        isManual: record.isManual || record.notes?.includes("[MANUAL]") || false,
      }))

      setRecords(formattedRecords)
    } catch (error) {
      console.error("Error loading records:", error)
      showToast({
        message: "Failed to load attendance records",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, user?.uid, semesterSettings, semesterSubjects, showToast])

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

    // Check if the selected date is within the semester
    if (semesterSettings) {
      const isDateInSemester = isWithinInterval(parseISO(selectedDate), {
        start: parseISO(semesterSettings.startDate),
        end: parseISO(semesterSettings.endDate),
      })

      if (!isDateInSemester) {
        showToast({
          message: "Selected date is outside the current semester",
          type: "warning",
        })
        return
      }
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

      await saveManualRecord(user.uid, recordToSave)

      setNewRecord({
        subject: "",
        type: "theory",
        status: "present",
        notes: "",
      })
      setModalVisible(false)
      setRefreshKey((prev) => prev + 1)

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
            setRecords((prev) => prev.filter((record) => record.id !== recordId))
            showToast({
              message: "Record deleted successfully",
              type: "success",
            })
          } catch (error) {
            console.error("Error deleting record:", error)
            showToast({
              message: "Failed to delete record",
              type: "error",
            })
          }
        },
      },
    ])
  }

  // Date navigation functions
  const goToPreviousDay = () => {
    const currentDate = parseISO(tempDate)
    const previousDay = subDays(currentDate, 1)
    setTempDate(format(previousDay, "yyyy-MM-dd"))
  }

  const goToNextDay = () => {
    const currentDate = parseISO(tempDate)
    const nextDay = addDays(currentDate, 1)
    if (nextDay <= addDays(new Date(), 1)) {
      setTempDate(format(nextDay, "yyyy-MM-dd"))
    }
  }

  const confirmDateSelection = () => {
    setSelectedDate(tempDate)
    Animated.timing(datePickerSlide, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDatePickerVisible(false)
    })
  }

  const openDatePicker = () => {
    setTempDate(selectedDate)
    setDatePickerVisible(true)
    datePickerSlide.setValue(300)
    Animated.timing(datePickerSlide, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const animateAddButton = () => {
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

  // Check if selected date is within semester
  const isDateInSemester = semesterSettings
    ? isWithinInterval(parseISO(selectedDate), {
        start: parseISO(semesterSettings.startDate),
        end: parseISO(semesterSettings.endDate),
      })
    : true

  // Date picker component
  const renderDatePicker = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={datePickerVisible}
      onRequestClose={() => {
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
            <Text style={[styles.calendarMonth, { color: theme.text }]}>{format(parseISO(tempDate), "MMMM yyyy")}</Text>

            <View style={styles.calendarGrid}>

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
          <Ionicons name="create" size={28} color="white" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.appName, { color: theme.text }]}>Manual Attendance</Text>
          <Text style={[styles.appSubtitle, { color: theme.secondaryText }]}>
            {userProfile?.division
              ? `Division ${userProfile.division} - Batch ${userProfile.batch}${
                  userProfile?.semester ? ` - Semester ${userProfile.semester}` : ""
                }`
              : "Add attendance records manually"}
          </Text>
        </View>
      </View>
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

          <View style={styles.content}>
            {/* Date display card */}
            <View style={[styles.dateDisplay, { backgroundColor: theme.card }]}>
              <View style={styles.dateInfo}>
                <Text style={[styles.dayOfWeek, { color: theme.primary }]}>{selectedDayOfWeek}</Text>
                <Text style={[styles.fullDate, { color: theme.text }]}>
                  {format(parseISO(selectedDate), "MMMM d, yyyy")}
                </Text>
                {!isDateInSemester && (
                  <View style={[styles.warningBadge, { backgroundColor: theme.warning + "20" }]}>
                    <Ionicons name="warning" size={12} color={theme.warning} />
                    <Text style={[styles.warningText, { color: theme.warning }]}>Outside semester</Text>
                  </View>
                )}
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
              <View
                style={[styles.searchInputContainer]}
              >
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
                            <View
                              style={[styles.typeTag, { backgroundColor: isDarkMode ? theme.background : "#f3f4f6" }]}
                            >
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
                      {!isDateInSemester
                        ? "Selected date is outside the current semester"
                        : searchQuery
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
          </View>

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
                      {semesterSubjects.map((subject) => (
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
    width: "100%",
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
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
    marginBottom: spacing.xs,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.large,
    alignSelf: "flex-start",
  },
  warningText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: spacing.xs,
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
    // padding: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.sm,
    // ...createShadow(1),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: spacing.borderRadius.large,
    paddingHorizontal: spacing.sm,
    height: 50,
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
    marginRight: spacing.sm,
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
    marginBottom: spacing.md,
    padding: spacing.lg,
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
    paddingVertical: spacing.xs,
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
    ...createShadow(1),
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
    maxHeight: 500,
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    paddingVertical: spacing.md,
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
