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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as ImagePicker from "expo-image-picker"
import { useAttendance } from "../context/AttendanceContext"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { colors } from "../utils/theme"
import { doc, deleteDoc, collection, getDocs, query, where, setDoc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Divisions, getBatches, AllSubjects } from "../timetable"
import * as Print from "expo-print"
// Add this import at the top with the other imports
import { useToast } from "../context/ToastContext"
import Header from "../components/Header"
// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"
// Add these imports at the top with the other imports
import { endOfMonth, format, parseISO } from "date-fns"
// Add these imports for the new components
import DatePicker from "../components/DatePicker"
import MonthPicker from "../components/MonthPicker"

export default function SettingsScreen() {
  const { userProfile } = useUser()
  const { attendees, attendanceRecords } = useAttendance()
  const { isDarkMode, toggleTheme } = useTheme()
  const { user, logOut, updateUserProfile } = useUser()
  const { showToast } = useToast()

  const theme = isDarkMode ? colors.dark : colors.light

  // State variables
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [showDivisionModal, setShowDivisionModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [availableBatches, setAvailableBatches] = useState<string[]>([])
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // New state for attendance import
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [theoryTotal, setTheoryTotal] = useState("")
  const [theoryAttended, setTheoryAttended] = useState("")
  const [labTotal, setLabTotal] = useState("")
  const [labAttended, setLabAttended] = useState("")
  const [importDate, setImportDate] = useState(new Date().toISOString().split("T")[0])
  const [isSavingImport, setIsSavingImport] = useState(false)
  const [subjectModalVisible, setSubjectModalVisible] = useState(false)
  // Add these state variables in the SettingsScreen component
  const [showSemesterStartModal, setShowSemesterStartModal] = useState(false)
  const [showSemesterEndModal, setShowSemesterEndModal] = useState(false)
  const [semesterStartDate, setSemesterStartDate] = useState("2025-01-20")
  const [semesterEndDate, setSemesterEndDate] = useState("2025-05-16")
  const [tempDate, setTempDate] = useState("")
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">("start")
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setProfileImage(user.photoURL)

      if (userProfile) {
        setSelectedDivision(userProfile.division || "")
        setSelectedBatch(userProfile.batch || "")
      }
    }
  }, [user, userProfile])

  // Update available batches when division changes
  useEffect(() => {
    if (selectedDivision) {
      const batches = getBatches(selectedDivision)
      setAvailableBatches(batches)

      // If current batch is not in the new division, select the first batch
      if (batches.length > 0 && !batches.includes(selectedBatch)) {
        setSelectedBatch(batches[0])
      }
    }
  }, [selectedDivision])

  // Add this useEffect to load semester dates from Firebase
  useEffect(() => {
    if (user?.uid) {
      const loadSemesterDates = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data.semesterStartDate) {
              setSemesterStartDate(data.semesterStartDate)
            }
            if (data.semesterEndDate) {
              setSemesterEndDate(data.semesterEndDate)
            }
          }
        } catch (error) {
          console.error("Error loading semester dates:", error)
        }
      }

      loadSemesterDates()
    }
  }, [user?.uid])

  // Pick profile image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        showToast({
          message: "Sorry, we need camera roll permissions to update your profile picture.",
          type: "error",
        })
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri)

        // In a real app, you would upload this to Firebase Storage
        // and update the user's photoURL
        if (user) {
          setIsLoading(true)
          try {
            await updateProfile(user, {
              photoURL: result.assets[0].uri,
            })
            showToast({
              message: "Profile picture updated successfully",
              type: "success",
            })
          } catch (error) {
            console.error("Error updating profile picture:", error)
            showToast({
              message: "Failed to update profile picture",
              type: "error",
            })
          } finally {
            setIsLoading(false)
          }
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      showToast({
        message: "Failed to pick image",
        type: "error",
      })
    }
  }

  // Save profile changes
  const saveProfileChanges = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateProfile(user, {
        displayName: displayName,
      })

      setEditMode(false)
      showToast({
        message: "Profile updated successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      showToast({
        message: "Failed to update profile",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update division and batch
  const updateDivisionAndBatch = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserProfile({
        division: selectedDivision,
        batch: selectedBatch,
      })

      showToast({
        message: "Division and batch updated successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error updating division and batch:", error)
      showToast({
        message: "Failed to update division and batch",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to save semester dates to Firebase
  const saveSemesterDates = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      await updateUserProfile({
        semesterStartDate,
        semesterEndDate,
      })

      showToast({
        message: "Semester dates updated successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error saving semester dates:", error)
      showToast({
        message: "Failed to update semester dates",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the saveImportedAttendance function to show more detailed success message
  const saveImportedAttendance = async () => {
    if (!user?.uid || !selectedSubject) {
      showToast({
        message: "Please select a subject",
        type: "warning",
      })
      return
    }

    // Validate inputs
    const theoryTotalNum = Number.parseInt(theoryTotal)
    const theoryAttendedNum = Number.parseInt(theoryAttended)
    const labTotalNum = Number.parseInt(labTotal)
    const labAttendedNum = Number.parseInt(labAttended)

    if (
      isNaN(theoryTotalNum) ||
      isNaN(theoryAttendedNum) ||
      isNaN(labTotalNum) ||
      isNaN(labAttendedNum) ||
      theoryTotalNum < 0 ||
      theoryAttendedNum < 0 ||
      labTotalNum < 0 ||
      labAttendedNum < 0
    ) {
      showToast({
        message: "Please enter valid numbers for all fields",
        type: "error",
      })
      return
    }

    if (theoryAttendedNum > theoryTotalNum) {
      showToast({
        message: "Attended lectures cannot be more than total lectures",
        type: "error",
      })
      return
    }

    if (labAttendedNum > labTotalNum) {
      showToast({
        message: "Attended labs cannot be more than total labs",
        type: "error",
      })
      return
    }

    // Calculate the last day of the selected month
    const lastDayOfMonth = endOfMonth(selectedMonth)
    const importDateStr = format(lastDayOfMonth, "yyyy-MM-dd")

    // Validate that the import date is after semester start date
    if (importDateStr < semesterStartDate) {
      showToast({
        message: "Import date must be after semester start date",
        type: "error",
      })
      return
    }

    setIsSavingImport(true)
    try {
      // Save to Firestore
      const importedDataRef = doc(db, "importedAttendance", `${user.uid}_${selectedSubject}`)
      await setDoc(importedDataRef, {
        userId: user.uid,
        subject: selectedSubject,
        theoryTotal: theoryTotalNum,
        theoryAttended: theoryAttendedNum,
        labTotal: labTotalNum,
        labAttended: labAttendedNum,
        importDate: importDateStr,
        updatedAt: new Date().toISOString(),
      })

      // Calculate percentages for the success message
      const theoryPercentage = theoryTotalNum > 0 ? Math.round((theoryAttendedNum / theoryTotalNum) * 100) : 0
      const labPercentage = labTotalNum > 0 ? Math.round((labAttendedNum / labTotalNum) * 100) : 0

      showToast({
        message: `${selectedSubject} data imported: Theory ${theoryPercentage}%, Lab ${labPercentage}%`,
        type: "success",
        duration: 4000,
      })

      // Reset form and close modal
      setTheoryTotal("")
      setTheoryAttended("")
      setLabTotal("")
      setLabAttended("")
      setShowImportModal(false)
    } catch (error) {
      console.error("Error saving imported attendance:", error)
      showToast({
        message: "Failed to import attendance data",
        type: "error",
      })
    } finally {
      setIsSavingImport(false)
    }
  }

  // Add this function to handle date selection
  const handleDateSelection = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")

    if (datePickerMode === "start") {
      if (formattedDate > semesterEndDate) {
        showToast({
          message: "Start date cannot be after end date",
          type: "error",
        })
        return
      }
      setSemesterStartDate(formattedDate)
    } else {
      if (formattedDate < semesterStartDate) {
        showToast({
          message: "End date cannot be before start date",
          type: "error",
        })
        return
      }
      setSemesterEndDate(formattedDate)
    }

    setIsDatePickerVisible(false)
    saveSemesterDates()
  }

  // Add this function to format dates for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "MMMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Add this function to handle month selection for import
  const handleMonthSelection = (month: Date) => {
    setSelectedMonth(month)
    setShowMonthPickerModal(false)
  }

  // Add these functions to navigate between months in the month picker
  const goToPreviousMonth = () => {
    const date = new Date(selectedMonth)
    date.setMonth(date.getMonth() - 1)
    setSelectedMonth(date)
  }

  const goToNextMonth = () => {
    const date = new Date(selectedMonth)
    date.setMonth(date.getMonth() + 1)
    const currentDate = new Date()
    if (date <= currentDate) {
      setSelectedMonth(date)
    }
  }

  // Generate HTML for PDF report
  const generateAttendanceReportHTML = async () => {
    if (!user?.uid) return ""

    try {
      // Fetch attendance data from Firebase
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid))
      const querySnapshot = await getDocs(attendanceQuery)

      // Process attendance data
      const attendanceData = []
      const subjectStats = {}

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.records && Array.isArray(data.records)) {
          attendanceData.push({
            date: data.date,
            records: data.records,
          })

          // Calculate subject statistics
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

      // Fetch imported attendance data
      const importedDataQuery = query(collection(db, "importedAttendance"), where("userId", "==", user.uid))
      const importedSnapshot = await getDocs(importedDataQuery)

      // Add imported data to subject stats
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

        // Add imported data to totals
        subjectStats[subject].theoryTotal += data.theoryTotal || 0
        subjectStats[subject].theoryPresent += data.theoryAttended || 0
        subjectStats[subject].labTotal += data.labTotal || 0
        subjectStats[subject].labPresent += data.labAttended || 0
      })

      // Calculate percentages
      Object.values(subjectStats).forEach((stat: any) => {
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0
      })

      // Sort attendance data by date
      attendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Generate HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Oops Present - Attendance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #4f46e5;
              margin-bottom: 5px;
            }
            .header p {
              color: #666;
              margin-top: 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #4f46e5;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .good {
              color: #16a34a;
            }
            .warning {
              color: #f59e0b;
            }
            .danger {
              color: #dc2626;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
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
                .slice(0, 20) // Show only the 20 most recent records
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

  // Helper function for HTML color classes
  const getColorClass = (percentage: number) => {
    if (percentage >= 75) return "good"
    if (percentage >= 60) return "warning"
    return "danger"
  }

  // Export data to PDF
  const exportData = async () => {
    try {
      setIsExporting(true)

      if (!user?.uid) {
        showToast({
          message: "You must be logged in to export data",
          type: "error",
        })
        setIsExporting(false)
        return
      }

      // Generate HTML for the PDF
      const html = await generateAttendanceReportHTML()

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      // Get the file name
      const fileName = `attendance_report_${new Date().toISOString().split("T")[0]}.pdf`

      // Copy to a location where we can share it
      const pdfLocation = `${FileSystem.documentDirectory}${fileName}`
      await FileSystem.copyAsync({
        from: uri,
        to: pdfLocation,
      })

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfLocation, {
          mimeType: "application/pdf",
          dialogTitle: "Share Attendance Report",
          UTI: "com.adobe.pdf",
        })
        showToast({
          message: "Attendance report exported successfully",
          type: "success",
        })
      } else {
        showToast({
          message: "Sharing is not available on this device",
          type: "error",
        })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      showToast({
        message: "Failed to export attendance report",
        type: "error",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Clear all data
  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all attendees and attendance records. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true)

              if (user) {
                // Delete all attendance records for this user
                const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid))
                const querySnapshot = await getDocs(attendanceQuery)

                const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
                await Promise.all(deletePromises)

                // Delete imported attendance data
                const importedQuery = query(collection(db, "importedAttendance"), where("userId", "==", user.uid))
                const importedSnapshot = await getDocs(importedQuery)

                const deleteImportedPromises = importedSnapshot.docs.map((doc) => deleteDoc(doc.ref))
                await Promise.all(deleteImportedPromises)
              }

              // Clear local storage
              await AsyncStorage.clear()

              showToast({
                message: "All data has been cleared. Please restart the app.",
                type: "success",
              })
            } catch (error) {
              console.error("Error clearing data:", error)
              showToast({
                message: "Failed to clear data",
                type: "error",
              })
            } finally {
              setIsLoading(false)
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Delete account
  const deleteAccount = async () => {
    if (!user || !password) return

    setIsLoading(true)
    try {
      // Re-authenticate user before deleting
      const credential = EmailAuthProvider.credential(user.email || "", password)
      await reauthenticateWithCredential(user, credential)

      // Delete user data from Firestore
      const userDocRef = doc(db, "users", user.uid)
      await deleteDoc(userDocRef)

      // Delete attendance records
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid))
      const querySnapshot = await getDocs(attendanceQuery)

      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Delete imported attendance data
      const importedQuery = query(collection(db, "importedAttendance"), where("userId", "==", user.uid))
      const importedSnapshot = await getDocs(importedQuery)

      const deleteImportedPromises = importedSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deleteImportedPromises)

      // Delete user account
      await deleteUser(user)

      // Clear local storage
      await AsyncStorage.clear()

      showToast({
        message: "Your account has been permanently deleted.",
        type: "success",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      showToast({
        message: "Failed to delete account. Please check your password and try again.",
        type: "error",
      })
    } finally {
      setIsLoading(false)
      setShowDeleteAccountModal(false)
      setPassword("")
    }
  }

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logOut()
            } catch (error) {
              console.error("Error logging out:", error)
              showToast({
                message: "Failed to log out",
                type: "error",
              })
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Open email support
  const openEmailSupport = () => {
    Linking.openURL("mailto:bhosalesoham5713@gmail.com?subject=Support%20Request")
  }

  // Open website
  const openWebsite = () => {
    Linking.openURL("https://oops-present.vercel.app")
  }

  // Render the delete account modal
  const renderDeleteAccountModal = () => (
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
            <View style={[styles.passwordContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
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
  )

  // Render the division selection modal
  const renderDivisionModal = () => (
    <Modal
      visible={showDivisionModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDivisionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Division</Text>
            <TouchableOpacity onPress={() => setShowDivisionModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {Divisions.map((division) => (
              <TouchableOpacity
                key={division}
                style={[
                  styles.modalItem,
                  { borderBottomColor: theme.border },
                  selectedDivision === division && { backgroundColor: theme.primary + "20" },
                ]}
                onPress={() => {
                  setSelectedDivision(division)
                  setShowDivisionModal(false)
                  // Show batch modal after selecting division
                  setTimeout(() => setShowBatchModal(true), 300)
                }}
              >
                <Text style={[styles.modalItemText, { color: theme.text }]}>Division {division}</Text>
                {selectedDivision === division && <Ionicons name="checkmark" size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  // Render the batch selection modal
  const renderBatchModal = () => (
    <Modal
      visible={showBatchModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBatchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Batch</Text>
            <TouchableOpacity onPress={() => setShowBatchModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {availableBatches.map((batch) => (
              <TouchableOpacity
                key={batch}
                style={[
                  styles.modalItem,
                  { borderBottomColor: theme.border },
                  selectedBatch === batch && { backgroundColor: theme.primary + "20" },
                ]}
                onPress={() => {
                  setSelectedBatch(batch)
                  setShowBatchModal(false)
                  // Update division and batch after selection
                  setTimeout(() => updateDivisionAndBatch(), 300)
                }}
              >
                <Text style={[styles.modalItemText, { color: theme.text }]}>Batch {batch}</Text>
                {selectedBatch === batch && <Ionicons name="checkmark" size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  // Render the import attendance modal
  const renderImportAttendanceModal = () => (
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
              onPress={() => {
                // Show subject selection modal instead of Alert
                setSubjectModalVisible(true)
              }}
            >
              <Text style={[styles.subjectSelectorText, { color: selectedSubject ? theme.text : theme.secondaryText }]}>
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
  )

  // Add this new function to render the subject selection modal
  const renderSubjectSelectionModal = () => (
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
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Header
        title="Oops Present"
        subtitle={userProfile?.division ? `Division ${userProfile.division} - Batch ${userProfile.batch}` : "Settings"}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCardContainer, { backgroundColor: theme.card }]}>
          <View style={styles.profileContent}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary }]}>
                  <Text style={styles.profileImageText}>
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <View style={[styles.editImageButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              {editMode ? (
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.secondaryText}
                />
              ) : (
                <Text style={[styles.profileName, { color: theme.text }]}>{user?.displayName || "User"}</Text>
              )}
              <Text style={[styles.profileEmail, { color: theme.secondaryText }]}>{user?.email}</Text>

              {editMode ? (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={saveProfileChanges}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.editProfileButton, { backgroundColor: theme.primary + "20" }]}
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="create-outline" size={16} color={theme.primary} />
                  <Text style={[styles.editProfileText, { color: theme.primary }]}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#d1d5db", true: theme.primary }}
                thumbColor="white"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingButton} onPress={() => setShowDivisionModal(true)}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="school-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Division & Batch</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  {userProfile?.division && userProfile?.batch
                    ? `Division ${userProfile.division} - Batch ${userProfile.batch}`
                    : "Not set"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            {/* Import Attendance Data Button */}
            <TouchableOpacity style={styles.settingButton} onPress={() => setShowImportModal(true)}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="cloud-upload-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Import Attendance Data</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Add your existing attendance records
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingButton} onPress={exportData} disabled={isExporting}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="document-text-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Export Attendance Report</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Generate and share a PDF attendance report
                </Text>
              </View>
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingButton} onPress={clearAllData}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="trash-outline" size={22} color={theme.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.error }]}>Clear All Data</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Delete all attendees and records
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Semester Dates Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Semester Dates</Text>
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                setTempDate(semesterStartDate)
                setDatePickerMode("start")
                setIsDatePickerVisible(true)
              }}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="calendar-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Semester Start Date</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  {formatDateForDisplay(semesterStartDate)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                setTempDate(semesterEndDate)
                setDatePickerMode("end")
                setIsDatePickerVisible(true)
              }}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="calendar-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Semester End Date</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  {formatDateForDisplay(semesterEndDate)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={styles.settingButton} onPress={openEmailSupport}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="mail-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Contact Support</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Get help with any issues
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingButton} onPress={openWebsite}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="globe-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Visit Website</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Learn more about our app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.aboutRow}>
              <Text style={[styles.appName, { color: theme.text }]}>Oops Present</Text>
              <Text style={[styles.appVersion, { color: theme.secondaryText }]}>Version 2.0.0</Text>
              <Text style={[styles.appDescription, { color: theme.secondaryText }]}>
                A simple app to track student attendance for classes, meetings, or events.
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.error }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteAccountButton, { borderColor: theme.error }]}
            onPress={() => setShowDeleteAccountModal(true)}
          >
            <Text style={[styles.deleteAccountButtonText, { color: theme.error }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        {renderDeleteAccountModal()}
        {renderDivisionModal()}
        {renderBatchModal()}
        {renderImportAttendanceModal()}
        {renderSubjectSelectionModal()}
        {/* Date Picker Modal */}
        <DatePicker
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onSelectDate={(date) => handleDateSelection(date)}
          initialDate={parseISO(datePickerMode === "start" ? semesterStartDate : semesterEndDate)}
          minDate={datePickerMode === "end" ? parseISO(semesterStartDate) : undefined}
          maxDate={datePickerMode === "start" ? parseISO(semesterEndDate) : undefined}
          title={datePickerMode === "start" ? "Select Semester Start Date" : "Select Semester End Date"}
        />

        {/* Month Picker Modal */}
        <MonthPicker
          visible={showMonthPickerModal}
          onClose={() => setShowMonthPickerModal(false)}
          onSelectMonth={handleMonthSelection}
          initialDate={selectedMonth}
          minDate={parseISO(semesterStartDate)}
          title="Select Import Month"
        />
      </ScrollView>
    </SafeAreaView>
  )
}

// Update the styles to use consistent spacing
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
  },
  profileCardContainer: {
    margin: spacing.screenPadding,
    borderRadius: spacing.borderRadius.large,
    padding: spacing.lg,
    ...createShadow(1),
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileImageText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    marginLeft: spacing.xl,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.borderRadius.large,
    alignSelf: "flex-start",
  },
  editProfileText: {
    marginLeft: spacing.xs,
    fontWeight: "500",
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.large,
    alignSelf: "flex-start",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingCard: {
    borderRadius: spacing.borderRadius.large,
    overflow: "hidden",
    ...createShadow(1),
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  aboutRow: {
    padding: spacing.md,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  accountActions: {
    padding: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    marginBottom: spacing.md,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  deleteAccountButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: spacing.borderRadius.large,
    borderWidth: 1,
  },
  deleteAccountButtonText: {
    fontWeight: "500",
    fontSize: 14,
  },
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
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
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
})
