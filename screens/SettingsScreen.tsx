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
import { getBatches, getSemesterTimetable, AllSubjects } from "../timetable" // Import getSemesterTimetable
import * as Print from "expo-print"
import { useToast } from "../context/ToastContext"
import { spacing, createShadow } from "../utils/spacing"
import { endOfMonth, format, parseISO } from "date-fns"
import DatePicker from "../components/DatePicker"
import MonthPicker from "../components/MonthPicker"
import { LinearGradient } from "expo-linear-gradient"
import { getSemesterSettings, saveSemesterSettings } from "../firebase/semesterService"

const Semesters = ["1", "2", "3", "4", "5", "6", "7", "8"]

export default function SettingsScreen() {
  const { userProfile, user, logOut, updateUserProfile } = useUser()
  const { isDarkMode, toggleTheme } = useTheme()
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { showToast } = useToast()

  const theme = isDarkMode ? colors.dark : colors.light

  // State variables
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState("")

  // Academic Info States
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([])
  const [availableBatches, setAvailableBatches] = useState<string[]>([])

  // Modals for academic info
  const [showSemesterModal, setShowSemesterModal] = useState(false)
  const [showDivisionModal, setShowDivisionModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)

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
  const [semesterStartDate, setSemesterStartDate] = useState("2025-08-04")
  const [semesterEndDate, setSemesterEndDate] = useState("2025-11-26")
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">("start")

  const getSubjectsForUserSemester = () => {
    const userSemester = userProfile?.semester || selectedSemester;
    const userDivision = userProfile?.division || selectedDivision;

    if (!userSemester || !userDivision) {
      // If no semester/division selected, return empty array or all subjects
      return AllSubjects;
    }

    try {
      // Get the timetable for the user's semester
      const semesterData = getSemesterTimetable(userSemester);

      if (!semesterData || !semesterData[userDivision]) {
        console.log(`No data found for semester ${userSemester}, division ${userDivision}`);
        return AllSubjects; // Fallback to all subjects
      }

      // Get all unique subjects from the division's timetable
      const subjects = new Set();

      // Iterate through all batches in the division
      Object.values(semesterData[userDivision]).forEach(batch => {
        if (batch && typeof batch === 'object') {
          // Iterate through all days in the batch
          Object.values(batch).forEach(day => {
            if (Array.isArray(day)) {
              // Iterate through all time slots in the day
              day.forEach(slot => {
                if (slot && slot.subject && slot.subject.trim() !== '') {
                  subjects.add(slot.subject.trim());
                }
              });
            }
          });
        }
      });

      const subjectsArray = Array.from(subjects).sort();
      console.log(`Found subjects for sem ${userSemester}, div ${userDivision}:`, subjectsArray);

      return subjectsArray.length > 0 ? subjectsArray : AllSubjects;
    } catch (error) {
      console.error('Error getting subjects for user semester:', error);
      return AllSubjects; // Fallback to all subjects
    }
  };

  // Load user data and semester settings
  const loadUserData = async () => {
    if (user) {
      setDisplayName(user.displayName || "")
      setProfileImage(user.photoURL)

      if (userProfile) {
        setSelectedSemester(userProfile.semester || "")
        setSelectedDivision(userProfile.division || "")
        setSelectedBatch(userProfile.batch || "")
      }

      // Load semester settings
      try {
        const semesterSettings = await getSemesterSettings(user.uid)
        setSemesterStartDate(semesterSettings.startDate)
        setSemesterEndDate(semesterSettings.endDate)
      } catch (error) {
        console.error("Error loading semester settings:", error)
        // Use default dates
        setSemesterStartDate("2025-08-04")
        setSemesterEndDate("2025-11-26")
      }
    }
  }

  useEffect(() => {
    loadUserData()
  }, [user, userProfile])

  // Update available divisions when semester changes
  useEffect(() => {
    if (selectedSemester) {
      const semesterData = getSemesterTimetable(selectedSemester)
      const divisionsForSemester = Object.keys(semesterData || {})
      setAvailableDivisions(divisionsForSemester)

      // If current division is not in new list, reset it
      if (selectedDivision && !divisionsForSemester.includes(selectedDivision)) {
        setSelectedDivision("")
        setSelectedBatch("")
      }
    } else {
      setAvailableDivisions([])
      setSelectedDivision("")
      setSelectedBatch("")
    }
  }, [selectedSemester])

  // Update available batches when division or semester changes
  useEffect(() => {
    if (selectedDivision && selectedSemester) {
      const batches = getBatches(selectedDivision, selectedSemester)
      setAvailableBatches(batches)

      // If current batch is not in new list, reset it
      if (selectedBatch && !batches.includes(selectedBatch)) {
        setSelectedBatch("")
      }
    } else {
      setAvailableBatches([])
      setSelectedBatch("")
    }
  }, [selectedDivision, selectedSemester])

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

  // Update academic info
  const updateAcademicInfo = async (info: { semester?: string; division?: string; batch?: string }) => {
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
      await saveSemesterSettings(user.uid, { startDate, endDate })
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

      // Query manual attendance records
      const manualQuery = query(collection(db, "manualAttendance"), where("userId", "==", user.uid))
      const manualSnapshot = await getDocs(manualQuery)

      manualSnapshot.forEach((doc) => {
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

      // Add imported attendance data
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

      // Calculate percentages for all subjects
      Object.values(subjectStats).forEach((stat: any) => {
        stat.theoryPercentage = stat.theoryTotal > 0 ? Math.round((stat.theoryPresent / stat.theoryTotal) * 100) : 0
        stat.labPercentage = stat.labTotal > 0 ? Math.round((stat.labPresent / stat.labTotal) * 100) : 0
      })

      // Sort attendance data by date (newest first)
      attendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const getColorClass = (percentage: number) => {
        if (percentage >= 75) return "excellent"
        if (percentage >= 60) return "good"
        if (percentage >= 50) return "warning"
        return "danger"
      }

      const getStatusClass = (status: string) => {
        if (status === "present") return "present"
        if (status === "cancelled") return "cancelled"
        return "absent"
      }

      const totalSubjects = Object.keys(subjectStats).length
      const overallStats = Object.values(subjectStats).reduce((acc: any, stat: any) => {
        acc.totalClasses += stat.theoryTotal + stat.labTotal
        acc.attendedClasses += stat.theoryPresent + stat.labPresent
        return acc
      }, { totalClasses: 0, attendedClasses: 0 })

      const overallPercentage = overallStats.totalClasses > 0
        ? Math.round((overallStats.attendedClasses / overallStats.totalClasses) * 100)
        : 0

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Attendance Report - Oops Present</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
          }
          
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            animation: float 20s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .header h1 { 
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 12px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .header .subtitle { 
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 300;
            margin-bottom: 8px;
          }
          
          .header .user-info {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 16px 24px;
            margin: 20px auto 0;
            max-width: 600px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          
          .content {
            padding: 40px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
          }
          
          .stat-card .number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4f46e5;
            line-height: 1;
            margin-bottom: 8px;
          }
          
          .stat-card .label {
            color: #64748b;
            font-weight: 500;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section {
            margin-bottom: 50px;
          }
          
          .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #e2e8f0;
            position: relative;
          }
          
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
          }
          
          .table-container {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #374151;
            font-weight: 600;
            padding: 20px 16px;
            text-align: left;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.95rem;
          }
          
          tr:hover {
            background-color: #f8fafc;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .excellent {
            color: #059669;
            font-weight: 600;
            background: #ecfdf5;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
          }
          
          .good {
            color: #0891b2;
            font-weight: 600;
            background: #ecfeff;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
          }
          
          .warning {
            color: #d97706;
            font-weight: 600;
            background: #fffbeb;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
          }
          
          .danger {
            color: #dc2626;
            font-weight: 600;
            background: #fef2f2;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
          }
          
          .present {
            color: #059669;
            font-weight: 600;
            background: #ecfdf5;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .absent {
            color: #dc2626;
            font-weight: 600;
            background: #fef2f2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .cancelled {
            color: #d97706;
            font-weight: 600;
            background: #fffbeb;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .manual-record {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
          }
          
          .record-type {
            background: #4f46e5;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-left: 8px;
          }
          
          .manual-tag {
            background: #f59e0b;
            color: white;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 600;
            margin-left: 6px;
          }
          
          .notes-cell {
            max-width: 200px;
            word-wrap: break-word;
            font-size: 0.85rem;
            color: #64748b;
            line-height: 1.4;
          }
          
          .footer {
            background: #f8fafc;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
          }
          
          .footer .app-name {
            font-weight: 600;
            color: #4f46e5;
            font-size: 1.1rem;
            margin-bottom: 8px;
          }
          
          .footer .copyright {
            font-size: 0.85rem;
            margin-bottom: 8px;
          }
          
          .footer .note {
            font-size: 0.8rem;
            font-style: italic;
            color: #94a3b8;
          }
          
          .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
            font-style: italic;
          }
          
          .no-data .icon {
            font-size: 3rem;
            margin-bottom: 16px;
            opacity: 0.5;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .header::before { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1>📚 Attendance Report</h1>
              <p class="subtitle">Comprehensive Academic Performance Analysis</p>
              <div class="user-info">
                <p><strong>${user.displayName || user.email}</strong></p>
                <p>Division: ${userProfile?.division || "N/A"} • Batch: ${userProfile?.batch || "N/A"} • Semester: ${userProfile?.semester || "N/A"}</p>
                <p>Generated on ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
              </div>
            </div>
          </div>
          
          <div class="content">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="number">${totalSubjects}</div>
                <div class="label">Total Subjects</div>
              </div>
              <div class="stat-card">
                <div class="number">${overallStats.totalClasses}</div>
                <div class="label">Total Classes</div>
              </div>
              <div class="stat-card">
                <div class="number">${overallStats.attendedClasses}</div>
                <div class="label">Classes Attended</div>
              </div>
              <div class="stat-card">
                <div class="number ${getColorClass(overallPercentage).replace(' ', '')}">${overallPercentage}%</div>
                <div class="label">Overall Attendance</div>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">📊 Subject-wise Attendance Summary</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Theory Classes</th>
                      <th>Lab Sessions</th>
                      <th>Overall Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.values(subjectStats)
          .map(
            (stat: any) => `
                          <tr>
                            <td><strong>${stat.subject}</strong></td>
                            <td>
                              <span class="${getColorClass(stat.theoryPercentage)}">
                                ${stat.theoryPresent}/${stat.theoryTotal} (${stat.theoryPercentage}%)
                              </span>
                            </td>
                            <td>
                              <span class="${getColorClass(stat.labPercentage)}">
                                ${stat.labPresent}/${stat.labTotal} (${stat.labPercentage}%)
                              </span>
                            </td>
                            <td>
                              <span class="${getColorClass((stat.theoryPercentage + stat.labPercentage) / 2)}">
                                ${Math.round((stat.theoryPercentage + stat.labPercentage) / 2)}%
                              </span>
                            </td>
                          </tr>
                        `,
          )
          .join("")}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">📅 Recent Attendance Records</h2>
              <div class="table-container">
                ${attendanceData.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Session Type</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${attendanceData
            .slice(0, 30)
            .flatMap((day) =>
              day.records.map(
                (record) => `
                              <tr ${record.isManual ? 'class="manual-record"' : ""}>
                                <td>${new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</td>
                                <td>
                                  <strong>${record.subject}</strong>
                                  ${record.isManual ? '<span class="manual-tag">MANUAL</span>' : ""}
                                </td>
                                <td>
                                  ${record.type.toUpperCase()}
                                  <span class="record-type">${record.type}</span>
                                </td>
                                <td>
                                  <span class="${getStatusClass(record.status)}">
                                    ${record.status ? record.status.toUpperCase() : "NOT CONDUCTED"}
                                  </span>
                                </td>
                                <td class="notes-cell">
                                  ${record.notes ? record.notes.replace("[MANUAL]", "").trim() : "-"}
                                </td>
                              </tr>
                            `,
              ),
            )
            .join("")}
                    </tbody>
                  </table>
                ` : `
                  <div class="no-data">
                    <div class="icon">📝</div>
                    <p>No attendance records found.</p>
                    <p>Start tracking your attendance to see detailed reports here.</p>
                  </div>
                `}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="app-name">📱 Oops Present</div>
            <div class="copyright">© ${new Date().getFullYear()} All Rights Reserved</div>
            <div class="note">Manual records are highlighted with yellow background • Generated automatically</div>
          </div>
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
    setShowClearDataModal(true)
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
    setShowLogoutModal(true)
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
    onSwitchChange = () => { },
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
                  "Academic Info",
                  `Sem ${userProfile?.semester || selectedSemester || "N/A"} | Div ${userProfile?.division || selectedDivision || "N/A"} - Batch ${userProfile?.batch || selectedBatch || "N/A"
                  }`,
                  () => setShowSemesterModal(true), // Open semester modal first
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
                  () => { },
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
                  () => { },
                  true,
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {renderSettingRow("log-out-outline", "Logout", null, handleLogout, false, false, () => { }, true)}
              </>,
            )}

            <TouchableOpacity style={styles.deleteAccountButton} onPress={() => setShowDeleteAccountModal(true)}>
              <Text style={[styles.deleteAccountButtonText, { color: theme.error }]}>Delete My Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Semester Selection Modal */}
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
                setTimeout(() => setShowDivisionModal(true), 300) // Open division modal next
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Semester {item}</Text>
              {selectedSemester === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
            </TouchableOpacity>
          ),
          (item) => item,
        )}

        {/* Division Selection Modal */}
        {renderModal(
          showDivisionModal,
          () => setShowDivisionModal(false),
          "Select Division",
          availableDivisions, // Use dynamically available divisions
          ({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedDivision(item)
                setShowDivisionModal(false)
                setTimeout(() => setShowBatchModal(true), 300) // Open batch modal next
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Division {item}</Text>
              {selectedDivision === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
            </TouchableOpacity>
          ),
          (item) => item,
        )}

        {/* Batch Selection Modal */}
        {renderModal(
          showBatchModal,
          () => setShowBatchModal(false),
          "Select Batch",
          availableBatches, // Use dynamically available batches
          ({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedBatch(item)
                setShowBatchModal(false)
                // Update all academic info at once
                updateAcademicInfo({ semester: selectedSemester, division: selectedDivision, batch: item })
              }}
            >
              <Text style={[styles.modalItemText, { color: theme.text }]}>Batch {item}</Text>
              {selectedBatch === item && <Ionicons name="checkmark" size={22} color={theme.primary} />}
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
                {/* Show academic info if available */}
                {(userProfile?.semester || selectedSemester) && (userProfile?.division || selectedDivision) && (
                  <View style={[styles.academicInfoBanner, { backgroundColor: theme.primary + "20", borderColor: theme.primary + "30" }]}>
                    <Text style={[styles.academicInfoText, { color: theme.primary }]}>
                      Showing subjects for Semester {userProfile?.semester || selectedSemester}, Division {userProfile?.division || selectedDivision}
                    </Text>
                  </View>
                )}

                {/* No academic info warning */}
                {!(userProfile?.semester || selectedSemester) || !(userProfile?.division || selectedDivision) && (
                  <View style={[styles.warningBanner, { backgroundColor: theme.error + "20", borderColor: theme.error + "30" }]}>
                    <Ionicons name="warning-outline" size={16} color={theme.error} />
                    <Text style={[styles.warningText, { color: theme.error }]}>
                      Please set your semester and division in preferences for accurate subject list
                    </Text>
                  </View>
                )}

                {getSubjectsForUserSemester().map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: theme.border },
                      selectedSubject === subject && { backgroundColor: theme.primary + "20" },
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject);
                      setSubjectModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: theme.text }]}>{subject}</Text>
                    {selectedSubject === subject && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                ))}

                {/* Show message if no subjects found */}
                {getSubjectsForUserSemester().length === 0 && (
                  <View style={styles.noSubjectsContainer}>
                    <Ionicons name="book-outline" size={48} color={theme.secondaryText} style={{ opacity: 0.5 }} />
                    <Text style={[styles.noSubjectsText, { color: theme.secondaryText }]}>
                      No subjects found for your current semester and division.
                    </Text>
                    <Text style={[styles.noSubjectsSubtext, { color: theme.secondaryText }]}>
                      Please check your academic preferences or contact support.
                    </Text>
                  </View>
                )}
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

        {/* Clear Data Confirmation Modal */}
        <Modal
          visible={showClearDataModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowClearDataModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Clear All Data</Text>
                <TouchableOpacity onPress={() => setShowClearDataModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  This will permanently delete all your attendance data. This action cannot be undone.
                </Text>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setShowClearDataModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDeleteButton, { backgroundColor: theme.error }]}
                  onPress={async () => {
                    setShowClearDataModal(false)
                    // Your existing delete logic here
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
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Logout</Text>
                <TouchableOpacity onPress={() => setShowLogoutModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Are you sure you want to logout? You will need to sign in again to access your account.
                </Text>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDeleteButton, { backgroundColor: theme.error }]}
                  onPress={() => {
                    setShowLogoutModal(false)
                    logOut()
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalDeleteButtonText}>Logout</Text>
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
  academicInfoBanner: {
    margin: spacing.md,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  academicInfoText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  warningBanner: {
    margin: spacing.md,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: spacing.xs,
    flex: 1,
  },
  noSubjectsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noSubjectsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noSubjectsSubtext: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  }
})
