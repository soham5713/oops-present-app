"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/ToastContext"
import { colors } from "../utils/theme"
import { Divisions, getBatches } from "../timetable"
import { spacing, createShadow } from "../utils/spacing"

const { width, height } = Dimensions.get("window")

// Available semesters
const Semesters = ["1", "2", "3", "4", "5", "6", "7", "8"]

export default function SetupScreen() {
  const { updateUserProfile } = useUser()
  const { isDarkMode } = useTheme()
  const { showToast } = useToast()
  const theme = isDarkMode ? colors.dark : colors.light

  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")
  const [availableBatches, setAvailableBatches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // State for custom dropdowns
  const [divisionModalVisible, setDivisionModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [semesterModalVisible, setSemesterModalVisible] = useState(false)

  useEffect(() => {
    if (division) {
      const batches = getBatches(division)
      setAvailableBatches(batches)
      setBatch(batches.length > 0 ? batches[0] : "")
    } else {
      setAvailableBatches([])
      setBatch("")
    }
  }, [division])

  const handleNext = () => {
    if (currentStep === 1) {
      if (!division) {
        showToast({
          message: "Please select your division to continue",
          type: "warning",
        })
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!batch) {
        showToast({
          message: "Please select your batch to continue",
          type: "warning",
        })
        return
      }
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!division || !batch || !semester) {
      showToast({
        message: "Please complete all selections before proceeding",
        type: "warning",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateUserProfile({
        division,
        batch,
        semester,
        setupCompleted: true,
      })
      showToast({
        message: "Setup completed successfully! Welcome to Oops Present!",
        type: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      showToast({
        message: "Failed to save your preferences. Please try again.",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Custom dropdown item renderer
  const renderDropdownItem = (item: string, onSelect: (value: string) => void, prefix: string) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { borderBottomColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>
        {prefix} {item}
      </Text>
    </TouchableOpacity>
  )

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Your Division</Text>
            <Text style={[styles.stepDescription, { color: isDarkMode ? "#a0a0b0" : "#718096" }]}>
              Choose the division you belong to
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Division</Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
                onPress={() => setDivisionModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="school-outline" size={20} color="#667eea" />
                </View>
                <Text
                  style={[
                    styles.dropdownText,
                    { color: division ? (isDarkMode ? "#ffffff" : "#2d3748") : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  {division ? `Division ${division}` : "Select Division"}
                </Text>
                <View style={styles.dropdownIndicator}>
                  <Ionicons name="chevron-down" size={16} color={isDarkMode ? "#a0a0b0" : "#718096"} />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button]} onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Your Batch</Text>
            <Text style={[styles.stepDescription, { color: isDarkMode ? "#a0a0b0" : "#718096" }]}>
              Choose the batch you belong to in Division {division}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Batch</Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
                onPress={() => setBatchModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={20} color="#667eea" />
                </View>
                <Text
                  style={[
                    styles.dropdownText,
                    { color: batch ? (isDarkMode ? "#ffffff" : "#2d3748") : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  {batch ? `Batch ${batch}` : "Select Batch"}
                </Text>
                <View style={styles.dropdownIndicator}>
                  <Ionicons name="chevron-down" size={16} color={isDarkMode ? "#a0a0b0" : "#718096"} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: "#667eea" }]}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={[styles.secondaryButtonText, { color: "#667eea" }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.primaryButton]} onPress={handleNext} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Your Semester</Text>
            <Text style={[styles.stepDescription, { color: isDarkMode ? "#a0a0b0" : "#718096" }]}>
              Choose your current semester
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Semester</Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
                onPress={() => setSemesterModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#667eea" />
                </View>
                <Text
                  style={[
                    styles.dropdownText,
                    { color: semester ? (isDarkMode ? "#ffffff" : "#2d3748") : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  {semester ? `Semester ${semester}` : "Select Semester"}
                </Text>
                <View style={styles.dropdownIndicator}>
                  <Ionicons name="chevron-down" size={16} color={isDarkMode ? "#a0a0b0" : "#718096"} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: "#667eea" }]}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={[styles.secondaryButtonText, { color: "#667eea" }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.completeButton, isLoading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLoading ? ["#a0a0b0", "#8a8a9a"] : ["#667eea", "#764ba2"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Saving...</Text>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Complete Setup</Text>
                      <Ionicons name="checkmark" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient
        colors={isDarkMode ? ["#1a1a2e", "#16213e", "#0f3460"] : ["#667eea", "#764ba2", "#f093fb"]}
        style={styles.gradientBackground}
      >
        {/* Decorative elements */}
        <View style={styles.decorativeContainer}>
          <View
            style={[
              styles.decorativeCircle,
              styles.circle1,
              { backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.1)" },
            ]}
          />
          <View
            style={[
              styles.decorativeCircle,
              styles.circle2,
              { backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.08)" },
            ]}
          />
          <View
            style={[
              styles.decorativeCircle,
              styles.circle3,
              { backgroundColor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)" },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <LinearGradient colors={["rgba(255,255,255,0.7)", "rgba(255,255,255,0.6)"]} style={styles.logoGradient}>
                  <Image source={require("../assets/attendance.png")} style={styles.logo} />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>Oops Present</Text>
              <Text style={styles.subtitle}>Let's set up your account to track attendance</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { backgroundColor: isDarkMode ? "#1e1e2e" : "#ffffff" }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Account Setup</Text>
              <View style={styles.titleUnderline} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: currentStep >= 1 ? "#667eea" : isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: currentStep >= 1 ? "white" : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  1
                </Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: currentStep >= 2 ? "#667eea" : isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              />
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: currentStep >= 2 ? "#667eea" : isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: currentStep >= 2 ? "white" : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  2
                </Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: currentStep >= 3 ? "#667eea" : isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              />
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: currentStep >= 3 ? "#667eea" : isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: currentStep >= 3 ? "white" : isDarkMode ? "#a0a0b0" : "#718096" },
                  ]}
                >
                  3
                </Text>
              </View>
            </View>

            {getStepContent()}
          </View>
        </ScrollView>

        {/* Division Selection Modal */}
        <Modal
          visible={divisionModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDivisionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? "#1e1e2e" : "#ffffff" }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]}>
                <Text style={[styles.modalTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Division</Text>
                <TouchableOpacity onPress={() => setDivisionModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDarkMode ? "#ffffff" : "#1a1a2e"} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={Divisions}
                keyExtractor={(item) => item}
                renderItem={({ item }) =>
                  renderDropdownItem(
                    item,
                    (value) => {
                      setDivision(value)
                      setDivisionModalVisible(false)
                    },
                    "Division",
                  )
                }
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>

        {/* Batch Selection Modal */}
        <Modal
          visible={batchModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setBatchModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? "#1e1e2e" : "#ffffff" }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]}>
                <Text style={[styles.modalTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Batch</Text>
                <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDarkMode ? "#ffffff" : "#1a1a2e"} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={availableBatches}
                keyExtractor={(item) => item}
                renderItem={({ item }) =>
                  renderDropdownItem(
                    item,
                    (value) => {
                      setBatch(value)
                      setBatchModalVisible(false)
                    },
                    "Batch",
                  )
                }
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>

        {/* Semester Selection Modal */}
        <Modal
          visible={semesterModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSemesterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? "#1e1e2e" : "#ffffff" }]}>
              <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]}>
                <Text style={[styles.modalTitle, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Select Semester</Text>
                <TouchableOpacity onPress={() => setSemesterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDarkMode ? "#ffffff" : "#1a1a2e"} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={Semesters}
                keyExtractor={(item) => item}
                renderItem={({ item }) =>
                  renderDropdownItem(
                    item,
                    (value) => {
                      setSemester(value)
                      setSemesterModalVisible(false)
                    },
                    "Semester",
                  )
                }
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  decorativeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 1000,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -150,
  },
  circle2: {
    width: 200,
    height: 200,
    top: height * 0.25,
    left: -100,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: 50,
    right: -75,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.screenPadding,
    minHeight: height,
  },
  headerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xxl,
    minHeight: height * 0.4,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: spacing.xl,
    ...createShadow(4),
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    marginBottom: spacing.md,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
  },
  formContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xxl,
    paddingTop: spacing.xxl + spacing.lg,
    ...createShadow(8),
    marginTop: spacing.xl,
    minHeight: height * 0.6,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: spacing.xl + spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#667eea",
    borderRadius: 2,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: spacing.md,
    borderRadius: 2,
  },
  stepContent: {
    paddingVertical: spacing.sm,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: spacing.xxl,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "400",
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 64,
    ...createShadow(2),
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownIndicator: {
    padding: spacing.sm,
  },
  button: {
    height: 64,
    borderRadius: 20,
    marginTop: spacing.xl,
    ...createShadow(4),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginRight: spacing.sm,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  primaryButton: {
    height: 64,
    borderRadius: 20,
    flex: 3,
    ...createShadow(4),
  },
  completeButton: {
    height: 64,
    borderRadius: 20,
    flex: 3,
    ...createShadow(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "80%",
    ...createShadow(8),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalList: {
    maxHeight: 400,
  },
  dropdownItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
