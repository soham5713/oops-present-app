import { db } from "./config"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
  deleteDoc,
} from "firebase/firestore"

export type AttendanceRecord = {
  date: string
  subject: string
  type: string
  status: "present" | "absent" | "cancelled"
  notes?: string
  isManual?: boolean
  id?: string // Optional ID for referencing specific records
}

export const saveAttendance = async (userId: string, records: AttendanceRecord[]): Promise<boolean> => {
  if (!userId || !records.length) {
    console.error("Invalid parameters for saveAttendance")
    return false
  }

  try {
    // Group records by date for batch processing
    const recordsByDate: { [date: string]: AttendanceRecord[] } = {}

    records.forEach((record) => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = []
      }
      recordsByDate[record.date].push(record)
    })

    // Save each date's records
    const savePromises = Object.entries(recordsByDate).map(async ([date, dateRecords]) => {
      const attendanceRef = doc(db, "attendance", `${userId}_${date}`)
      await setDoc(
        attendanceRef,
        {
          userId,
          date,
          records: dateRecords,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      )
    })

    await Promise.all(savePromises)
    return true
  } catch (error) {
    console.error("Error saving attendance:", error)
    throw error
  }
}

export const saveManualRecord = async (userId: string, record: AttendanceRecord): Promise<boolean> => {
  if (!userId || !record) {
    console.error("Invalid parameters for saveManualRecord")
    return false
  }

  try {
    // Generate a unique ID if not provided
    const recordId = record.id || `${record.subject}_${record.type}_${Date.now()}`
    const recordWithId = { ...record, id: recordId, isManual: true }

    // Get existing records for this date
    const attendanceRef = doc(db, "attendance", `${userId}_${record.date}`)
    const attendanceDoc = await getDoc(attendanceRef)

    let existingRecords: AttendanceRecord[] = []
    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data()
      existingRecords = (data.records as AttendanceRecord[]) || []
    }

    // Add or update the manual record
    const recordIndex = existingRecords.findIndex((r) => r.id === recordId)
    if (recordIndex >= 0) {
      existingRecords[recordIndex] = recordWithId
    } else {
      existingRecords.push(recordWithId)
    }

    // Save back to Firestore
    await setDoc(
      attendanceRef,
      {
        userId,
        date: record.date,
        records: existingRecords,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error saving manual record:", error)
    throw error
  }
}

export const deleteManualRecord = async (userId: string, date: string, recordId: string): Promise<boolean> => {
  if (!userId || !date || !recordId) {
    console.error("Invalid parameters for deleteManualRecord")
    return false
  }

  try {
    const attendanceRef = doc(db, "attendance", `${userId}_${date}`)
    const attendanceDoc = await getDoc(attendanceRef)

    if (!attendanceDoc.exists()) {
      return false
    }

    const data = attendanceDoc.data()
    const existingRecords = (data.records as AttendanceRecord[]) || []

    // Filter out the record to delete
    const updatedRecords = existingRecords.filter((record) => record.id !== recordId)

    // If there are no records left, delete the entire document
    if (updatedRecords.length === 0) {
      await deleteDoc(attendanceRef)
    } else {
      // Otherwise update with the filtered records
      await setDoc(
        attendanceRef,
        {
          userId,
          date,
          records: updatedRecords,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      )
    }

    return true
  } catch (error) {
    console.error("Error deleting manual record:", error)
    throw error
  }
}

export const getAttendanceByDate = async (userId: string, date: string): Promise<AttendanceRecord[]> => {
  if (!userId || !date) {
    console.error("Invalid parameters for getAttendanceByDate")
    return []
  }

  try {
    const attendanceRef = doc(db, "attendance", `${userId}_${date}`)
    const attendanceDoc = await getDoc(attendanceRef)

    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data()
      return (data.records as AttendanceRecord[]) || []
    }

    return []
  } catch (error) {
    console.error("Error getting attendance:", error)
    throw error
  }
}

export const getAttendanceByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ [date: string]: AttendanceRecord[] }> => {
  if (!userId || !startDate || !endDate) {
    console.error("Invalid parameters for getAttendanceByDateRange")
    return {}
  }

  try {
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
    )

    const querySnapshot = await getDocs(attendanceQuery)
    const records: { [date: string]: AttendanceRecord[] } = {}

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData
      if (data.date && Array.isArray(data.records)) {
        records[data.date] = data.records as AttendanceRecord[]
      }
    })

    return records
  } catch (error) {
    console.error("Error getting attendance range:", error)
    throw error
  }
}

// Get all dates with attendance records for a user
export const getAttendanceDates = async (userId: string): Promise<string[]> => {
  if (!userId) {
    console.error("Invalid userId for getAttendanceDates")
    return []
  }

  try {
    const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId))

    const querySnapshot = await getDocs(attendanceQuery)
    const dates: string[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData
      if (data.date) {
        dates.push(data.date)
      }
    })

    return dates
  } catch (error) {
    console.error("Error getting attendance dates:", error)
    throw error
  }
}
