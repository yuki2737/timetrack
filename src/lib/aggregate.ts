import { eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import type { AppLocale, Skill, StudySession } from '../types'
import { SKILLS_ORDER } from './ieltsPlan'

function localDayKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd')
}

export function minutesBySkillForSessions(
  sessions: StudySession[],
): Record<Skill, number> {
  const out: Record<Skill, number> = {
    speaking: 0,
    listening: 0,
    writing: 0,
    reading: 0,
  }
  for (const s of sessions) {
    if (s.skillAllocSec && Object.keys(s.skillAllocSec).length > 0) {
      for (const k of SKILLS_ORDER) {
        out[k] += (s.skillAllocSec[k] ?? 0) / 60
      }
    } else {
      out[s.skill] += s.durationSec / 60
    }
  }
  for (const k of SKILLS_ORDER) {
    out[k] = Math.round(out[k] * 10) / 10
  }
  return out
}

export function filterSessionsDay(sessions: StudySession[], dayKey: string) {
  return sessions.filter((s) => localDayKey(s.createdAt) === dayKey)
}

export function filterSessionsRange(
  sessions: StudySession[],
  start: Date,
  end: Date,
) {
  const a = start.getTime()
  const b = end.getTime()
  return sessions.filter((s) => {
    const t = parseISO(s.createdAt).getTime()
    return t >= a && t <= b
  })
}

export function weekDailySeries(
  sessions: StudySession[],
  ref: Date,
  locale: AppLocale = 'en',
): { date: string; label: string; speaking: number; listening: number; writing: number; reading: number }[] {
  const loc = locale === 'ja' ? ja : enUS
  const start = startOfWeek(ref, { weekStartsOn: 1 })
  const end = endOfWeek(ref, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const subs = filterSessionsDay(sessions, key)
    const m = minutesBySkillForSessions(subs)
    return {
      date: key,
      label: format(d, 'M/d (EEE)', { locale: loc }),
      speaking: m.speaking,
      listening: m.listening,
      writing: m.writing,
      reading: m.reading,
    }
  })
}

export function totalMinutesSessions(sessions: StudySession[]): number {
  return sessions.reduce((a, s) => a + s.durationSec / 60, 0)
}
