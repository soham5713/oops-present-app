"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { auth, db } from "../firebase/config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"

type UserContextType = {
  user: FirebaseUser | null
  userProfile: UserProfile | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
}

export type UserProfile = {
  division?: string
  batch?: string
  setupCompleted?: boolean
  semesterStartDate?: string
  semesterEndDate?: string
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Keys for storing credentials in AsyncStorage
const EMAIL_KEY = "auth_email"
const PASSWORD_KEY = "auth_password"

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      let profile: UserProfile

      if (userDoc.exists()) {
        profile = userDoc.data() as UserProfile
      } else {
        // Create a default profile if it doesn't exist
        profile = {
          setupCompleted: false,
          semesterStartDate: "2025-01-20",
          semesterEndDate: "2025-05-16",
        }
        try {
          await setDoc(doc(db, "users", userId), profile)
        } catch (error) {
          console.error("Error creating default user profile:", error)
        }
      }

      setUserProfile(profile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      // Set a default profile even if there's an error
      setUserProfile({ 
        setupCompleted: false,
        semesterStartDate: "2025-01-20",
        semesterEndDate: "2025-05-16",
      })
    }
  }

  // Auto-login with stored credentials
  const autoLogin = async () => {
    try {
      const email = await AsyncStorage.getItem(EMAIL_KEY)
      const password = await AsyncStorage.getItem(PASSWORD_KEY)

      if (email && password) {
        try {
          await signInWithEmailAndPassword(auth, email, password)
          // The onAuthStateChanged listener will handle setting the user and profile
        } catch (loginError) {
          console.error("Auto-login failed with stored credentials:", loginError)
          // Clear potentially invalid credentials
          await AsyncStorage.removeItem(EMAIL_KEY)
          await AsyncStorage.removeItem(PASSWORD_KEY)
          setIsLoading(false)
        }
      } else {
        // No stored credentials, finish loading
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error checking stored credentials:", error)
      // Clear potentially corrupted storage
      await AsyncStorage.removeItem(EMAIL_KEY)
      await AsyncStorage.removeItem(PASSWORD_KEY)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // User is signed in
        await fetchUserProfile(currentUser.uid)
        setIsLoading(false)
      } else {
        // User is signed out
        setUserProfile(null)
        // Only attempt auto-login if we're still in the loading state
        // This prevents an infinite loop when logging out
        if (isLoading) {
          await autoLogin()
        }
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [isLoading])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        })
      }

      // Create user document in Firestore
      const defaultProfile: UserProfile = {
        setupCompleted: false,
        semesterStartDate: "2025-01-20",
        semesterEndDate: "2025-05-16",
      }

      await setDoc(doc(db, "users", userCredential.user.uid), defaultProfile)

      // Store credentials for auto-login
      await AsyncStorage.setItem(EMAIL_KEY, email)
      await AsyncStorage.setItem(PASSWORD_KEY, password)

      return userCredential
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Store credentials for auto-login
      await AsyncStorage.setItem(EMAIL_KEY, email)
      await AsyncStorage.setItem(PASSWORD_KEY, password)

      return userCredential
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const logOut = async () => {
    try {
      // Clear stored credentials first
      await AsyncStorage.removeItem(EMAIL_KEY)
      await AsyncStorage.removeItem(PASSWORD_KEY)

      // Then sign out from Firebase
      await signOut(auth)

      // Make sure we're not in loading state anymore
      setIsLoading(false)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return

    try {
      const updatedProfile = { ...userProfile, ...data }
      await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true })
      setUserProfile(updatedProfile)
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        signUp,
        signIn,
        logOut,
        updateUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
