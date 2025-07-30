"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/ToastContext"
import { colors } from "../utils/theme"
import { spacing, createShadow } from "../utils/spacing"

const { width, height } = Dimensions.get("window")

export default function SignupScreen() {
  const navigation = useNavigation()
  const { signUp } = useUser()
  const { isDarkMode } = useTheme()
  const { showToast } = useToast()
  const theme = isDarkMode ? colors.dark : colors.light

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async () => {
    // Basic validation
    if (!name.trim()) {
      showToast({
        message: "Please enter your full name",
        type: "warning",
      })
      return
    }

    if (!email.trim()) {
      showToast({
        message: "Please enter your email address",
        type: "warning",
      })
      return
    }

    if (!password.trim()) {
      showToast({
        message: "Please enter a password",
        type: "warning",
      })
      return
    }

    if (!confirmPassword.trim()) {
      showToast({
        message: "Please confirm your password",
        type: "warning",
      })
      return
    }

    // Name validation
    if (name.trim().length < 2) {
      showToast({
        message: "Please enter a valid full name (at least 2 characters)",
        type: "warning",
      })
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showToast({
        message: "Please enter a valid email address",
        type: "warning",
      })
      return
    }

    // Password validation
    if (password.length < 6) {
      showToast({
        message: "Password must be at least 6 characters long",
        type: "warning",
      })
      return
    }

    if (password !== confirmPassword) {
      showToast({
        message: "Passwords do not match. Please check and try again.",
        type: "error",
      })
      return
    }

    setIsLoading(true)
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim())
      showToast({
        message: "Account created successfully! Welcome to Oops Present!",
        type: "success",
        duration: 3000,
      })
    } catch (error) {
      // Show the user-friendly error message from UserContext
      showToast({
        message: error.message,
        type: "error",
        duration: error.code === "auth/email-already-in-use" ? 5000 : 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient
        colors={isDarkMode ? ["#0f3460", "#16213e", "#1a1a2e"] : ["#f093fb", "#f5576c", "#4facfe"]}
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
              <Text style={styles.subtitle}>Create your account to get started</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { backgroundColor: isDarkMode ? "#1e1e2e" : "#ffffff" }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: isDarkMode ? "#ffffff" : "#1a1a2e" }]}>Create Account</Text>
              <View style={styles.titleUnderline} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Full Name</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="person-outline" size={20} color="#f5576c" />
                </View>
                <TextInput
                  style={[styles.input, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={isDarkMode ? "#a0a0b0" : "#718096"}
                  value={name}
                  onChangeText={setName}
                  importantForAutofill="no"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Email Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="mail-outline" size={20} color="#f5576c" />
                </View>
                <TextInput
                  style={[styles.input, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDarkMode ? "#a0a0b0" : "#718096"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  importantForAutofill="no"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#f5576c" />
                </View>
                <TextInput
                  style={[styles.input, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDarkMode ? "#a0a0b0" : "#718096"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  importantForAutofill="no"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isDarkMode ? "#a0a0b0" : "#718096"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2a2a3e" : "#f8f9fa",
                    borderColor: isDarkMode ? "#3a3a4e" : "#e2e8f0",
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#f5576c" />
                </View>
                <TextInput
                  style={[styles.input, { color: isDarkMode ? "#ffffff" : "#2d3748" }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDarkMode ? "#a0a0b0" : "#718096"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  importantForAutofill="no"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ["#a0a0b0", "#8a8a9a"] : ["#f5576c", "#f093fb"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{isLoading ? "Creating Account..." : "Create Account"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]} />
              <Text style={[styles.dividerText, { color: isDarkMode ? "#a0a0b0" : "#718096" }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? "#3a3a4e" : "#e2e8f0" }]} />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDarkMode ? "#a0a0b0" : "#718096" }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    minHeight: height * 0.35,
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
    minHeight: height * 0.65,
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
    backgroundColor: "#f5576c",
    borderRadius: 2,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    backgroundColor: "rgba(245, 87, 108, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    fontWeight: "500",
  },
  eyeButton: {
    padding: spacing.md,
    borderRadius: 12,
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
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.lg,
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footerLink: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5576c",
    marginLeft: spacing.sm,
  },
})
