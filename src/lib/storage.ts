import type { AppSettings, AppTheme, StudySession } from '../types'
import {
  BAND_OPTIONS,
  EXAM_DATE,
  HOURS_ESTIMATE,
  isValidDailyHours,
} from './ieltsPlan'

const KEY_SESSIONS = 'ielts-track-sessions-v1'
const KEY_SETTINGS = 'ielts-track-settings-v1'

export function resolveTheme(raw: unknown): AppTheme {
  if (raw === 'light' || raw === 'dark') return raw
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    return 'dark'
  return 'light'
}

export function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(KEY_SESSIONS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StudySession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSessions(sessions: StudySession[]) {
  localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions))
}

export function defaultSettings(): AppSettings {
  const today = new Date().toISOString().slice(0, 10)
  return {
    targetBand: '7.0',
    dailyHoursByBand: {
      '6.5': 5,
      '7.0': 6,
      '7.5': 8,
      '8.0': 9,
    },
    examDate: EXAM_DATE,
    planStartDate: today,
    totalHoursEstimate: { ...HOURS_ESTIMATE },
    locale: 'en',
    theme: resolveTheme(undefined),
    iconShortcuts: {},
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as Partial<AppSettings> & {
      dailyHours?: number
    }
    const base = defaultSettings()
    return {
      ...base,
      ...parsed,
      dailyHoursByBand: {
        '6.5': isValidDailyHours(parsed.dailyHoursByBand?.['6.5'])
          ? parsed.dailyHoursByBand['6.5']
          : base.dailyHoursByBand['6.5'],
        '7.0': isValidDailyHours(parsed.dailyHoursByBand?.['7.0'])
          ? parsed.dailyHoursByBand['7.0']
          : isValidDailyHours(parsed.dailyHours)
            ? parsed.dailyHours
            : base.dailyHoursByBand['7.0'],
        '7.5': isValidDailyHours(parsed.dailyHoursByBand?.['7.5'])
          ? parsed.dailyHoursByBand['7.5']
          : base.dailyHoursByBand['7.5'],
        '8.0': isValidDailyHours(parsed.dailyHoursByBand?.['8.0'])
          ? parsed.dailyHoursByBand['8.0']
          : base.dailyHoursByBand['8.0'],
      },
      totalHoursEstimate: { ...HOURS_ESTIMATE },
      locale: parsed.locale === 'ja' ? 'ja' : 'en',
      theme: resolveTheme(parsed.theme),
      targetBand: BAND_OPTIONS.includes(parsed.targetBand as never)
        ? (parsed.targetBand as AppSettings['targetBand'])
        : base.targetBand,
      iconShortcuts:
        parsed.iconShortcuts && typeof parsed.iconShortcuts === 'object'
          ? parsed.iconShortcuts
          : {},
    }
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s))
}
