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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/ToastContext"
import { colors } from "../utils/theme"

// Import the spacing utilities
import { spacing, createShadow } from "../utils/spacing"

export default function LoginScreen() {
  const navigation = useNavigation()
  const { signIn } = useUser()
  const { isDarkMode } = useTheme()
  const { showToast } = useToast()
  const theme = isDarkMode ? colors.dark : colors.light

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      showToast({
        message: "Please fill in all fields",
        type: "warning",
      })
      return
    }

    setIsLoading(true)
    try {
      // Directly attempt to sign in without pre-checking if the email exists
      await signIn(email, password)
      // Navigation is handled by the AppNavigator based on auth state
    } catch (error) {
      console.error("Login error:", error)
      // Provide more specific error messages based on Firebase error codes
      if (error.code === "auth/user-not-found") {
        showToast({
          message: "Account not found. Please sign up first.",
          type: "error",
        })
      } else if (error.code === "auth/wrong-password") {
        showToast({
          message: "Incorrect password. Please try again.",
          type: "error",
        })
      } else if (error.code === "auth/invalid-email") {
        showToast({
          message: "Invalid email format. Please check your email.",
          type: "error",
        })
      } else if (error.code === "auth/too-many-requests") {
        showToast({
          message: "Too many failed login attempts. Please try again later.",
          type: "error",
          duration: 5000,
        })
      } else {
        showToast({
          message: "An error occurred during login. Please try again.",
          type: "error",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/attendance.png")} style={{ width: 100, height: 100 }} />
          <Text style={[styles.appName, { color: theme.text }]}>Oops Present</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Login</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.border, backgroundColor: isDarkMode ? theme.background : theme.card },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.secondaryText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.border, backgroundColor: isDarkMode ? theme.background : theme.card },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? "Logging in..." : "Login"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.secondaryText }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Update the styles to use consistent spacing
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.screenPadding,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: spacing.md,
  },
  formContainer: {
    borderRadius: spacing.borderRadius.large,
    padding: spacing.xl,
    ...createShadow(1),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: spacing.borderRadius.large,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: spacing.borderRadius.large,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    ...createShadow(1),
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
})
