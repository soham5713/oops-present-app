"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type Attendee = {
  id: string
  name: string
  email?: string
  phone?: string
  group?: string
  imageUri?: string
}

export type AttendanceRecord = {
  date: string // ISO string format
  attendees: {
    id: string
    present: boolean
    notes?: string
  }[]
}

type AttendanceContextType = {
  attendees: Attendee[]
  attendanceRecords: AttendanceRecord[]
  addAttendee: (attendee: Omit<Attendee, "id">) => void
  updateAttendee: (id: string, attendee: Partial<Attendee>) => void
  deleteAttendee: (id: string) => void
  recordAttendance: (date: string, attendanceData: AttendanceRecord["attendees"]) => void
  getAttendanceForDate: (date: string) => AttendanceRecord | undefined
  getAttendanceStatsForAttendee: (id: string) => { present: number; absent: number; percentage: number }
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined)

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const attendeesData = await AsyncStorage.getItem("attendees")
        const attendanceData = await AsyncStorage.getItem("attendanceRecords")

        if (attendeesData) {
          setAttendees(JSON.parse(attendeesData))
        }

        if (attendanceData) {
          setAttendanceRecords(JSON.parse(attendanceData))
        }
      } catch (error) {
        console.error("Error loading data from storage", error)
      }
    }

    loadData()
  }, [])

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("attendees", JSON.stringify(attendees))
        await AsyncStorage.setItem("attendanceRecords", JSON.stringify(attendanceRecords))
      } catch (error) {
        console.error("Error saving data to storage", error)
      }
    }

    saveData()
  }, [attendees, attendanceRecords])

  const addAttendee = (attendee: Omit<Attendee, "id">) => {
    const newAttendee = {
      ...attendee,
      id: Date.now().toString(),
    }
    setAttendees([...attendees, newAttendee])
  }

  const updateAttendee = (id: string, updatedAttendee: Partial<Attendee>) => {
    setAttendees(attendees.map((attendee) => (attendee.id === id ? { ...attendee, ...updatedAttendee } : attendee)))
  }

  const deleteAttendee = (id: string) => {
    setAttendees(attendees.filter((attendee) => attendee.id !== id))
  }

  const recordAttendance = (date: string, attendanceData: AttendanceRecord["attendees"]) => {
    const existingRecordIndex = attendanceRecords.findIndex((record) => record.date === date)

    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedRecords = [...attendanceRecords]
      updatedRecords[existingRecordIndex] = {
        date,
        attendees: attendanceData,
      }
      setAttendanceRecords(updatedRecords)
    } else {
      // Create new record
      setAttendanceRecords([
        ...attendanceRecords,
        {
          date,
          attendees: attendanceData,
        },
      ])
    }
  }

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.find((record) => record.date === date)
  }

  const getAttendanceStatsForAttendee = (id: string) => {
    let present = 0
    let absent = 0

    attendanceRecords.forEach((record) => {
      const attendeeRecord = record.attendees.find((a) => a.id === id)
      if (attendeeRecord) {
        if (attendeeRecord.present) {
          present++
        } else {
          absent++
        }
      }
    })

    const total = present + absent
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, percentage }
  }

  return (
    <AttendanceContext.Provider
      value={{
        attendees,
        attendanceRecords,
        addAttendee,
        updateAttendee,
        deleteAttendee,
        recordAttendance,
        getAttendanceForDate,
        getAttendanceStatsForAttendee,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export const useAttendance = () => {
  const context = useContext(AttendanceContext)
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider")
  }
  return context
}
