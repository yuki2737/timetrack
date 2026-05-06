import { useCallback, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { useAppState } from '../context/AppState'
import {
  filterSessionsRange,
  minutesBySkillForSessions,
  totalMinutesSessions,
} from '../lib/aggregate'
import { dailyMinutesBySkill, skillPercentages } from '../lib/ieltsPlan'
import { SKILLS_ORDER } from '../lib/ieltsPlan'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'

export function SkillsComparePage() {
  const { sessions, settings, t } = useAppState()
  const [refDate, setRefDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const ref = new Date(`${refDate}T00:00:00`)
  const dfLocale = settings.locale === 'ja' ? ja : enUS
  const start = startOfWeek(ref, { weekStartsOn: 1 })
  const end = endOfWeek(ref, { weekStartsOn: 1 })
  const weekSessions = filterSessionsRange(sessions, start, end)
  const actual = minutesBySkillForSessions(weekSessions)
  const totalMin = totalMinutesSessions(weekSessions)

  const radarTarget = useMemo(() => {
    const pLow = skillPercentages('6.5')
    const pHigh = skillPercentages('8.0')
    return SKILLS_ORDER.map((s) => ({
      skill: t(`skill.${s}`),
      bandLowPct: Math.round(pLow[s] * 10) / 10,
      bandHighPct: Math.round(pHigh[s] * 10) / 10,
    }))
  }, [t])

  const radarActualVsTarget = useMemo(() => {
    const p = skillPercentages(settings.targetBand)
    return SKILLS_ORDER.map((s) => ({
      skill: t(`skill.${s}`),
      targetMixPct: Math.round(p[s] * 10) / 10,
      weekMixPct:
        totalMin > 0 ? Math.round((actual[s] / totalMin) * 1000) / 10 : 0,
    }))
  }, [actual, settings.targetBand, totalMin, t])

  const barData = useMemo(() => {
    const planDay = dailyMinutesBySkill(
      settings.targetBand,
      settings.dailyHoursByBand[settings.targetBand],
    )
    return SKILLS_ORDER.map((s) => ({
      skill: t(`skill.${s}`),
      key: s,
      targetMinutes: planDay[s] * 7,
      actualMinutes: Math.round(actual[s] * 10) / 10,
    }))
  }, [actual, settings.dailyHoursByBand, settings.targetBand, t])

  const lineData = useMemo(() => {
    const m65 = dailyMinutesBySkill('6.5', settings.dailyHoursByBand['6.5'])
    const m70 = dailyMinutesBySkill('7.0', settings.dailyHoursByBand['7.0'])
    const m75 = dailyMinutesBySkill('7.5', settings.dailyHoursByBand['7.5'])
    const m80 = dailyMinutesBySkill('8.0', settings.dailyHoursByBand['8.0'])
    return SKILLS_ORDER.map((s) => ({
      skill: t(`skill.${s}`),
      b65: m65[s],
      b70: m70[s],
      b75: m75[s],
      b80: m80[s],
    }))
  }, [settings.dailyHoursByBand, t])
  const moveWeek = useCallback((offset: number) => {
    setRefDate((prev) => {
      const baseDate = new Date(`${prev}T00:00:00`)
      return format(addWeeks(baseDate, offset), 'yyyy-MM-dd')
    })
  }, [])
  const swipeHandlers = useHorizontalSwipe(
    useCallback((direction: 'left' | 'right') => {
      const offset = direction === 'left' ? 1 : -1
      moveWeek(offset)
    }, [moveWeek]),
  )
  const weekRangeLabel =
    settings.locale === 'ja'
      ? `${format(start, 'M/d', { locale: dfLocale })} - ${format(end, 'M/d', { locale: dfLocale })}`
      : `${format(start, 'MMM d', { locale: dfLocale })} - ${format(end, 'MMM d', { locale: dfLocale })}`

  return (
    <div
      className="mx-auto max-w-4xl space-y-10 px-4 py-8 text-left"
      onPointerDown={swipeHandlers.onPointerDown}
      onPointerUp={swipeHandlers.onPointerUp}
      onPointerCancel={swipeHandlers.onPointerCancel}
      onPointerLeave={swipeHandlers.onPointerLeave}
      style={swipeHandlers.style}
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('skills.title')}
        </h1>
        <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>{t('week.baseDate')}</span>
          <button
            type="button"
            className="glass-chip rounded-lg p-1 text-[var(--color-ink)]"
            onClick={() => moveWeek(-1)}
            aria-label="Previous week"
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
            onClick={() => moveWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </label>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t('skills.sub', {
            band: settings.targetBand,
            hours: settings.dailyHoursByBand[settings.targetBand],
          })}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{weekRangeLabel}</p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('skills.barTitle')}</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{t('skills.barHint')}</p>
        <div className="glass-card mt-3 h-[320px] rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="skillsTargetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="color-mix(in oklab, white 78%, var(--color-accent))" />
                  <stop offset="100%" stopColor="color-mix(in oklab, var(--color-border) 72%, black)" />
                </linearGradient>
                <linearGradient id="skillsActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="color-mix(in oklab, var(--color-accent) 88%, white)" />
                  <stop offset="100%" stopColor="color-mix(in oklab, var(--color-accent-2) 76%, black)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--color-border) 72%, transparent)" opacity={0.38} />
              <XAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={{ stroke: 'color-mix(in oklab, var(--color-border) 72%, transparent)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  background: 'color-mix(in oklab, var(--color-surface) 90%, transparent)',
                  boxShadow: '0 8px 20px color-mix(in oklab, black 18%, transparent)',
                }}
                labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--color-ink)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-muted)', fontSize: 12 }} />
              <Bar
                dataKey="targetMinutes"
                fill="url(#skillsTargetGrad)"
                radius={[6, 6, 0, 0]}
                name={t('skills.barTarget', { band: settings.targetBand })}
                activeBar={false}
              />
              <Bar
                dataKey="actualMinutes"
                fill="url(#skillsActualGrad)"
                radius={[6, 6, 0, 0]}
                name={t('skills.barActual')}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('skills.radarBands')}</h2>
          <div className="glass-card mt-3 h-[300px] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarTarget} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="color-mix(in oklab, var(--color-border) 75%, transparent)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 40]} tick={{ fontSize: 9, fill: 'var(--color-muted)' }} />
                <Radar
                  name={t('skills.chartBandLow')}
                  dataKey="bandLowPct"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                />
                <Radar
                  name={t('skills.chartBandHigh')}
                  dataKey="bandHighPct"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.18}
                />
                <Legend wrapperStyle={{ color: 'var(--color-muted)', fontSize: 12 }} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    background: 'color-mix(in oklab, var(--color-surface) 90%, transparent)',
                    boxShadow: '0 8px 20px color-mix(in oklab, black 18%, transparent)',
                  }}
                  labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--color-ink)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('skills.radarMix')}</h2>
          <div className="glass-card mt-3 h-[300px] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarActualVsTarget} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="color-mix(in oklab, var(--color-border) 75%, transparent)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 45]} tick={{ fontSize: 9, fill: 'var(--color-muted)' }} />
                <Radar
                  name={t('skills.radarTarget')}
                  dataKey="targetMixPct"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.12}
                />
                <Radar
                  name={t('skills.radarWeek')}
                  dataKey="weekMixPct"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.2}
                />
                <Legend wrapperStyle={{ color: 'var(--color-muted)', fontSize: 12 }} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    background: 'color-mix(in oklab, var(--color-surface) 90%, transparent)',
                    boxShadow: '0 8px 20px color-mix(in oklab, black 18%, transparent)',
                  }}
                  labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--color-ink)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('skills.lineTitle')}</h2>
        <div className="glass-card mt-3 h-[340px] rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--color-border) 72%, transparent)" opacity={0.38} />
              <XAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickLine={false} axisLine={{ stroke: 'color-mix(in oklab, var(--color-border) 72%, transparent)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t('skills.axisMin'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--color-muted)',
                }}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  background: 'color-mix(in oklab, var(--color-surface) 90%, transparent)',
                  boxShadow: '0 8px 20px color-mix(in oklab, black 18%, transparent)',
                }}
                labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--color-ink)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-muted)', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="b65"
                name={t('skills.line.band', {
                  band: '6.5',
                  hours: settings.dailyHoursByBand['6.5'],
                })}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="b70"
                name={t('skills.line.band', {
                  band: '7.0',
                  hours: settings.dailyHoursByBand['7.0'],
                })}
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="b75"
                name={t('skills.line.band', {
                  band: '7.5',
                  hours: settings.dailyHoursByBand['7.5'],
                })}
                stroke="#0891b2"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="b80"
                name={t('skills.line.band', {
                  band: '8.0',
                  hours: settings.dailyHoursByBand['8.0'],
                })}
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
