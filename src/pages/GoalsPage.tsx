import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { useAppState } from '../context/AppState'
import {
  BAND_OPTIONS,
  CURRENT_SCORES,
  DAILY_HOUR_OPTIONS,
  HOURS_ESTIMATE,
  dailyMinutesBySkill,
  skillPercentages,
} from '../lib/ieltsPlan'
import { formatMinutes } from '../lib/format'
import type { DailyHours, Skill, TargetBand } from '../types'
import { SKILLS_ORDER } from '../lib/ieltsPlan'
import { totalMinutesSessions } from '../lib/aggregate'

function AllocationTable({ band, hours }: { band: TargetBand; hours: DailyHours }) {
  const { t } = useAppState()
  const mins = dailyMinutesBySkill(band, hours)
  const pct = skillPercentages(band)
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[380px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
          <tr>
            <th className="px-4 py-3 font-medium">{t('goals.thSkill')}</th>
            <th className="px-4 py-3 font-medium">{t('goals.thShare')}</th>
            <th className="px-4 py-3 font-medium">{t('goals.thDay')}</th>
          </tr>
        </thead>
        <tbody className="text-[var(--color-ink)]">
          {SKILLS_ORDER.map((s: Skill) => (
            <tr key={s} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-4 py-3">{t(`skill.${s}`)}</td>
              <td className="px-4 py-3 tabular-nums">{pct[s].toFixed(1)}%</td>
              <td className="px-4 py-3 tabular-nums">{formatMinutes(mins[s])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GoalsPage() {
  const {
    settings,
    setTargetBand,
    setDailyHours,
    setPlanStartDate,
    sessions,
    t,
  } = useAppState()
  const dfLocale = settings.locale === 'ja' ? ja : enUS
  const exam = parseISO(settings.examDate)
  const today = new Date()
  const daysLeft = differenceInCalendarDays(exam, today)
  const totalLoggedMin = totalMinutesSessions(sessions)
  const targetHours = settings.totalHoursEstimate[settings.targetBand]
  const progressPct = Math.min(100, (totalLoggedMin / 60 / targetHours) * 100)

  const daysLeftLine =
    daysLeft >= 0
      ? daysLeft === 1
        ? t('goals.daysLeft1', { n: 1 })
        : t('goals.daysLeftN', { n: daysLeft })
      : t('goals.past', { n: Math.abs(daysLeft) })

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 text-left">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('goals.title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('goals.sub')}</p>
      </header>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('goals.until')}</h2>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--color-ink)]">
          {daysLeftLine}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t('goals.examOn')}{' '}
          {format(exam, settings.locale === 'ja' ? 'yyyy年M月d日 (EEE)' : 'MMMM d, yyyy (EEE)', {
            locale: dfLocale,
          })}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="glass-card flex flex-col gap-1 rounded-2xl p-4 text-sm">
          <span className="text-[var(--color-muted)]">{t('goals.band')}</span>
          <select
            className="glass-chip mt-1 rounded-xl px-3 py-2 text-[var(--color-ink)]"
            value={settings.targetBand}
            onChange={(e) => setTargetBand(e.target.value as TargetBand)}
          >
            {BAND_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {t('goals.bandOpt', { band: b })}
              </option>
            ))}
          </select>
        </label>
        {BAND_OPTIONS.map((b) => (
          <label
            key={b}
            className="glass-card flex flex-col gap-1 rounded-2xl p-4 text-sm"
          >
            <span className="text-[var(--color-muted)]">
              {t('goals.hoursBand', { band: b })}
            </span>
            <select
              className="glass-chip mt-1 rounded-xl px-3 py-2 text-[var(--color-ink)]"
              value={settings.dailyHoursByBand[b]}
              onChange={(e) => setDailyHours(b, Number(e.target.value) as DailyHours)}
            >
              {DAILY_HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {t('goals.hoursOpt', { h })}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="glass-card flex flex-col gap-1 rounded-2xl p-4 text-sm sm:col-span-2">
          <span className="text-[var(--color-muted)]">{t('goals.start')}</span>
          <input
            type="date"
            className="glass-chip mt-1 rounded-xl px-3 py-2 text-[var(--color-ink)]"
            value={settings.planStartDate}
            onChange={(e) => setPlanStartDate(e.target.value)}
          />
        </label>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('goals.scores')}</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {SKILLS_ORDER.map((s) => (
            <li
              key={s}
              className="glass-chip rounded-full px-3 py-1 text-[var(--color-ink)]"
            >
              {t(`skill.${s}`)} {CURRENT_SCORES[s].toFixed(1)}
            </li>
          ))}
        </ul>
      </section>

      {BAND_OPTIONS.map((b) => (
        <section key={b}>
          <h2 className="text-sm font-medium text-[var(--color-muted)]">
            {t('goals.tableBand', { band: b, hours: settings.dailyHoursByBand[b] })}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t('goals.tableHint', { min: settings.dailyHoursByBand[b] * 60 })}
          </p>
          <div className="mt-3">
            <AllocationTable band={b} hours={settings.dailyHoursByBand[b]} />
          </div>
        </section>
      ))}

      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('goals.progressTitle')}</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {t('goals.progressHint', {
            h65: HOURS_ESTIMATE['6.5'],
            h70: HOURS_ESTIMATE['7.0'],
            h75: HOURS_ESTIMATE['7.5'],
            h80: HOURS_ESTIMATE['8.0'],
          })}
        </p>
        <p className="mt-4 text-sm text-[var(--color-ink)]">
          {t('goals.logged')}{' '}
          <strong>{(totalLoggedMin / 60).toFixed(1)}</strong> {t('goals.h')} / {t('goals.rough')}{' '}
          <strong>{targetHours}</strong> {t('goals.h')} (Band {settings.targetBand})
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {progressPct.toFixed(0)}
          {t('goals.refOnly')}
        </p>
      </section>
    </div>
  )
}
