"use client"

import { useTheme } from "../context/ThemeContext"

// Define a consistent color palette
const palette = {
  // Primary colors - using indigo as the brand color
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  // Neutral colors
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  // Semantic colors
  success: {
    light: "#10b981",
    dark: "#34d399",
    bg: {
      light: "#dcfce7",
      dark: "#064e3b",
    },
    text: {
      light: "#166534",
      dark: "#a7f3d0",
    },
  },
  error: {
    light: "#ef4444",
    dark: "#f87171",
    bg: {
      light: "#fee2e2",
      dark: "#7f1d1d",
    },
    text: {
      light: "#b91c1c",
      dark: "#fecaca",
    },
  },
  warning: {
    light: "#f59e0b",
    dark: "#fbbf24",
    bg: {
      light: "#fff7ed",
      dark: "#78350f",
    },
    text: {
      light: "#9a3412",
      dark: "#fed7aa",
    },
  },
  info: {
    light: "#3b82f6",
    dark: "#60a5fa",
    bg: {
      light: "#eff6ff",
      dark: "#1e3a8a",
    },
    text: {
      light: "#1e40af",
      dark: "#bfdbfe",
    },
  },
}

export const colors = {
  light: {
    // Brand colors
    primary: palette.indigo[600],
    primaryDark: palette.indigo[700],
    primaryLight: palette.indigo[500],

    // UI colors
    background: palette.gray[50],
    card: "#ffffff",
    text: palette.gray[900],
    secondaryText: palette.gray[500],
    border: palette.gray[200],
    divider: palette.gray[200],

    // Component-specific colors
    headerBackground: palette.indigo[600],
    headerText: "#ffffff",

    // Status colors
    success: palette.success.light,
    error: palette.error.light,
    warning: palette.warning.light,
    info: palette.info.light,

    // Attendance status
    present: palette.success.bg.light,
    absent: palette.error.bg.light,
    presentText: palette.success.text.light,
    absentText: palette.error.text.light,

    // Misc
    notification: palette.error.light,
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Brand colors
    primary: palette.indigo[500],
    primaryDark: palette.indigo[600],
    primaryLight: palette.indigo[400],

    // UI colors
    background: palette.gray[900],
    card: palette.gray[800],
    text: palette.gray[50],
    secondaryText: palette.gray[400],
    border: palette.gray[700],
    divider: palette.gray[700],

    // Component-specific colors
    headerBackground: palette.indigo[700],
    headerText: "#ffffff",

    // Status colors
    success: palette.success.dark,
    error: palette.error.dark,
    warning: palette.warning.dark,
    info: palette.info.dark,

    // Attendance status
    present: palette.success.bg.dark,
    absent: palette.error.bg.dark,
    presentText: palette.success.text.dark,
    absentText: palette.error.text.dark,

    // Misc
    notification: palette.error.dark,
    shadow: "rgba(0, 0, 0, 0.3)",
  },
}

export const useAppTheme = () => {
  const { isDarkMode } = useTheme()
  return isDarkMode ? colors.dark : colors.light
}
