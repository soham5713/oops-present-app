"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, StatusBar, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import { colors } from "../utils/theme"

// Toast types
export type ToastType = "success" | "error" | "warning" | "info"

// Toast data structure
export interface ToastData {
  type: ToastType
  message: string
  duration?: number
}

// Context interface
interface ToastContextType {
  showToast: (toast: ToastData) => void
  hideToast: () => void
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [visible, setVisible] = useState(false)
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(-100)).current
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Show toast animation
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // Hide toast animation
  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback()
    })
  }

  // Show toast
  const showToast = (toastData: ToastData) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If a toast is already visible, hide it first
    if (visible) {
      animateOut(() => {
        setToast(toastData)
        setVisible(true)
        animateIn()

        // Auto-hide after duration
        const duration = toastData.duration || 3000
        timeoutRef.current = setTimeout(() => {
          hideToast()
        }, duration)
      })
    } else {
      setToast(toastData)
      setVisible(true)
      animateIn()

      // Auto-hide after duration
      const duration = toastData.duration || 3000
      timeoutRef.current = setTimeout(() => {
        hideToast()
      }, duration)
    }
  }

  // Hide toast
  const hideToast = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    animateOut(() => {
      setVisible(false)
      setToast(null)
    })
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Get icon based on toast type
  const getIcon = () => {
    if (!toast) return null

    switch (toast.type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={24} color="white" />
      case "error":
        return <Ionicons name="alert-circle" size={24} color="white" />
      case "warning":
        return <Ionicons name="warning" size={24} color="white" />
      case "info":
        return <Ionicons name="information-circle" size={24} color="white" />
      default:
        return null
    }
  }

  // Get background color based on toast type
  const getBackgroundColor = () => {
    if (!toast) return theme.primary

    switch (toast.type) {
      case "success":
        return theme.success
      case "error":
        return theme.error
      case "warning":
        return theme.warning
      case "info":
        return theme.info
      default:
        return theme.primary
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Toast component */}
      {visible && toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: getBackgroundColor(),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
            },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.iconContainer}>{getIcon()}</View>
            <Text style={styles.toastMessage}>{toast.message}</Text>
            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Styles
const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    maxWidth: width - 32,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
})
