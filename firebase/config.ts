import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEedpguNl05oLeBR6sZQfsmf8iY2pSsgs",
  authDomain: "oops-present-app-b771b.firebaseapp.com",
  projectId: "oops-present-app-b771b",
  storageBucket: "oops-present-app-b771b.firebasestorage.app",
  messagingSenderId: "153600708265",
  appId: "1:153600708265:web:e89e6c866b6af36db563b8",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app
