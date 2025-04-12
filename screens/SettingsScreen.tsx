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
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as ImagePicker from "expo-image-picker"
import { useAttendance } from "../context/AttendanceContext"
import { useTheme } from "../context/ThemeContext"
import { useUser } from "../context/UserContext"
import { colors } from "../utils/theme"
import { LinearGradient } from "expo-linear-gradient"
import { doc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase/config"
import { updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Divisions, getBatches } from "../timetable"
import * as Print from "expo-print"

export default function SettingsScreen() {
  const { attendees, attendanceRecords } = useAttendance()
  const { isDarkMode, toggleTheme } = useTheme()
  const { user, userProfile, logOut, updateUserProfile } = useUser()

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

  // Pick profile image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Required", "Sorry, we need camera roll permissions to update your profile picture.")
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
            Alert.alert("Success", "Profile picture updated successfully")
          } catch (error) {
            console.error("Error updating profile picture:", error)
            Alert.alert("Error", "Failed to update profile picture")
          } finally {
            setIsLoading(false)
          }
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
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
      Alert.alert("Success", "Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile")
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

      Alert.alert("Success", "Division and batch updated successfully")
    } catch (error) {
      console.error("Error updating division and batch:", error)
      Alert.alert("Error", "Failed to update division and batch")
    } finally {
      setIsLoading(false)
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
          <title>Attendance Report</title>
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
            <h1>Attendance Report</h1>
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
            <p>Generated by Student Attendance Tracker App</p>
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
        Alert.alert("Error", "You must be logged in to export data")
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
        Alert.alert("Success", "Attendance report exported successfully")
      } else {
        Alert.alert("Error", "Sharing is not available on this device")
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      Alert.alert("Error", "Failed to export attendance report")
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
              }

              // Clear local storage
              await AsyncStorage.clear()

              Alert.alert("Success", "All data has been cleared. Please restart the app.")
            } catch (error) {
              console.error("Error clearing data:", error)
              Alert.alert("Error", "Failed to clear data")
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

      // Delete user account
      await deleteUser(user)

      // Clear local storage
      await AsyncStorage.clear()

      Alert.alert("Account Deleted", "Your account has been permanently deleted.")
    } catch (error) {
      console.error("Error deleting account:", error)
      Alert.alert("Error", "Failed to delete account. Please check your password and try again.")
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
              Alert.alert("Error", "Failed to log out")
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Open email support
  const openEmailSupport = () => {
    Linking.openURL("mailto:support@attendancetracker.com?subject=Support%20Request")
  }

  // Open website
  const openWebsite = () => {
    Linking.openURL("https://attendancetracker.com")
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
        <LinearGradient
          colors={isDarkMode ? ["#1f2937", "#111827"] : ["#ffffff", "#f9fafb"]}
          style={[styles.profileCard, { borderColor: theme.border }]}
        >
          <View style={styles.profileHeader}>
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
                      backgroundColor: isDarkMode ? theme.background : "#f3f4f6",
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
            </View>

            {editMode ? (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={saveProfileChanges}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
                <Ionicons name="create-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{attendees.length}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Attendees</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{attendanceRecords.length}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Records</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {userProfile?.division && userProfile?.batch ? `${userProfile.division}-${userProfile.batch}` : "N/A"}
              </Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Division</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
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
            <View style={styles.settingButtonContent}>
              <Ionicons name="school-outline" size={24} color={theme.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Division & Batch</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  {userProfile?.division && userProfile?.batch
                    ? `Division ${userProfile.division} - Batch ${userProfile.batch}`
                    : "Not set"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
        <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.settingButton} onPress={exportData} disabled={isExporting}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="document-text-outline" size={24} color={theme.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Export Attendance Report</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Generate and share a PDF attendance report
                </Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.settingButton} onPress={clearAllData}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="trash-outline" size={24} color={theme.error} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.error }]}>Clear All Data</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Delete all attendees and records
                </Text>
              </View>
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
            <View style={styles.settingButtonContent}>
              <Ionicons name="mail-outline" size={24} color={theme.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Contact Support</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Get help with any issues
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.settingButton} onPress={openWebsite}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="globe-outline" size={24} color={theme.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Visit Website</Text>
                <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                  Learn more about our app
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.aboutRow}>
            <Text style={[styles.appName, { color: theme.text }]}>Student Attendance Tracker</Text>
            <Text style={[styles.appVersion, { color: theme.secondaryText }]}>Version 1.0.0</Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  editButton: {
    padding: 8,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  settingCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  settingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aboutRow: {
    padding: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  appVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  accountActions: {
    padding: 16,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  deleteAccountButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalDeleteButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
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
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
})
