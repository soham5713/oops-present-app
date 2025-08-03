// List of holidays in YYYY-MM-DD format
const HOLIDAYS = [
    "2025-08-15", // Independance Day
    "2025-08-27", // Ganesh Chaturthi
    "2025-09-05", // Eid
    "2025-10-02", // Gandhi Jayanti
    "2025-10-06", // Exams
    "2025-10-07", // Exams
    "2025-10-08", // Exams
    "2025-10-09", // Exams
    "2025-10-10", // Exams
    "2025-10-20", // Diwali
    "2025-10-21", // Diwali
    "2025-10-22", // Diwali
    "2025-10-23", // Diwali
    "2025-10-24", // Diwali
    "2025-05-11", // Guru Nanak Jayanti
]

export const getHolidays = () => {
    return HOLIDAYS
}

export const isHoliday = (dateString: string) => {
    return HOLIDAYS.includes(dateString)
}