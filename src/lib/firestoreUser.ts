import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import type { AppSettings, IconShortcut, StudySession } from '../types'
import { defaultSettings, loadSessions, loadSettings, resolveTheme } from './storage'
import { getDb } from './firebase'
import { BAND_OPTIONS, HOURS_ESTIMATE, isValidDailyHours } from './ieltsPlan'

const SETTINGS_ID = 'app'

export function userSessionsRef(uid: string) {
  return collection(getDb(), 'users', uid, 'sessions')
}

export function userSettingsRef(uid: string) {
  return doc(getDb(), 'users', uid, 'config', SETTINGS_ID)
}

function parseSkillSplitField(raw: unknown): IconShortcut['skillSplit'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const skills = ['speaking', 'listening', 'writing', 'reading'] as const
  const out: Partial<Record<(typeof skills)[number], number>> = {}
  let any = false
  for (const s of skills) {
    const n = Number((raw as Record<string, unknown>)[s])
    if (Number.isFinite(n) && n >= 0) {
      out[s] = n
      any = true
    }
  }
  return any ? out : undefined
}

function parseIconShortcutsField(raw: unknown): Partial<Record<string, IconShortcut>> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Record<string, IconShortcut>> = {}
  const skills = new Set(['speaking', 'listening', 'writing', 'reading'])
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue
    const o = v as { skill?: unknown; category?: unknown; skillSplit?: unknown }
    const sk = o.skill
    const cat = o.category
    if (typeof sk === 'string' && skills.has(sk) && typeof cat === 'string') {
      const ss = parseSkillSplitField(o.skillSplit)
      out[k] = {
        skill: sk as IconShortcut['skill'],
        category: cat,
        ...(ss ? { skillSplit: ss } : {}),
      }
    }
  }
  return out
}

function settingsToDoc(s: AppSettings): Record<string, unknown> {
  return {
    targetBand: s.targetBand,
    dailyHoursByBand: s.dailyHoursByBand,
    examDate: s.examDate,
    planStartDate: s.planStartDate,
    totalHoursEstimate: s.totalHoursEstimate,
    locale: s.locale,
    theme: s.theme,
    iconShortcuts: s.iconShortcuts,
  }
}

export function parseSettingsDocData(data: Record<string, unknown> | undefined): AppSettings | null {
  if (!data) return null
  const tb = data.targetBand
  if (typeof tb !== 'string' || !BAND_OPTIONS.includes(tb as never)) return null
  const examDate = typeof data.examDate === 'string' ? data.examDate : null
  const planStartDate = typeof data.planStartDate === 'string' ? data.planStartDate : null
  if (!examDate || !planStartDate) return null
  const te = data.totalHoursEstimate as Record<string, number> | undefined
  const dh = data.dailyHoursByBand as Record<string, number> | undefined
  const legacyDh = data.dailyHours
  const base = defaultSettings()
  return {
    ...base,
    targetBand: tb as AppSettings['targetBand'],
    dailyHoursByBand: {
      '6.5': isValidDailyHours(dh?.['6.5']) ? dh['6.5'] : base.dailyHoursByBand['6.5'],
      '7.0': isValidDailyHours(dh?.['7.0'])
        ? dh['7.0']
        : isValidDailyHours(legacyDh)
          ? legacyDh
          : base.dailyHoursByBand['7.0'],
      '7.5': isValidDailyHours(dh?.['7.5']) ? dh['7.5'] : base.dailyHoursByBand['7.5'],
      '8.0': isValidDailyHours(dh?.['8.0']) ? dh['8.0'] : base.dailyHoursByBand['8.0'],
    },
    examDate,
    planStartDate,
    totalHoursEstimate: {
      '6.5': typeof te?.['6.5'] === 'number' ? te['6.5'] : HOURS_ESTIMATE['6.5'],
      '7.0': typeof te?.['7.0'] === 'number' ? te['7.0'] : HOURS_ESTIMATE['7.0'],
      '7.5': typeof te?.['7.5'] === 'number' ? te['7.5'] : HOURS_ESTIMATE['7.5'],
      '8.0': typeof te?.['8.0'] === 'number' ? te['8.0'] : HOURS_ESTIMATE['8.0'],
    },
    locale: data.locale === 'ja' ? 'ja' : 'en',
    theme: resolveTheme(data.theme),
    iconShortcuts: parseIconShortcutsField(data.iconShortcuts),
  }
}

