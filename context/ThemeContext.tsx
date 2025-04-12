"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ThemeType = "light" | "dark"

type ThemeContextType = {
  theme: ThemeType
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme() as ThemeType
  const [theme, setTheme] = useState<ThemeType>("dark") // Default to dark mode

  useEffect(() => {
    // Load saved theme from AsyncStorage
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
          setTheme(savedTheme as ThemeType)
        } else {
          // If no saved theme or invalid value, use device theme or default to dark
          const defaultTheme = deviceTheme || "dark"
          setTheme(defaultTheme)
          // Save the default theme
          await AsyncStorage.setItem("theme", defaultTheme)
        }
      } catch (error) {
        console.error("Error loading theme", error)
        // If error, use device theme or default to dark
        setTheme(deviceTheme || "dark")
      }
    }

    loadTheme()
  }, [deviceTheme])

  // Save theme to AsyncStorage whenever it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("theme", theme)
      } catch (error) {
        console.error("Error saving theme", error)
      }
    }

    saveTheme()
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
