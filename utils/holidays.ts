// List of holidays in YYYY-MM-DD format
const HOLIDAYS = [
    "2025-04-01", // Exams
    "2025-04-02", // Exams
    "2025-04-03", // Exams
    "2025-04-04", // Exams
    "2025-02-19", // Shivaji Maharaj Jayanti
    "2025-02-26", // Mahashivratri
    "2025-03-14", // Dhulivandan
    "2025-03-31", // Ramjan Eid
    "2025-04-10", // Mahavir Jayanti
    "2025-04-14", // Dr. Ambedkar Jayanti
    "2025-04-18", // Good Friday
    "2025-05-01", // Maharashtra Day
    "2025-05-12"  // Buddha Pornima
]

export const getHolidays = () => {
    return HOLIDAYS
}

export const isHoliday = (dateString: string) => {
    return HOLIDAYS.includes(dateString)
}