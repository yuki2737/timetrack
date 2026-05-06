import { addDays, format, parseISO } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../context/AppState'
import { CATEGORY_PRESETS } from '../lib/labels'
import {
  ICON_REGISTRY,
  getIconEntry,
  getIconComponent,
  resolveIconShortcut,
} from '../lib/iconRegistry'
import { formatDuration } from '../lib/format'
import {
  dominantSkill,
  formatSessionAllocLine,
  hasMultiSkillSplit,
  normalizePercentSplit,
  skillSplitToAllocSec,
} from '../lib/skillSplit'

const MANUAL_MIN_PRESETS = [10, 25, 40, 60, 80, 120]

function parseManualMinutes(raw: string): number {
  if (raw.trim() === '') return 0
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(600, n))
}

export function LogPage() {
  const { addSession, sessions, removeSession, settings, t } = useAppState()
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [iconName, setIconName] = useState(ICON_REGISTRY[0]?.id ?? 'Mic')
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [manualMinText, setManualMinText] = useState('25')
  const [manualJustSaved, setManualJustSaved] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)

  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const dfLocale = settings.locale === 'ja' ? ja : enUS
  const dateTimeFmt = settings.locale === 'ja' ? 'M/d HH:mm' : 'M/d/yyyy h:mm a'

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!manualJustSaved) return
    const id = window.setTimeout(() => setManualJustSaved(false), 2800)
    return () => clearTimeout(id)
  }, [manualJustSaved])

  function finalizeManualMinutesField() {
    const n = parseManualMinutes(manualMinText)
    setManualMinText(n < 1 ? '25' : String(n))
  }

  function setManualMinutes(min: number) {
    const clamped = Math.max(1, Math.min(600, Math.round(min)))
    setManualMinText(String(clamped))
  }

  function tweakManualMinutes(delta: number) {
    const current = parseManualMinutes(manualMinText) || 25
    setManualMinutes(current + delta)
  }

  const resolvedShortcut = useMemo(
    () => resolveIconShortcut(iconName, settings.iconShortcuts),
    [iconName, settings.iconShortcuts],
  )
  const pcts = useMemo(
    () => normalizePercentSplit(resolvedShortcut.skillSplit, resolvedShortcut.skill),
    [resolvedShortcut],
  )
  const multiSplit = hasMultiSkillSplit(pcts)
  const presetSkill = multiSplit ? dominantSkill(pcts) : resolvedShortcut.skill
  const presets = CATEGORY_PRESETS[presetSkill]

  function onPickIcon(id: string) {
    setIconName(id)
    const r = resolveIconShortcut(id, settings.iconShortcuts)
    setCategory(r.category.trim())
  }

  function buildSessionPayload(
    titleBase: string,
    durationSec: number,
    source: 'timer' | 'manual',
  ) {
    const r = resolveIconShortcut(iconName, settings.iconShortcuts)
    const p = normalizePercentSplit(r.skillSplit, r.skill)
    if (hasMultiSkillSplit(p)) {
      return {
        title: titleBase,
        iconName,
        skill: dominantSkill(p),
        category: categoryFromShortcut(r),
        durationSec,
        skillAllocSec: skillSplitToAllocSec(durationSec, p),
        source,
      }
    }
    return {
      title: titleBase,
      iconName,
      skill: r.skill,
      category: categoryFromShortcut(r),
      durationSec,
      source,
    }
  }

  function categoryFromShortcut(shortcut: ReturnType<typeof resolveIconShortcut>) {
    const c = category.trim()
    if (c) return c
    const fromShortcut = shortcut.category.trim()
    if (fromShortcut) return fromShortcut
    return c || t('log.uncat')
  }

  function createdAtFromSelectedDate(): string {
    const base = selectedDate || format(new Date(), 'yyyy-MM-dd')
    return new Date(`${base}T12:00:00`).toISOString()
  }

  function moveSelectedDate(offset: number) {
    setSelectedDate((prev) => {
      const base = prev || format(new Date(), 'yyyy-MM-dd')
      return format(addDays(new Date(`${base}T00:00:00`), offset), 'yyyy-MM-dd')
    })
  }

  async function stopTimer() {
    setRunning(false)
    if (elapsed < 30) {
      setElapsed(0)
      return
    }
    try {
      await addSession(
        buildSessionPayload(
          title.trim() || t('log.defaultTimer'),
          elapsed,
          'timer',
        ),
        { createdAt: createdAtFromSelectedDate() },
      )
    } catch (err) {
      console.error(err)
    }
    setElapsed(0)
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault()
    if (manualSaving) return
    const min = parseManualMinutes(manualMinText)
    if (min < 1) {
      finalizeManualMinutesField()
      return
    }
    const sec = Math.round(min * 60)
    setManualSaving(true)
    try {
      await addSession(
        buildSessionPayload(
          title.trim() || t('log.defaultManual'),
          sec,
          'manual',
        ),
        { createdAt: createdAtFromSelectedDate() },
      )
      setManualMinText('0')
      setManualJustSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setManualSaving(false)
    }
  }

  const IconPreview = getIconComponent(iconName)
  const orderedIcons = ICON_REGISTRY

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 overflow-x-hidden px-4 py-8">
      <header className="text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('log.title')}
        </h1>
      </header>

      <section className="glass-card rounded-2xl p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x">
              <div className="grid w-max min-w-max grid-flow-col grid-rows-2 gap-2 pr-2">
                {orderedIcons.map((entry) => {
                const Icon = entry.Icon
                const active = iconName === entry.id
                return (
                  <button
                    key={entry.id}
                    type="button"
                    title={t(entry.labelKey)}
                    onClick={() => onPickIcon(entry.id)}
                    className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border transition ${
                      active
                        ? 'neon-soft border-[var(--color-accent)] ring-2 ring-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]'
                        : 'border-[var(--color-glass-border)]'
                    } ${entry.buttonClass}`}
                  >
                    <Icon className={`h-5 w-5 ${entry.iconClass ?? 'text-white'}`} />
                  </button>
                )
              })}
              </div>
            </div>
          </div>
          <label className="flex min-w-0 flex-col gap-1 text-left text-sm">
            <input
              className="glass-chip w-full min-w-0 rounded-xl px-3 py-2 text-[var(--color-ink)]"
              list={`cat-${presetSkill}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('log.categoryPh')}
            />
            <datalist id={`cat-${presetSkill}`}>
              {presets.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-left text-sm">
            <input
              className="glass-chip w-full min-w-0 rounded-xl px-3 py-2 text-[var(--color-ink)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('log.titlePh')}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-left text-sm">
            <span className="text-[var(--color-muted)]">{t('log.date')}</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                className="glass-chip rounded-lg p-1 text-[var(--color-ink)]"
                onClick={() => moveSelectedDate(-1)}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                className="glass-chip w-full min-w-0 rounded-lg px-2 py-1 text-[var(--color-ink)]"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                className="glass-chip rounded-lg p-1 text-[var(--color-ink)]"
                onClick={() => moveSelectedDate(1)}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-3">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('log.manual')}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {MANUAL_MIN_PRESETS.map((min) => {
            const active = parseManualMinutes(manualMinText) === min
            return (
              <button
                key={min}
                type="button"
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active
                    ? 'neon-soft bg-[var(--color-accent)] text-white'
                    : 'glass-chip text-[var(--color-ink)] hover:bg-[color-mix(in_oklab,var(--color-surface-2)_65%,transparent)]'
                }`}
                onClick={() => setManualMinutes(min)}
              >
                {min} {t('log.minutes')}
              </button>
            )
          })}
        </div>
        <form onSubmit={submitManual} className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
              onClick={() => tweakManualMinutes(-5)}
            >
              -5
            </button>
            <button
              type="button"
              className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
              onClick={() => tweakManualMinutes(-1)}
            >
              -1
            </button>
            <label className="mx-1 flex items-center gap-2 text-left text-sm">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="glass-chip w-24 rounded-xl px-3 py-2 text-center tabular-nums text-[var(--color-ink)]"
                value={manualMinText}
                onChange={(e) => {
                  const raw = e.target.value
                  if (/^\d*$/.test(raw)) setManualMinText(raw)
                }}
                onBlur={finalizeManualMinutesField}
              />
              <span className="text-[var(--color-muted)]">{t('log.minutes')}</span>
            </label>
            <button
              type="button"
              className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
              onClick={() => tweakManualMinutes(1)}
            >
              +1
            </button>
            <button
              type="button"
              className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
              onClick={() => tweakManualMinutes(5)}
            >
              +5
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-2">
            <button
              type="submit"
              disabled={manualSaving}
              className="neon-soft rounded-xl bg-[var(--color-accent-2)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {manualSaving ? t('log.saving') : t('log.save')}
            </button>
            {manualSaving ? (
              <span
                role="status"
                aria-live="polite"
                className="text-sm font-medium text-[var(--color-muted)]"
              >
                {t('log.saving')}
              </span>
            ) : manualJustSaved ? (
              <span
                role="status"
                aria-live="polite"
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                {t('log.manualSaved')}
              </span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('log.timer')}</h2>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-[var(--color-ink)]">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!running ? (
              <button
                type="button"
                className="neon-soft inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
                onClick={() => setRunning(true)}
              >
                <IconPreview className="h-4 w-4" />
                {t('log.start')}
              </button>
            ) : (
              <button
                type="button"
                className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
                onClick={() => setRunning(false)}
              >
                {t('log.pause')}
              </button>
            )}
            <button
              type="button"
              disabled={elapsed < 30}
              className="glass-chip rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition disabled:opacity-40"
              onClick={stopTimer}
            >
              {t('log.stopSave')}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">{t('log.timerHint')}</p>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('log.recent')}</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">{t('log.empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.slice(0, 30).map((s) => {
              const Icon = getIconComponent(s.iconName)
              const iconEntry = getIconEntry(s.iconName)
              const allocLine = formatSessionAllocLine(s, (sk) => t(`skill.${sk}`))
              return (
                <li
                  key={s.id}
                  className="glass-chip flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm"
                >
                  <div className="flex min-w-0 gap-2">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ${iconEntry?.buttonClass ?? 'bg-[var(--color-surface-2)]'}`}
                    >
                      <Icon className={`h-4 w-4 ${iconEntry?.iconClass ?? 'text-white'}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--color-ink)]">{s.title}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {allocLine ?? `${t(`skill.${s.skill}`)}`} ·{' '}
                        {format(parseISO(s.createdAt), dateTimeFmt, { locale: dfLocale })}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular-nums text-[var(--color-ink)]">
                      {formatDuration(s.durationSec)}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-[var(--color-muted)] underline-offset-2 hover:text-red-500 hover:underline"
                      onClick={() => void removeSession(s.id)}
                    >
                      {t('log.delete')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
