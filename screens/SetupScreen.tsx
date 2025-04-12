"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"
import { Divisions, getBatches } from "../timetable"

export default function SetupScreen() {
  const { updateUserProfile } = useUser()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [availableBatches, setAvailableBatches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // State for custom dropdowns
  const [divisionModalVisible, setDivisionModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)

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
    if (!division) {
      Alert.alert("Error", "Please select your division")
      return
    }
    setCurrentStep(2)
  }

  const handleComplete = async () => {
    if (!division || !batch) {
      Alert.alert("Error", "Please select both division and batch")
      return
    }

    setIsLoading(true)
    try {
      await updateUserProfile({
        division,
        batch,
        setupCompleted: true,
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      Alert.alert("Error", "Failed to save your preferences. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Custom dropdown item renderer
  const renderDropdownItem = (item: string, onSelect: (value: string) => void, prefix: string) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, { color: theme.text }]}>
        {prefix} {item}
      </Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Ionicons name="school" size={60} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Student Attendance Setup</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Let's set up your account to track attendance
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: currentStep >= 1 ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: currentStep >= 2 ? theme.primary : theme.border,
                },
              ]}
            />
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: currentStep >= 2 ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={styles.stepNumber}>2</Text>
            </View>
          </View>

          {currentStep === 1 ? (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Select Your Division</Text>
              <Text style={[styles.stepDescription, { color: theme.secondaryText }]}>
                Choose the division you belong to
              </Text>

              <Text style={[styles.inputLabel, { color: theme.text }]}>Division</Text>

              {/* Custom Division Dropdown */}
              <TouchableOpacity
                style={[
                  styles.customDropdown,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f3f4f6",
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setDivisionModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownText, { color: division ? theme.text : theme.secondaryText }]}>
                  {division ? `Division ${division}` : "Select Division"}
                </Text>
                <View style={[styles.dropdownIndicator, { backgroundColor: theme.primary }]}>
                  <Ionicons name="chevron-down" size={16} color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Select Your Batch</Text>
              <Text style={[styles.stepDescription, { color: theme.secondaryText }]}>
                Choose the batch you belong to in Division {division}
              </Text>

              <Text style={[styles.inputLabel, { color: theme.text }]}>Batch</Text>

              {/* Custom Batch Dropdown */}
              <TouchableOpacity
                style={[
                  styles.customDropdown,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f3f4f6",
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setBatchModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownText, { color: batch ? theme.text : theme.secondaryText }]}>
                  {batch ? `Batch ${batch}` : "Select Batch"}
                </Text>
                <View style={[styles.dropdownIndicator, { backgroundColor: theme.primary }]}>
                  <Ionicons name="chevron-down" size={16} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.primary }]}
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.primary} />
                  <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: theme.primary }]}
                  onPress={handleComplete}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.completeButtonText}>Saving...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.completeButtonText}>Complete Setup</Text>
                      <Ionicons name="checkmark" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Division Selection Modal */}
        <Modal
          visible={divisionModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDivisionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Division</Text>
                <TouchableOpacity onPress={() => setDivisionModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
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
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Batch</Text>
                <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
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
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    color: "white",
    fontWeight: "bold",
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  stepContent: {
    paddingVertical: 10,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  customDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 24,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    flexDirection: "row",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  completeButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownIndicator: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    padding: 0,
  },
  modalContent: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
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
    fontWeight: "bold",
  },
  modalList: {
    maxHeight: 400,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
})
