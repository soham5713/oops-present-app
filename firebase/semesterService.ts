import { db } from "./config"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { format, endOfMonth } from "date-fns"

// Default semester dates - June 1 to August 31
const DEFAULT_START_DATE = "2025-06-01"
const DEFAULT_END_DATE = "2025-08-31"

export type SemesterSettings = {
  startDate: string // ISO format YYYY-MM-DD
  endDate: string // ISO format YYYY-MM-DD
  updatedAt?: any // Firestore timestamp
}

/**
 * Get the semester settings for a user
 * @param userId The user ID
 * @returns The semester settings object
 */
export const getSemesterSettings = async (userId: string): Promise<SemesterSettings> => {
  if (!userId) {
    throw new Error("User ID is required")
  }

  try {
    const settingsRef = doc(db, "semesterSettings", userId)
    const settingsDoc = await getDoc(settingsRef)

    if (settingsDoc.exists()) {
      return settingsDoc.data() as SemesterSettings
    } else {
      // Return default settings if none exist
      return {
        startDate: DEFAULT_START_DATE,
        endDate: DEFAULT_END_DATE,
      }
    }
  } catch (error) {
    console.error("Error fetching semester settings:", error)
    // Return default settings on error
    return {
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    }
  }
}

/**
 * Save semester settings for a user
 * @param userId The user ID
 * @param settings The semester settings to save
 * @returns A promise that resolves when the settings are saved
 */
export const saveSemesterSettings = async (userId: string, settings: SemesterSettings): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required")
  }

  try {
    const settingsRef = doc(db, "semesterSettings", userId)
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error saving semester settings:", error)
    throw error
  }
}

/**
 * Get the last day of the selected month as an ISO date string
 * @param year The year
 * @param month The month (0-11)
 * @returns The last day of the month as an ISO date string
 */
export const getLastDayOfMonth = (year: number, month: number): string => {
  const date = new Date(year, month, 1) // First day of the month
  return format(endOfMonth(date), "yyyy-MM-dd") // Last day of the month
}
