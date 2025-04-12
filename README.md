# Student Attendance Tracker

A React Native mobile application for tracking student attendance with Firebase integration and timetable support.

## Features

- User authentication with Firebase
- Dark mode support
- Division and batch selection
- Timetable view based on division and batch
- Attendance tracking and history
- Export and import data
- Firebase Firestore integration for data storage

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Firebase account

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Copy the Firebase configuration
5. Update the `firebase/config.ts` file with your configuration

\`\`\`typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
\`\`\`

6. Enable Email/Password authentication in the Firebase console
7. Create Firestore database in the Firebase console

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Start the development server:

\`\`\`bash
npm start
\`\`\`

4. Use the Expo Go app on your mobile device to scan the QR code or run on an emulator

## Usage

1. Sign up for a new account or log in
2. Complete the setup by selecting your division and batch
3. View your timetable based on your division and batch
4. Track attendance for your classes
5. View attendance history and export data as needed

## Data Structure

### Firestore Collections

- `users`: Stores user profiles with division and batch information
  - Fields: `division`, `batch`, `setupCompleted`

- `attendance`: Stores attendance records
  - Fields: `date`, `subject`, `attendees`, `notes`

## License

MIT
