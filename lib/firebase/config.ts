import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDOqxP5wjw5YcEEyyuW-wKW7xiIDubFe-8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'raskan-id.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'raskan-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'raskan-id.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '374537187091',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:374537187091:web:6874007f5ab49cc7a2f4e6',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-LSK8TM1LQN',
}

// Initialize Firebase (singleton pattern safe for Next.js SSR / HMR)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Auth instance & Google Provider for customer login
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Cloud Firestore Database instance with ignoreUndefinedProperties enabled
let firestoreDb
try {
  firestoreDb = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  })
} catch {
  firestoreDb = getFirestore(app)
}

export const db = firestoreDb