export async function saveSettingsDoc(uid: string, s: AppSettings): Promise<void> {
  await setDoc(userSettingsRef(uid), settingsToDoc(s), { merge: true })
}

export async function saveSessionDoc(uid: string, session: StudySession): Promise<void> {
  const row: Record<string, unknown> = {
    title: session.title,
    iconName: session.iconName,
    skill: session.skill,
    category: session.category,
    durationSec: session.durationSec,
    createdAt: session.createdAt,
    source: session.source,
  }
  if (session.skillAllocSec && Object.keys(session.skillAllocSec).length > 0) {
    row.skillAllocSec = session.skillAllocSec
  }
  await setDoc(doc(getDb(), 'users', uid, 'sessions', session.id), row)
}

export async function deleteSessionDoc(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'users', uid, 'sessions', sessionId))
}

/** On first login: upload local-only data to Firestore if cloud is empty */
export async function mergeLocalIntoFirestoreIfEmpty(uid: string): Promise<void> {
  const sessionsCol = userSessionsRef(uid)
  const existing = await getDocs(query(sessionsCol, limit(1)))
  if (existing.empty) {
    const local = loadSessions()
    const chunk = 400
    for (let i = 0; i < local.length; i += chunk) {
      const batch = writeBatch(getDb())
      for (const sess of local.slice(i, i + chunk)) {
        batch.set(doc(getDb(), 'users', uid, 'sessions', sess.id), {
          title: sess.title,
          iconName: sess.iconName,
          skill: sess.skill,
          category: sess.category,
          durationSec: sess.durationSec,
          createdAt: sess.createdAt,
          source: sess.source,
          ...(sess.skillAllocSec && Object.keys(sess.skillAllocSec).length > 0
            ? { skillAllocSec: sess.skillAllocSec }
            : {}),
        })
      }
      await batch.commit()
    }
  }

  const settingsSnap = await getDoc(userSettingsRef(uid))
  if (!settingsSnap.exists()) {
    const local = loadSettings()
    await setDoc(userSettingsRef(uid), settingsToDoc(local), { merge: true })
  }
}

export function sessionsQuery(uid: string) {
  return query(userSessionsRef(uid), orderBy('createdAt', 'desc'))
}

export function querySnapshotToSessions(snap: QuerySnapshot<DocumentData>): StudySession[] {
  const out: StudySession[] = []
  for (const d of snap.docs) {
    const x = d.data()
    const skill = x.skill
    const source = x.source
    if (
      skill !== 'speaking' &&
      skill !== 'listening' &&
      skill !== 'writing' &&
      skill !== 'reading'
    ) {
      continue
    }
    if (source !== 'timer' && source !== 'manual') continue
    const allocRaw = x.skillAllocSec
    let skillAllocSec: StudySession['skillAllocSec']
    if (allocRaw && typeof allocRaw === 'object') {
      const a: Partial<Record<string, number>> = {}
      for (const sk of ['speaking', 'listening', 'writing', 'reading'] as const) {
        const n = Number((allocRaw as Record<string, unknown>)[sk])
        if (Number.isFinite(n) && n > 0) a[sk] = n
      }
      skillAllocSec = Object.keys(a).length ? (a as StudySession['skillAllocSec']) : undefined
    }
    out.push({
      id: d.id,
      title: String(x.title ?? ''),
      iconName: String(x.iconName ?? 'BookOpen'),
      skill,
      category: String(x.category ?? ''),
      durationSec: Number(x.durationSec ?? 0),
      ...(skillAllocSec ? { skillAllocSec } : {}),
      createdAt: String(x.createdAt ?? ''),
      source,
    })
  }
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
