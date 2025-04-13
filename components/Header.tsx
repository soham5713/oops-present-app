"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../context/ThemeContext"
import { colors } from "../utils/theme"

type HeaderProps = {
  title: string
  subtitle?: string
  showBackButton?: boolean
  rightComponent?: React.ReactNode
  transparent?: boolean
  onBackPress?: () => void
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  rightComponent,
  transparent = false,
  onBackPress,
}) => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress()
    } else {
      navigation.goBack()
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? "transparent" : theme.headerBackground,
          paddingTop: Platform.OS === "ios" ? insets.top : StatusBar.currentHeight,
        },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode || !transparent ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : theme.headerBackground}
        translucent
      />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={transparent ? theme.text : "white"} />
            </TouchableOpacity>
          )}
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: transparent ? theme.text : "white",
                  marginLeft: showBackButton ? 8 : 0,
                },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: transparent ? theme.secondaryText : "rgba(255, 255, 255, 0.8)",
                    marginLeft: showBackButton ? 8 : 0,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightComponent && <View style={styles.rightSection}>{rightComponent}</View>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
})

export default Header
