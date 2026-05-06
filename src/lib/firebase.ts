import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function readConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  }
}

export function isFirebaseConfigured(): boolean {
  const c = readConfig()
  return Boolean(c.apiKey && c.projectId && c.appId)
}

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Missing Firebase environment variables')
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(readConfig())
  }
  return app
}

export function getDb() {
  return getFirestore(getFirebaseApp())
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}
