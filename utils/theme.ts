"use client"

import { useTheme } from "../context/ThemeContext"

export const colors = {
  light: {
    primary: "#4f46e5",
    background: "#f9fafb",
    card: "#ffffff",
    text: "#1f2937",
    border: "#e5e7eb",
    notification: "#ef4444",
    secondaryText: "#6b7280",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    present: "#dcfce7",
    absent: "#fee2e2",
    presentText: "#166534",
    absentText: "#b91c1c",
    headerBackground: "#4f46e5",
    headerText: "#ffffff",
  },
  dark: {
    primary: "#6366f1",
    background: "#111827",
    card: "#1f2937",
    text: "#f9fafb",
    border: "#374151",
    notification: "#f87171",
    secondaryText: "#9ca3af",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",
    present: "#064e3b",
    absent: "#7f1d1d",
    presentText: "#a7f3d0",
    absentText: "#fecaca",
    headerBackground: "#4338ca",
    headerText: "#ffffff",
  },
}

export const useAppTheme = () => {
  const { isDarkMode } = useTheme()
  return isDarkMode ? colors.dark : colors.light
}
