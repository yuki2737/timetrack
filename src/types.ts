export type Skill = 'speaking' | 'listening' | 'writing' | 'reading'

export type TargetBand = '6.5' | '7.0' | '7.5' | '8.0'

export type DailyHours = number

export type AppLocale = 'en' | 'ja'

export type AppTheme = 'light' | 'dark'

export type IconShortcut = {
  skill: Skill
  category: string
  /** Optional share of session time per skill (0–100 each; normalized to 100% when saving). */
  skillSplit?: Partial<Record<Skill, number>>
}

export type StudySession = {
  id: string
  title: string
  iconName: string
  skill: Skill
  category: string
  durationSec: number
  /** When set, minutes credited per skill (seconds); should sum to durationSec */
  skillAllocSec?: Partial<Record<Skill, number>>
  createdAt: string
  source: 'timer' | 'manual'
}

export type AppSettings = {
  targetBand: TargetBand
  /** Study hours per day by target band */
  dailyHoursByBand: Record<TargetBand, DailyHours>
  examDate: string
  planStartDate: string
  /** Rough total hours toward band (planning hint) */
  totalHoursEstimate: Record<TargetBand, number>
  /** UI language */
  locale: AppLocale
  /** Light or dark appearance (user-controlled) */
  theme: AppTheme
  /** Per-icon overrides for skill + category when logging */
  iconShortcuts: Partial<Record<string, IconShortcut>>
}
