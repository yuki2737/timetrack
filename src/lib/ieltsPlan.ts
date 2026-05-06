import type { DailyHours, Skill, TargetBand } from '../types'

/** Baseline scores per skill (used for gap weights) */
export const CURRENT_SCORES: Record<Skill, number> = {
  speaking: 5.0,
  listening: 5.5,
  writing: 5.5,
  reading: 6.0,
}

const SKILLS_ORDER: Skill[] = ['speaking', 'listening', 'writing', 'reading']
export const BAND_OPTIONS: TargetBand[] = ['6.5', '7.0', '7.5', '8.0']
export const DAILY_HOUR_OPTIONS: DailyHours[] = Array.from(
  { length: 23 },
  (_, i) => 1 + i * 0.5,
)

/**
 * Weight by gap to target band (larger gap → more daily minutes).
 * e.g. toward 7.0: +2.0,+1.5,+1.5,+1.0 → sum 6.0
 */
function gapsToTarget(target: number): Record<Skill, number> {
  return {
    speaking: Math.max(0, target - CURRENT_SCORES.speaking),
    listening: Math.max(0, target - CURRENT_SCORES.listening),
    writing: Math.max(0, target - CURRENT_SCORES.writing),
    reading: Math.max(0, target - CURRENT_SCORES.reading),
  }
}

function weightsForBand(band: TargetBand): Record<Skill, number> {
  const target = Number(band)
  const g = gapsToTarget(target)
  return g
}

/** Per-skill daily target minutes from 6h/8h budget, proportional to gaps. */
export function dailyMinutesBySkill(
  band: TargetBand,
  dailyHours: DailyHours,
): Record<Skill, number> {
  const weights = weightsForBand(band)
  const totalMin = dailyHours * 60
  const sum = SKILLS_ORDER.reduce((a, s) => a + weights[s], 0)
  const raw = SKILLS_ORDER.map((s) => (totalMin * weights[s]) / sum)
  const floors = raw.map((x) => Math.floor(x))
  const remainder = totalMin - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r)
  const mins = [...floors]
  for (let k = 0; k < remainder; k++) mins[order[k].i] += 1
  return {
    speaking: mins[0],
    listening: mins[1],
    writing: mins[2],
    reading: mins[3],
  }
}

export function isValidDailyHours(v: unknown): v is DailyHours {
  return (
    typeof v === 'number' &&
    Number.isFinite(v) &&
    DAILY_HOUR_OPTIONS.some((h) => Math.abs(h - v) < 1e-9)
  )
}

export function skillPercentages(band: TargetBand): Record<Skill, number> {
  const w = weightsForBand(band)
  const sum = SKILLS_ORDER.reduce((a, s) => a + w[s], 0)
  const out = {} as Record<Skill, number>
  for (const s of SKILLS_ORDER) {
    out[s] = sum === 0 ? 0 : (w[s] / sum) * 100
  }
  return out
}

/** Rough total hours toward band (planning hint, not a guarantee) */
export const HOURS_ESTIMATE: Record<TargetBand, number> = {
  '6.5': 160,
  '7.0': 240,
  '7.5': 360,
  '8.0': 520,
}

export const EXAM_DATE = '2026-09-20'

export { SKILLS_ORDER }
