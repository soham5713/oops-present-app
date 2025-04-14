"use client"

// Import the colors at the top of the file
import { colors } from "./utils/theme"
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { AttendanceProvider } from "./context/AttendanceContext"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { UserProvider, useUser } from "./context/UserContext"
import { ToastProvider } from "./context/ToastContext"
import { View, ActivityIndicator, LogBox, Text, Image } from "react-native"
import { useEffect, useState } from "react"

// Screens
import HomeScreen from "./screens/HomeScreen"
import SettingsScreen from "./screens/SettingsScreen"
import LoginScreen from "./screens/LoginScreen"
import SignupScreen from "./screens/SignupScreen"
import SetupScreen from "./screens/SetupScreen"
import TimetableScreen from "./screens/TimetableScreen"
import AttendanceScreen from "./screens/AttendanceScreen"
import ManualAttendanceScreen from "./screens/ManualAttendanceScreen"

// Ignore specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Setting a timer for a long period of time",
  "VirtualizedLists should never be nested",
  "Possible Unhandled Promise Rejection",
])

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const AuthStack = createNativeStackNavigator()

function AuthScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  )
}

function SetupScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup" component={SetupScreen} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  const { isDarkMode } = useTheme()
  const theme = isDarkMode ? colors.dark : colors.light

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Manual") {
            iconName = focused ? "create" : "create-outline"
          } else if (route.name === "Timetable") {
            iconName = focused ? "time" : "time-outline"
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline"
          } else if (route.name === "Attendance") {
            iconName = focused ? "checkbox" : "checkbox-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitle: "Oops Present",
      })}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Manual"
        component={ManualAttendanceScreen}
        options={{ headerShown: false, title: "Manual Attendance" }}
      />
      <Tab.Screen name="Timetable" component={TimetableScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, userProfile, isLoading } = useUser()
  const { isDarkMode } = useTheme()
  const [appReady, setAppReady] = useState(false)
  const theme = isDarkMode ? colors.dark : colors.light

  // Add a slight delay to ensure everything is loaded properly
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading || !appReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <Image source={require("./assets/attendance.png")} style={{ width: 100, height: 100, marginBottom: 20 }} />
        <Text style={{ marginTop: 16, color: theme.text, fontSize: 24, fontWeight: "bold" }}>Oops Present</Text>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {user ? userProfile?.setupCompleted ? <MainTabs /> : <SetupScreens /> : <AuthScreens />}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <AttendanceProvider>
            <AppNavigator />
          </AttendanceProvider>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
