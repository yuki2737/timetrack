import { addWeeks, format } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppState } from '../context/AppState'
import { weekDailySeries } from '../lib/aggregate'
import type { Skill } from '../types'
import { BAND_OPTIONS } from '../lib/ieltsPlan'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'

const SKILLS: Skill[] = ['speaking', 'listening', 'writing', 'reading']

export function WeeklyPage() {
  const { sessions, settings, t } = useAppState()
  const [refDate, setRefDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const ref = new Date(`${refDate}T00:00:00`)
  const dfLocale = settings.locale === 'ja' ? ja : enUS
  const data = weekDailySeries(sessions, ref, settings.locale)
  const axisMax = Math.max(1, settings.dailyHoursByBand['8.0'] * 60 * 1.005)
  const bandLineColor: Record<(typeof BAND_OPTIONS)[number], string> = {
    '6.5': '#f59e0b',
    '7.0': '#7c3aed',
    '7.5': '#0891b2',
    '8.0': '#ef4444',
  }

  const refStr = format(
    ref,
    settings.locale === 'ja' ? 'yyyy/M/d' : 'M/d/yyyy',
    { locale: dfLocale },
  )
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

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-8 text-left"
      onPointerDown={swipeHandlers.onPointerDown}
      onPointerUp={swipeHandlers.onPointerUp}
      onPointerCancel={swipeHandlers.onPointerCancel}
      onPointerLeave={swipeHandlers.onPointerLeave}
      style={swipeHandlers.style}
    >
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('week.title')}
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
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('week.sub')}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {t('week.ref', { date: refStr })}
        </p>
      </header>

      <div className="glass-card h-[520px] w-full rounded-2xl p-3 sm:h-[560px] sm:p-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-medium tracking-wide text-[var(--color-muted)]">
            {t('week.title')}
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">{t('week.yUnit')}</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="weeklySpeakingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b08cff" />
                <stop offset="100%" stopColor="#7f5be4" />
              </linearGradient>
              <linearGradient id="weeklyListeningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#72f4ff" />
                <stop offset="100%" stopColor="#2aa8d7" />
              </linearGradient>
              <linearGradient id="weeklyWritingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffae8a" />
                <stop offset="100%" stopColor="#ff7a45" />
              </linearGradient>
              <linearGradient id="weeklyReadingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8bf7b6" />
                <stop offset="100%" stopColor="#44cc74" />
              </linearGradient>
              <filter id="weeklyBarShadow" x="-40%" y="-20%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="rgba(0,0,0,0.24)" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--color-border) 75%, transparent)" opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              tickLine={false}
              axisLine={{ stroke: 'color-mix(in oklab, var(--color-border) 75%, transparent)' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              tickLine={false}
              axisLine={false}
              unit={t('week.yUnit')}
              domain={[0, axisMax]}
              width={46}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid color-mix(in oklab, var(--color-border) 80%, transparent)',
                background: 'color-mix(in oklab, var(--color-surface) 90%, transparent)',
                boxShadow: '0 12px 28px color-mix(in oklab, black 26%, transparent)',
              }}
              labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--color-ink)' }}
              formatter={(v) => [`${Math.round(Number(v ?? 0))}${t('week.yUnit')}`, t('week.title')]}
              labelFormatter={(_, p) => (p[0]?.payload as { date?: string })?.date ?? ''}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: 'var(--color-muted)' }} />
            {BAND_OPTIONS.map((band) => (
              <ReferenceLine
                key={band}
                y={settings.dailyHoursByBand[band] * 60}
                stroke={bandLineColor[band]}
                strokeDasharray="4 4"
                ifOverflow="visible"
                label={{
                  value: t('dash.planBand', { band, hours: settings.dailyHoursByBand[band] }),
                  position: 'insideTopRight',
                  fill: bandLineColor[band],
                  fontSize: 10,
                }}
              />
            ))}
            {SKILLS.map((s) => (
              <Bar
                key={s}
                dataKey={s}
                name={t(`skill.${s}`)}
                stackId="a"
                activeBar={false}
                fill={
                  s === 'speaking'
                    ? 'url(#weeklySpeakingGrad)'
                    : s === 'listening'
                      ? 'url(#weeklyListeningGrad)'
                      : s === 'writing'
                        ? 'url(#weeklyWritingGrad)'
                        : 'url(#weeklyReadingGrad)'
                }
                radius={s === 'reading' ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                barSize={28}
                filter="url(#weeklyBarShadow)"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
