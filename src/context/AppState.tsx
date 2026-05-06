import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import type {
  AppLocale,
  AppSettings,
  AppTheme,
  DailyHours,
  IconShortcut,
  StudySession,
  TargetBand,
} from '../types'
import {
  defaultSettings,
  loadSessions,
  loadSettings,
  saveSessions,
  saveSettings,
} from '../lib/storage'
import { dailyMinutesBySkill } from '../lib/ieltsPlan'
import { isFirebaseConfigured, getFirebaseAuth } from '../lib/firebase'
import {
  deleteSessionDoc,
  mergeLocalIntoFirestoreIfEmpty,
  parseSettingsDocData,
  querySnapshotToSessions,
  saveSessionDoc,
  saveSettingsDoc,
  sessionsQuery,
  userSettingsRef,
} from '../lib/firestoreUser'
import { mapAuthError } from '../lib/authErrors'
import { translate } from '../i18n/catalog'

type Ctx = {
  sessions: StudySession[]
  settings: AppSettings
  t: (key: string, vars?: Record<string, string | number>) => string
  addSession: (s: Omit<StudySession, 'id' | 'createdAt'>) => Promise<void>
  removeSession: (id: string) => Promise<void>
  setTargetBand: (b: TargetBand) => void
  setDailyHours: (band: TargetBand, h: DailyHours) => void
  setPlanStartDate: (iso: string) => void
  setLocale: (l: AppLocale) => void
  setTheme: (theme: AppTheme) => void
  setIconShortcut: (iconId: string, sc: IconShortcut) => void
  clearIconShortcut: (iconId: string) => void
  todayTargetsMin: Record<import('../types').Skill, number>
  user: User | null
  authReady: boolean
  hydrated: boolean
  firebaseConfigured: boolean
  useCloud: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  authError: string | null
  clearAuthError: () => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [hydrated, setHydrated] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<StudySession[]>(() => loadSessions())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())

  const firebaseOk = isFirebaseConfigured()
  const useCloud = Boolean(firebaseOk && user)

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(settings.locale, key, vars),
    [settings.locale],
  )

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    document.documentElement.lang = settings.locale === 'ja' ? 'ja' : 'en'
  }, [settings.locale])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  useEffect(() => {
    if (!firebaseOk) {
      setAuthReady(true)
      setHydrated(true)
      return
    }
    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setSessions(loadSessions())
        setSettings(loadSettings())
        setHydrated(true)
        setAuthReady(true)
        return
      }
      try {
        await mergeLocalIntoFirestoreIfEmpty(u.uid)
      } catch (e) {
        console.error(e)
        setAuthError(
          e instanceof Error ? e.message : 'Failed to start cloud sync',
        )
      }
      setUser(u)
      setHydrated(false)
      setAuthReady(true)
    })
    return () => unsub()
  }, [firebaseOk])

  useEffect(() => {
    if (!firebaseOk || !user) return
    let gotSessions = false
    let gotSettings = false
    const mark = () => {
      if (gotSessions && gotSettings) setHydrated(true)
    }
    const unsubSess = onSnapshot(sessionsQuery(user.uid), (snap) => {
      setSessions(querySnapshotToSessions(snap))
      if (!gotSessions) {
        gotSessions = true
        mark()
      }
    })
    const unsubSet = onSnapshot(userSettingsRef(user.uid), (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as Record<string, unknown>
        const p = parseSettingsDocData(raw)
        if (p) {
          const rt = raw.theme
          const theme =
            rt === 'light' || rt === 'dark' ? rt : undefined
          setSettings((prev) => ({ ...p, ...(theme ? { theme } : { theme: prev.theme }) }))
        }
      } else {
        setSettings(defaultSettings())
      }
      if (!gotSettings) {
        gotSettings = true
        mark()
      }
    })
    return () => {
      unsubSess()
      unsubSet()
    }
  }, [firebaseOk, user])

  const addSession = useCallback(
    async (row: Omit<StudySession, 'id' | 'createdAt'>) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const createdAt = new Date().toISOString()
      const full: StudySession = { ...row, id, createdAt }
      if (firebaseOk && user) {
        await saveSessionDoc(user.uid, full)
        return
      }
      setSessions((prev) => [full, ...prev])
    },
    [firebaseOk, user],
  )

  const removeSession = useCallback(
    async (id: string) => {
      if (firebaseOk && user) {
        await deleteSessionDoc(user.uid, id)
        return
      }
      setSessions((prev) => prev.filter((s) => s.id !== id))
    },
    [firebaseOk, user],
  )

  const setTargetBand = useCallback(
    (targetBand: TargetBand) => {
      setSettings((prev) => {
        const next = { ...prev, targetBand }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const setDailyHours = useCallback(
    (band: TargetBand, dailyHours: DailyHours) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          dailyHoursByBand: { ...prev.dailyHoursByBand, [band]: dailyHours },
        }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const setPlanStartDate = useCallback(
    (planStartDate: string) => {
      setSettings((prev) => {
        const next = { ...prev, planStartDate }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const setLocale = useCallback(
    (locale: AppLocale) => {
      setSettings((prev) => {
        const next = { ...prev, locale }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const setTheme = useCallback(
    (theme: AppTheme) => {
      setSettings((prev) => {
        const next = { ...prev, theme }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const setIconShortcut = useCallback(
    (iconId: string, sc: IconShortcut) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          iconShortcuts: { ...prev.iconShortcuts, [iconId]: sc },
        }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const clearIconShortcut = useCallback(
    (iconId: string) => {
      setSettings((prev) => {
        const { [iconId]: _, ...rest } = prev.iconShortcuts
        const next = { ...prev, iconShortcuts: rest }
        if (firebaseOk && user) void saveSettingsDoc(user.uid, next)
        return next
      })
    },
    [firebaseOk, user],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseOk) return
    setAuthError(null)
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (e) {
      setAuthError(mapAuthError(e, settings.locale))
    }
  }, [firebaseOk, settings.locale])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!firebaseOk) return
      setAuthError(null)
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      } catch (e) {
        setAuthError(mapAuthError(e, settings.locale))
      }
    },
    [firebaseOk, settings.locale],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!firebaseOk) return
      setAuthError(null)
      try {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      } catch (e) {
        setAuthError(mapAuthError(e, settings.locale))
      }
    },
    [firebaseOk, settings.locale],
  )

  const signOutUser = useCallback(async () => {
    if (!firebaseOk) return
    setAuthError(null)
    await firebaseSignOut(getFirebaseAuth())
  }, [firebaseOk])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const todayTargetsMin = useMemo(
    () => dailyMinutesBySkill(settings.targetBand, settings.dailyHoursByBand[settings.targetBand]),
    [settings.targetBand, settings.dailyHoursByBand],
  )

  const value = useMemo(
    () => ({
      sessions,
      settings,
      t,
      addSession,
      removeSession,
      setTargetBand,
      setDailyHours,
      setPlanStartDate,
      setLocale,
      setTheme,
      setIconShortcut,
      clearIconShortcut,
      todayTargetsMin,
      user,
      authReady,
      hydrated,
      firebaseConfigured: firebaseOk,
      useCloud,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      authError,
      clearAuthError,
    }),
    [
      sessions,
      settings,
      t,
      addSession,
      removeSession,
      setTargetBand,
      setDailyHours,
      setPlanStartDate,
      setLocale,
      setTheme,
      setIconShortcut,
      clearIconShortcut,
      todayTargetsMin,
      user,
      authReady,
      hydrated,
      firebaseOk,
      useCloud,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      authError,
      clearAuthError,
    ],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useAppState() {
  const v = useContext(AppCtx)
  if (!v) throw new Error('useAppState must be used within AppStateProvider')
  return v
}

export { defaultSettings } from '../lib/storage'
