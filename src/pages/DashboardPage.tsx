import { addDays, format, parseISO } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useAppState } from '../context/AppState'
import { filterSessionsDay, minutesBySkillForSessions } from '../lib/aggregate'
import { formatDuration, formatMinutes } from '../lib/format'
import { SKILL_COLOR } from '../lib/labels'
import type { Skill } from '../types'
import { BAND_OPTIONS, dailyMinutesBySkill, SKILLS_ORDER } from '../lib/ieltsPlan'
import { getIconComponent, getIconEntry } from '../lib/iconRegistry'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'

export function DashboardPage() {
  const EDGE_VISIBLE_RATIO = 1.005
  const { sessions, settings, t } = useAppState()
  const [openSkills, setOpenSkills] = useState<Partial<Record<Skill, boolean>>>({})
  const [refDate, setRefDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const dfLocale = settings.locale === 'ja' ? ja : enUS
  const ref = new Date(`${refDate}T00:00:00`)
  const todayKey = refDate
  const daySessions = filterSessionsDay(sessions, todayKey)
  const actual = minutesBySkillForSessions(daySessions)
  const targetByBand = Object.fromEntries(
    BAND_OPTIONS.map((b) => [b, dailyMinutesBySkill(b, settings.dailyHoursByBand[b])]),
  ) as Record<(typeof BAND_OPTIONS)[number], Record<Skill, number>>
  const bandLineColor: Record<(typeof BAND_OPTIONS)[number], string> = {
    '6.5': '#f59e0b',
    '7.0': '#7c3aed',
    '7.5': '#0891b2',
    '8.0': '#ef4444',
  }

  const dateStr = format(
    ref,
    settings.locale === 'ja' ? 'yyyy年M月d日 (EEEE)' : 'MMMM d, yyyy (EEEE)',
    { locale: dfLocale },
  )
  const rowDateFmt = settings.locale === 'ja' ? 'M/d HH:mm' : 'M/d h:mm a'
  const moveDay = useCallback((offset: number) => {
    setRefDate((prev) => {
      const baseDate = new Date(`${prev}T00:00:00`)
      return format(addDays(baseDate, offset), 'yyyy-MM-dd')
    })
  }, [])
  const swipeHandlers = useHorizontalSwipe(
    useCallback((direction: 'left' | 'right') => {
      const offset = direction === 'left' ? 1 : -1
      moveDay(offset)
    }, [moveDay]),
  )

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8 text-left"
      onPointerDown={swipeHandlers.onPointerDown}
      onPointerUp={swipeHandlers.onPointerUp}
      onPointerCancel={swipeHandlers.onPointerCancel}
      onPointerLeave={swipeHandlers.onPointerLeave}
      style={swipeHandlers.style}
    >
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('dash.title')}
        </h1>
        <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>{t('dash.baseDate')}</span>
          <button
            type="button"
            className="glass-chip rounded-lg p-1 text-[var(--color-ink)]"
            onClick={() => moveDay(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            className="glass-chip rounded-lg px-2 py-1 text-[var(--color-ink)]"
            value={refDate}
            onChange={(e) => setRefDate(e.target.value)}
          />
          <button
            type="button"
            className="glass-chip rounded-lg p-1 text-[var(--color-ink)]"
            onClick={() => moveDay(1)}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </label>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t('dash.sub', {
            date: dateStr,
            band: settings.targetBand,
            hours: settings.dailyHoursByBand[settings.targetBand],
          })}
        </p>
      </header>

      <div className="space-y-5">
        {SKILLS_ORDER.map((s: Skill) => {
          const isOpen = Boolean(openSkills[s])
          const done = actual[s]
          const maxTarget = Math.max(targetByBand['8.0'][s], 1)
          const axisMax = maxTarget * EDGE_VISIBLE_RATIO
          const fillPct = Math.min(100, (done / axisMax) * 100)
          const bandStats = BAND_OPTIONS.map((b) => {
            const target = targetByBand[b][s]
            return {
              band: b,
              target,
              pct: target > 0 ? (done / target) * 100 : 0,
              line: Math.min(100, (target / axisMax) * 100),
              color: bandLineColor[b],
            }
          })
          return (
            <div
              key={s}
              className="glass-card rounded-2xl p-4"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() =>
                  setOpenSkills((prev) => ({ ...prev, [s]: !prev[s] }))
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: SKILL_COLOR[s] }}
                  />
                  <span className="font-medium text-[var(--color-ink)]">{t(`skill.${s}`)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-[var(--color-muted)]">{formatMinutes(Math.round(done))}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[var(--color-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
                  )}
                </div>
              </button>
              <div className="mt-2 text-xs text-[var(--color-muted)]">
                <div className="relative h-3 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-border)_78%,transparent)] shadow-[inset_0_1px_1px_color-mix(in_oklab,white_16%,transparent)]">
                  <div
                    className="h-full rounded-full shadow-[0_0_14px_color-mix(in_oklab,var(--color-accent)_36%,transparent)] transition-[width]"
                    style={{
                      width: `${fillPct}%`,
                      background: `linear-gradient(90deg, ${SKILL_COLOR[s]}, color-mix(in oklab, ${SKILL_COLOR[s]} 70%, white))`,
                    }}
                  />
                  {bandStats.map((x) => (
                    <span
                      key={x.band}
                      className="absolute inset-y-0 w-[2px]"
                      style={{ left: `${x.line}%`, background: x.color }}
                    />
                  ))}
                </div>
                {isOpen && (
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {bandStats.map((x) => (
                      <span key={x.band} className="tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: x.color }}
                          />
                          {t('dash.planBand', {
                            band: x.band,
                            hours: settings.dailyHoursByBand[x.band],
                          })}
                        </span>{' '}
                        {formatMinutes(x.target)} ({x.pct.toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <section className="glass-card mt-8 rounded-2xl border-dashed p-4 text-sm text-[var(--color-muted)]">
        {t('dash.footer')}
      </section>

      <section className="glass-card mt-6 rounded-2xl p-4">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('log.recent')}</h2>
        {daySessions.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{t('log.empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {daySessions.slice(0, 20).map((s) => {
              const Icon = getIconComponent(s.iconName)
              const entry = getIconEntry(s.iconName)
              return (
                <li
                  key={s.id}
                  className="glass-chip flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 gap-2">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ${entry?.buttonClass ?? ''}`}
                      style={entry ? undefined : { color: SKILL_COLOR[s.skill] }}
                    >
                      <Icon className={`h-4 w-4 ${entry?.iconClass ?? ''}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-ink)]">{s.title}</p>
                      <p className="truncate text-xs text-[var(--color-muted)]">
                        {t(`skill.${s.skill}`)} · {s.category} ·{' '}
                        {format(parseISO(s.createdAt), rowDateFmt, { locale: dfLocale })}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 tabular-nums text-[var(--color-ink)]">
                    {formatDuration(s.durationSec)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
