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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { useTheme } from "../context/ThemeContext"
import { useToast } from "../context/ToastContext"
import { colors } from "../utils/theme"

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
    if (!name || !email || !password || !confirmPassword) {
      showToast({
        message: "Please fill in all fields",
        type: "warning",
      })
      return
    }

    if (password !== confirmPassword) {
      showToast({
        message: "Passwords do not match",
        type: "error",
      })
      return
    }

    if (password.length < 6) {
      showToast({
        message: "Password must be at least 6 characters",
        type: "warning",
      })
      return
    }

    setIsLoading(true)
    try {
      await signUp(email, password, name)
      showToast({
        message: "Account created successfully!",
        type: "success",
      })
      // Navigation is handled by the AppNavigator based on auth state
    } catch (error) {
      console.error("Signup error:", error)
      // Provide more specific error messages based on Firebase error codes
      if (error.code === "auth/email-already-in-use") {
        showToast({
          message: "This email is already in use. Please use a different email or try logging in.",
          type: "error",
          duration: 4000,
        })
      } else if (error.code === "auth/invalid-email") {
        showToast({
          message: "Invalid email format. Please check your email.",
          type: "error",
        })
      } else if (error.code === "auth/weak-password") {
        showToast({
          message: "Password is too weak. Please use a stronger password.",
          type: "error",
        })
      } else {
        showToast({
          message: "Could not create account. Please try again.",
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
          <Ionicons name="school" size={80} color={theme.primary} />
          <Text style={[styles.appName, { color: theme.text }]}>Student Attendance</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.border, backgroundColor: isDarkMode ? theme.background : theme.card },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.secondaryText}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: theme.border, backgroundColor: isDarkMode ? theme.background : theme.card },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.secondaryText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? "Creating Account..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.secondaryText }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
})
