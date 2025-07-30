"use client"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Linking,
  RefreshControl,
  StatusBar,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as ImagePicker from "expo-image-picker"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { colors } from "../utils/theme"
import { doc, deleteDoc, collection, getDocs, query, where, setDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Divisions, getBatches, AllSubjects } from "../timetable"
import * as Print from "expo-print"
import { useToast } from "../context/ToastContext"
import { spacing, createShadow } from "../utils/spacing"
import { endOfMonth, format, parseISO } from "date-fns"
import DatePicker from "../components/DatePicker"
import MonthPicker from "../components/MonthPicker"
import { LinearGradient } from "expo-linear-gradient"

const Semesters = ["1", "2", "3", "4", "5", "6", "7", "8"]

export default function SettingsScreen() {
  const { userProfile, user, logOut, updateUserProfile } = useUser()
  const { isDarkMode, toggleTheme } = useTheme()
  const { showToast } = useToast()

  const theme = isDarkMode ? colors.dark : colors.light

  // State variables
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [showDivisionModal, setShowDivisionModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showSemesterModal, setShowSemesterModal] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [availableBatches, setAvailableBatches] = useState<string[]>([])
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Import attendance state
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [theoryTotal, setTheoryTotal] = useState("")
  const [theoryAttended, setTheoryAttended] = useState("")
  const [labTotal, setLabTotal] = useState("")
  const [labAttended, setLabAttended] = useState("")
  const [isSavingImport, setIsSavingImport] = useState(false)
  const [subjectModalVisible, setSubjectModalVisible] = useState(false)
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Semester dates state
  const [semesterStartDate, setSemesterStartDate] = useState("2025-01-20")
  const [semesterEndDate, setSemesterEndDate] = useState("2025-05-16")
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">("start")

  // Load user data
  const loadUserData = () => {
    if (user) {
      setDisplayName(user.displayName || "")
      setProfileImage(user.photoURL)

      if (userProfile) {
        setSelectedDivision(userProfile.division || "")
        setSelectedBatch(userProfile.batch || "")
        setSelectedSemester(userProfile.semester || "")
        setSemesterStartDate(userProfile.semesterStartDate || "2025-01-20")
        setSemesterEndDate(userProfile.semesterEndDate || "2025-05-16")
      }
    }
  }

  useEffect(() => {
    loadUserData()
  }, [user, userProfile])

  // Update available batches when division changes
  useEffect(() => {
    if (selectedDivision) {
      const batches = getBatches(selectedDivision)
      setAvailableBatches(batches)

      if (userProfile?.division !== selectedDivision) {
        setSelectedBatch(batches.length > 0 ? batches[0] : "")
      }
    }
  }, [selectedDivision, userProfile?.division])

  const onRefresh = () => {
    setRefreshing(true)
    loadUserData()
    setTimeout(() => {
      setRefreshing(false)
      showToast({ message: "Settings updated", type: "success", duration: 2000 })
    }, 1000)
  }

  // Pick profile image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        showToast({ message: "Camera roll permissions are required.", type: "error" })
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri
        setProfileImage(uri)
        if (user) {
          setIsLoading(true)
          try {
            await updateProfile(user, { photoURL: uri })
            showToast({ message: "Profile picture updated", type: "success" })
          } catch (error) {
            console.error("Error updating profile picture:", error)
            showToast({ message: "Failed to update profile picture", type: "error" })
          } finally {
            setIsLoading(false)
          }
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      showToast({ message: "Failed to pick image", type: "error" })
    }
  }

  // Save profile changes
  const saveProfileChanges = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      await updateProfile(user, { displayName })
      setEditMode(false)
      showToast({ message: "Profile updated successfully", type: "success" })
    } catch (error) {
      console.error("Error updating profile:", error)
      showToast({ message: "Failed to update profile", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  // Update division, batch, and semester
  const updateAcademicInfo = async (info: { division?: string; batch?: string; semester?: string }) => {
    if (!user) return
    setIsLoading(true)
    try {
      await updateUserProfile(info)
      showToast({ message: "Preferences updated successfully", type: "success" })
    } catch (error) {
      console.error("Error updating preferences:", error)
      showToast({ message: "Failed to update preferences", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSemesterDates = async (startDate: string, endDate: string) => {
    if (!user?.uid) return
    setIsLoading(true)
    try {
      await updateUserProfile({ semesterStartDate: startDate, semesterEndDate: endDate })
      showToast({ message: "Semester dates updated", type: "success" })
    } catch (error) {
      console.error("Error saving semester dates:", error)
      showToast({ message: "Failed to update semester dates", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveImportedAttendance = async () => {
    if (!user?.uid || !selectedSubject) {
      showToast({ message: "Please select a subject", type: "warning" })
      return
    }

    const theoryTotalNum = Number.parseInt(theoryTotal) || 0
    const theoryAttendedNum = Number.parseInt(theoryAttended) || 0
    const labTotalNum = Number.parseInt(labTotal) || 0
    const labAttendedNum = Number.parseInt(labAttended) || 0

    if (theoryAttendedNum > theoryTotalNum || labAttendedNum > labTotalNum) {
      showToast({ message: "Attended classes cannot exceed total classes", type: "error" })
      return
    }

    const lastDayOfMonth = endOfMonth(selectedMonth)
    const importDateStr = format(lastDayOfMonth, "yyyy-MM-dd")

    if (importDateStr < semesterStartDate) {
      showToast({ message: "Import date must be after semester start date", type: "error" })
      return
    }

    setIsSavingImport(true)
    try {
      const importedDataRef = doc(db, "importedAttendance", `${user.uid}_${selectedSubject}`)
      await setDoc(
        importedDataRef,
        {
          userId: user.uid,
          subject: selectedSubject,
          theoryTotal: theoryTotalNum,
          theoryAttended: theoryAttendedNum,
          labTotal: labTotalNum,
          labAttended: labAttendedNum,
          importDate: importDateStr,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      const theoryPercentage = theoryTotalNum > 0 ? Math.round((theoryAttendedNum / theoryTotalNum) * 100) : 0
      const labPercentage = labTotalNum > 0 ? Math.round((labAttendedNum / labTotalNum) * 100) : 0

      showToast({
        message: `${selectedSubject} data imported: Theory ${theoryPercentage}%, Lab ${labPercentage}%`,
        type: "success",
        duration: 4000,
      })

      setTheoryTotal("")
      setTheoryAttended("")
      setLabTotal("")
      setLabAttended("")
      setShowImportModal(false)
    } catch (error) {
      console.error("Error saving imported attendance:", error)
      showToast({ message: "Failed to import attendance data", type: "error" })
    } finally {
      setIsSavingImport(false)
    }
  }

  const handleDateSelection = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")
    let newStartDate = semesterStartDate
    let newEndDate = semesterEndDate

    if (datePickerMode === "start") {
      if (formattedDate > semesterEndDate) {
        showToast({ message: "Start date cannot be after end date", type: "error" })
        return
      }
      newStartDate = formattedDate
      setSemesterStartDate(newStartDate)
    } else {
      if (formattedDate < semesterStartDate) {
        showToast({ message: "End date cannot be before start date", type: "error" })
        return
      }
      newEndDate = formattedDate
      setSemesterEndDate(newEndDate)
    }

    setIsDatePickerVisible(false)
    saveSemesterDates(newStartDate, newEndDate)
  }

  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy")
    } catch {
      return dateString
    }
  }

  // Generate HTML for PDF report
  const generateAttendanceReportHTML = async () => {
    if (!user?.uid) return ""

    try {
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid))
      const querySnapshot = await getDocs(attendanceQuery)

      const attendanceData = []
      const subjectStats = {}

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.records && Array.isArray(data.records)) {
          attendanceData.push({ date: data.date, records: data.records })

          data.records.forEach((record) => {
            if (!subjectStats[record.subject]) {
              subjectStats[record.subject] = {
                subject: record.subject,
                theoryTotal: 0,
                theoryPresent: 0,
                labTotal: 0,
                labPresent: 0,
              }
            }

            if (record.type === "theory") {
              subjectStats[record.subject].theoryTotal++
              if (record.status === "present") {
                subjectStats[record.subject].theoryPresent++
              }
            } else if (record.type === "lab") {
              subjectStats[record.subject].labTotal++
              if (record.status === "present") {
                subjectStats[record.subject].labPresent++
              }
            }
          })
        }
      })

      const importedDataQuery = query(collection(db, "importedAttendance"), where("userId", "==", user.uid))
      const importedSnapshot = await getDocs(importedDataQuery)

      importedSnapshot.forEach((doc) => {
        const data = doc.data()
        const subject = data.subject

        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            subject,
            theoryTotal: 0,
            theoryPresent: 0,
            labTotal: 0,
            labPresent: 0,
          }
        }

        subjectStats[subject].theoryTotal += data.theoryTotal || 0
        subjectStats[subject].theoryPresent += data.theoryAttended || 0
        subjectStats[subject].labTotal += data.labTotal || 0
        subjectStats[subject].labPresent += data.labAttended || 0
      })

      Object.values(subjectStats).forEach((stat: any) => {
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0
      })

      attendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const getColorClass = (percentage: number) => {
        if (percentage >= 75) return "good"
        if (percentage >= 60) return "warning"
        return "danger"
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Oops Present - Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #4f46e5; margin-bottom: 5px; }
            .header p { color: #666; margin-top: 0; }
            .section { margin-bottom: 30px; }
            .section-title { color: #4f46e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .good { color: #16a34a; }
            .warning { color: #f59e0b; }
            .danger { color: #dc2626; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Oops Present - Attendance Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} for ${user.displayName || user.email}</p>
            <p>Division: ${userProfile?.division || "N/A"} | Batch: ${userProfile?.batch || "N/A"}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Attendance Summary</h2>
            <table>
              <tr>
                <th>Subject</th>
                <th>Theory Attendance</th>
                <th>Lab Attendance</th>
                <th>Overall</th>
              </tr>
              ${Object.values(subjectStats)
                .map(
                  (stat: any) => `
                <tr>
                  <td>${stat.subject}</td>
                  <td class="${getColorClass(stat.theoryPercentage)}">
                    ${stat.theoryPresent}/${stat.theoryTotal} (${stat.theoryPercentage}%)
                  </td>
                  <td class="${getColorClass(stat.labPercentage)}">
                    ${stat.labPresent}/${stat.labTotal} (${stat.labPercentage}%)
                  </td>
                  <td class="${getColorClass((stat.theoryPercentage + stat.labPercentage) / 2)}">
                    ${Math.round((stat.theoryPercentage + stat.labPercentage) / 2)}%
                  </td>
                </tr>
              `,
                )
                .join("")}
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title">Recent Attendance Records</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
              ${attendanceData
                .slice(0, 20)
                .flatMap((day) =>
                  day.records.map(
                    (record) => `
                  <tr>
                    <td>${new Date(day.date).toLocaleDateString()}</td>
                    <td>${record.subject}</td>
                    <td>${record.type}</td>
                    <td class="${record.status === "present" ? "good" : "danger"}">
                      ${record.status.toUpperCase()}
                    </td>
                    <td>${record.notes || ""}</td>
                  </tr>
                `,
                  ),
                )
                .join("")}
            </table>
          </div>
          
          <div class="footer">
            <p>Generated by Oops Present</p>
            <p>© ${new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </body>
        </html>
      `

      return html
    } catch (error) {
      console.error("Error generating attendance report:", error)
      throw error
    }
  }

  const exportData = async () => {
    setIsExporting(true)
    try {
      if (!user?.uid) throw new Error("You must be logged in to export data")

      const html = await generateAttendanceReportHTML()
      const { uri } = await Print.printToFileAsync({ html })
      const fileName = `attendance_report_${new Date().toISOString().split("T")[0]}.pdf`
      const pdfLocation = `${FileSystem.documentDirectory}${fileName}`
      await FileSystem.copyAsync({ from: uri, to: pdfLocation })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfLocation, { mimeType: "application/pdf" })
        showToast({ message: "Report exported successfully", type: "success" })
      } else {
        showToast({ message: "Sharing is not available", type: "error" })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      showToast({ message: error.message || "Failed to export report", type: "error" })
    } finally {
      setIsExporting(false)
    }
  }

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your attendance data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true)
            try {
              if (user) {
                const collectionsToDelete = ["attendance", "importedAttendance"]
                for (const coll of collectionsToDelete) {
                  const q = query(collection(db, coll), where("userId", "==", user.uid))
                  const snapshot = await getDocs(q)
                  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
                  await Promise.all(deletePromises)
                }
              }
              showToast({ message: "All data has been cleared", type: "success" })
            } catch (error) {
              console.error("Error clearing data:", error)
              showToast({ message: "Failed to clear data", type: "error" })
            } finally {
              setIsLoading(false)
            }
          },
        },
      ],
    )
  }

  const deleteAccount = async () => {
    if (!user || !password) return
    setIsLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email!, password)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
      showToast({ message: "Account deleted successfully", type: "success" })
    } catch (error) {
      console.error("Error deleting account:", error)
      showToast({ message: "Failed to delete account. Check your password.", type: "error" })
    } finally {
      setIsLoading(false)
      setShowDeleteAccountModal(false)
      setPassword("")
    }
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logOut },
    ])
  }

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => showToast({ message: "Could not open link", type: "error" }))
  }

  const renderSection = (title, children) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>
    </View>
  )

  const renderSettingRow = (
    icon,
    title,
    value,
    onPress,
    isSwitch = false,
    switchValue = false,
    onSwitchChange = () => {},
    isDestructive = false,
  ) => {
    const titleColor = isDestructive ? theme.error : theme.text
    const iconColor = isDestructive ? theme.error : theme.primary

    return (
      <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={isSwitch}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: titleColor }]}>{title}</Text>
          {value && <Text style={[styles.settingValue, { color: theme.secondaryText }]}>{value}</Text>}
        </View>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="white"
            ios_backgroundColor={theme.border}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
        )}
      </TouchableOpacity>
    )
  }

  const renderModal = (visible, onClose, title, data, renderItem, keyExtractor) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList data={data} renderItem={renderItem} keyExtractor={keyExtractor} style={styles.modalList} />
        </View>
      </TouchableOpacity>
    </Modal>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={[theme.primary + "10", theme.background]} style={styles.container}>
        <View style={[styles.circle, styles.circle1, { backgroundColor: theme.primary + "20" }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: theme.primary + "15" }]} />
        <View style={[styles.circle, styles.circle3, { backgroundColor: theme.primary + "10" }]} />
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
                <Ionicons name="settings" size={28} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.appName, { color: theme.text }]}>Settings</Text>
                <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>
                  Manage your account and preferences
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          >
            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, { justifyContent: "center", alignItems: "center" }]}>
                    <Ionicons name="person" size={40} color={theme.primary} />
                  </View>
                )}
                <View style={[styles.editImageButton, { backgroundColor: theme.primary, borderColor: theme.card }]}>
                  <Ionicons name="camera" size={12} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                {editMode ? (
                  <TextInput
                    style={[
                      styles.nameInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                    ]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.secondaryText}
                  />
                ) : (
                  <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
                    {user?.displayName || "User"}
                  </Text>
                )}
                <Text style={[styles.profileEmail, { color: theme.secondaryText }]} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.editSaveButton, { backgroundColor: theme.primary + "20" }]}
                onPress={() => (editMode ? saveProfileChanges() : setEditMode(true))}
                disabled={isLoading && editMode}
              >
                {isLoading && editMode ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons
                    name={editMode ? "checkmark-circle-outline" : "create-outline"}
                    size={24}
                    color={theme.primary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {renderSection(
              "Preferences",
              <>
                {renderSettingRow("moon-outline", "Dark Mode", null, null, true, isDarkMode, toggleTheme)}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow(
                  "school-outline",
                  "Division & Batch",
                  `Div ${selectedDivision || "N/A"} - Batch ${selectedBatch || "N/A"}`,
                  () => setShowDivisionModal(true),
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow("library-outline", "Semester", `Semester ${selectedSemester || "N/A"}`, () =>
                  setShowSemesterModal(true),
                )}
              </>,
            )}

            {renderSection(
              "Semester Dates",
              <>
                {renderSettingRow("calendar-outline", "Start Date", formatDateForDisplay(semesterStartDate), () => {
                  setDatePickerMode("start")
                  setIsDatePickerVisible(true)
                })}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow("calendar-outline", "End Date", formatDateForDisplay(semesterEndDate), () => {
                  setDatePickerMode("end")
                  setIsDatePickerVisible(true)
                })}
              </>,
            )}

            {renderSection(
              "Data Management",
              <>
                {renderSettingRow("cloud-upload-outline", "Import Old Data", "Add existing records", () =>
                  setShowImportModal(true),
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow(
                  "document-text-outline",
                  "Export Report",
                  "Generate PDF report",
                  exportData,
                  false,
                  false,
                  () => {},
                  false,
                )}
              </>,
            )}

            {renderSection(
              "Support & About",
              <>
                {renderSettingRow("mail-outline", "Contact Support", "Get help with any issues", () =>
                  openLink("mailto:soham.bhosale24@spit.ac.in?subject=Support%20Request"),
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow("globe-outline", "Visit Website", "Learn more about the app", () =>
                  openLink("https://oops-present.vercel.app"),
                )}
              </>,
            )}

            {renderSection(
              "Account",
              <>
                {renderSettingRow(
                  "trash-outline",
                  "Clear All Data",
                  "Delete all attendance records",
                  clearAllData,
                  false,
                  false,
                  () => {},
                  true,
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow("log-out-outline", "Logout", null, handleLogout, false, false, () => {}, true)}
              </>,
            )}

            <TouchableOpacity style={styles.deleteAccountButton} onPress={() => setShowDeleteAccountModal(true)}>
              <Text style={[styles.deleteAccountButtonText, { color: theme.error }]}>Delete My Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Modals */}
        {renderModal(
          showDivisionModal,
          () => setShowDivisionModal(false),
          "Select Division",
          Divisions,
          ({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedDivision(item)
                setShowDivisionModal(false)
                setTimeout(() => setShowBatchModal(true), 300)
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Division {item}</Text>
              {selectedDivision === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
            </TouchableOpacity>
          ),
          (item) => item,
        )}

        {renderModal(
          showBatchModal,
          () => setShowBatchModal(false),
          "Select Batch",
          availableBatches,
          ({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedBatch(item)
                setShowBatchModal(false)
                updateAcademicInfo({ division: selectedDivision, batch: item })
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Batch {item}</Text>
              {selectedBatch === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
            </TouchableOpacity>
          ),
          (item) => item,
        )}

        {renderModal(
          showSemesterModal,
          () => setShowSemesterModal(false),
          "Select Semester",
          Semesters,
          ({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedSemester(item)
                setShowSemesterModal(false)
                updateAcademicInfo({ semester: item })
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Semester {item}</Text>
              {selectedSemester === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
            </TouchableOpacity>
          ),
          (item) => item,
        )}

        {/* Import Modal */}
        <Modal
          visible={showImportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Import Attendance Data</Text>
                <TouchableOpacity onPress={() => setShowImportModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Enter your existing attendance data to continue tracking from where you left off.
                </Text>

                <Text style={[styles.modalLabel, { color: theme.text }]}>Subject</Text>
                <TouchableOpacity
                  style={[styles.subjectSelector, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => setSubjectModalVisible(true)}
                >
                  <Text
                    style={[styles.subjectSelectorText, { color: selectedSubject ? theme.text : theme.secondaryText }]}
                  >
                    {selectedSubject || "Select a subject"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
                </TouchableOpacity>

                <View style={styles.importRow}>
                  <View style={styles.importColumn}>
                    <Text style={[styles.modalLabel, { color: theme.text }]}>Theory Attended</Text>
                    <TextInput
                      style={[
                        styles.importInput,
                        { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="number-pad"
                      value={theoryAttended}
                      onChangeText={setTheoryAttended}
                    />
                  </View>
                  <View style={styles.importColumn}>
                    <Text style={[styles.modalLabel, { color: theme.text }]}>Theory Total</Text>
                    <TextInput
                      style={[
                        styles.importInput,
                        { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="number-pad"
                      value={theoryTotal}
                      onChangeText={setTheoryTotal}
                    />
                  </View>
                </View>

                <View style={styles.importRow}>
                  <View style={styles.importColumn}>
                    <Text style={[styles.modalLabel, { color: theme.text }]}>Lab Attended</Text>
                    <TextInput
                      style={[
                        styles.importInput,
                        { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="number-pad"
                      value={labAttended}
                      onChangeText={setLabAttended}
                    />
                  </View>
                  <View style={styles.importColumn}>
                    <Text style={[styles.modalLabel, { color: theme.text }]}>Lab Total</Text>
                    <TextInput
                      style={[
                        styles.importInput,
                        { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.secondaryText}
                      keyboardType="number-pad"
                      value={labTotal}
                      onChangeText={setLabTotal}
                    />
                  </View>
                </View>

                <Text style={[styles.modalLabel, { color: theme.text }]}>Import Month</Text>
                <TouchableOpacity
                  style={[styles.subjectSelector, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => setShowMonthPickerModal(true)}
                >
                  <Text style={[styles.subjectSelectorText, { color: theme.text }]}>
                    {format(selectedMonth, "MMMM yyyy")}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
                <Text style={[styles.importNote, { color: theme.secondaryText }]}>
                  * Attendance will be imported up to the last day of the selected month
                </Text>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setShowImportModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: selectedSubject ? theme.primary : theme.primary + "80",
                      opacity: selectedSubject ? 1 : 0.8,
                    },
                  ]}
                  onPress={saveImportedAttendance}
                  disabled={isSavingImport || !selectedSubject}
                >
                  {isSavingImport ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Data</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                {AllSubjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: theme.border },
                      selectedSubject === subject && { backgroundColor: theme.primary + "20" },
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject)
                      setSubjectModalVisible(false)
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: theme.text }]}>{subject}</Text>
                    {selectedSubject === subject && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteAccountModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDeleteAccountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Account</Text>
                <TouchableOpacity onPress={() => setShowDeleteAccountModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  This action will permanently delete your account and all associated data. This cannot be undone.
                </Text>

                <Text style={[styles.modalLabel, { color: theme.text }]}>Confirm your password:</Text>
                <View
                  style={[styles.passwordContainer, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: theme.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.secondaryText}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setShowDeleteAccountModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDeleteButton, { backgroundColor: theme.error }]}
                  onPress={deleteAccount}
                  disabled={!password || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <DatePicker
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onSelectDate={handleDateSelection}
          initialDate={parseISO(datePickerMode === "start" ? semesterStartDate : semesterEndDate)}
          minDate={datePickerMode === "end" ? parseISO(semesterStartDate) : undefined}
          maxDate={datePickerMode === "start" ? parseISO(semesterEndDate) : undefined}
          title={`Select ${datePickerMode === "start" ? "Start" : "End"} Date`}
        />

        <MonthPicker
          visible={showMonthPickerModal}
          onClose={() => setShowMonthPickerModal(false)}
          onSelectMonth={(month) => setSelectedMonth(month)}
          initialDate={selectedMonth}
          minDate={parseISO(semesterStartDate)}
          title="Select Import Month"
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
  headerSubtitle: {
    fontSize: 14,
  },
  scrollContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...createShadow(2),
    borderWidth: 1,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },
  editImageButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.7,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.medium,
    borderWidth: 1,
    marginRight: 20,
  },
  editSaveButton: {
    marginLeft: "auto",
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.full,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sectionCard: {
    borderRadius: spacing.borderRadius.xl,
    overflow: "hidden",
    ...createShadow(1),
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  deleteAccountButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  deleteAccountButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalList: {
    paddingBottom: spacing.lg,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalBody: {
    padding: spacing.md,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  subjectSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  subjectSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  importRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  importColumn: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  importInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: spacing.borderRadius.large,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  importNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: spacing.borderRadius.large,
    paddingHorizontal: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
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
  modalDeleteButton: {
    flex: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.borderRadius.large,
  },
  modalDeleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.borderRadius.large,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
