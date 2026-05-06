import type { Skill, StudySession } from '../types'
import { SKILLS_ORDER } from './ieltsPlan'

/** Normalize raw percentages to sum 100; empty → 100% on fallback skill */
export function normalizePercentSplit(
  raw: Partial<Record<Skill, number>> | undefined,
  fallbackSkill: Skill,
): Record<Skill, number> {
  const order = SKILLS_ORDER
  const weights = order.map((s) => Math.max(0, Number(raw?.[s] ?? 0)))
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) {
    return Object.fromEntries(
      order.map((s) => [s, s === fallbackSkill ? 100 : 0]),
    ) as Record<Skill, number>
  }
  return Object.fromEntries(
    order.map((s, i) => [s, (weights[i]! / sum) * 100]),
  ) as Record<Skill, number>
}

export function hasMultiSkillSplit(pcts: Record<Skill, number>): boolean {
  return Object.values(pcts).filter((p) => p > 0.0001).length > 1
}

/** Skill with highest share (tie → order in SKILLS_ORDER) */
export function dominantSkill(pcts: Record<Skill, number>): Skill {
  let best: Skill = 'speaking'
  let bestV = -1
  for (const s of SKILLS_ORDER) {
    const v = pcts[s] ?? 0
    if (v > bestV) {
      bestV = v
      best = s
    }
  }
  return best
}

/** Integer seconds per skill; sums to totalSec */
export function skillSplitToAllocSec(
  totalSec: number,
  pcts: Record<Skill, number>,
): Partial<Record<Skill, number>> {
  const order = SKILLS_ORDER
  const w = order.map((s) => Math.max(0, pcts[s] ?? 0))
  const sumW = w.reduce((a, b) => a + b, 0)
  if (sumW <= 0 || totalSec <= 0) return {}

  const ideals = order.map((_, i) => (totalSec * w[i]!) / sumW)
  const floors = order.map((s, i) => {
    const ideal = ideals[i]!
    return { s, sec: Math.floor(ideal), frac: ideal - Math.floor(ideal) }
  })
  const alloc = Object.fromEntries(floors.map((f) => [f.s, f.sec])) as Record<
    Skill,
    number
  >
  let used = floors.reduce((a, f) => a + f.sec, 0)
  let rem = totalSec - used
  const candidates = floors.filter((_, i) => w[i]! > 0)
  candidates.sort((a, b) => b.frac - a.frac)
  let idx = 0
  while (rem > 0 && candidates.length) {
    const f = candidates[idx % candidates.length]!
    alloc[f.s] += 1
    rem--
    idx++
  }
  const out: Partial<Record<Skill, number>> = {}
  for (const s of order) {
    if (alloc[s] > 0) out[s] = alloc[s]
  }
  return out
}

/** Second line for session list when multi-skill allocation */
export function formatSessionAllocLine(
  s: StudySession,
  labelSkill: (sk: Skill) => string,
): string | null {
  if (!s.skillAllocSec) return null
  const keys = SKILLS_ORDER.filter((k) => (s.skillAllocSec![k] ?? 0) > 0)
  if (keys.length <= 1) return null
  const tot = s.durationSec
  return keys
    .map((k) => {
      const sec = s.skillAllocSec![k]!
      const pct = tot > 0 ? Math.round((sec / tot) * 100) : 0
      return `${labelSkill(k)} ${pct}%`
    })
    .join(' · ')
}
