import { ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../context/AppState'
import {
  ICON_REGISTRY,
  getIconComponent,
  resolveIconShortcut,
} from '../lib/iconRegistry'
import { normalizePercentSplit } from '../lib/skillSplit'
import type { Skill } from '../types'

const SKILLS: Skill[] = ['speaking', 'listening', 'writing', 'reading']

function singleSkillSplit(skill: Skill): Record<Skill, number> {
  return {
    speaking: skill === 'speaking' ? 100 : 0,
    listening: skill === 'listening' ? 100 : 0,
    writing: skill === 'writing' ? 100 : 0,
    reading: skill === 'reading' ? 100 : 0,
  }
}

function parseSplitInput(raw: string): number {
  if (raw.trim() === '') return 0
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function ShortcutEditorCard({
  iconId,
  isOpen,
  onToggle,
}: {
  iconId: string
  isOpen: boolean
  onToggle: () => void
}) {
  const { t, settings, setIconShortcut, clearIconShortcut } = useAppState()
  const resolved = useMemo(
    () => resolveIconShortcut(iconId, settings.iconShortcuts),
    [iconId, settings.iconShortcuts],
  )
  const entry = ICON_REGISTRY.find((x) => x.id === iconId)
  if (!entry) return null
  const entryId = entry.id
  const Icon = getIconComponent(entryId)
  const isCustom = Boolean(settings.iconShortcuts[entryId])

  const fromResolved = useMemo(() => {
    const p = normalizePercentSplit(resolved.skillSplit, resolved.skill)
    return {
      skill: resolved.skill,
      category: resolved.category,
      split: Object.fromEntries(SKILLS.map((s) => [s, Math.round(p[s])])) as Record<
        Skill,
        number
      >,
    }
  }, [resolved.skill, resolved.category, resolved.skillSplit])

  const [localSkill, setLocalSkill] = useState<Skill>(fromResolved.skill)
  const [localCategory, setLocalCategory] = useState(fromResolved.category)
  const [localSplit, setLocalSplit] = useState(fromResolved.split)
  const [localSplitText, setLocalSplitText] = useState<Record<Skill, string>>({
    speaking: String(fromResolved.split.speaking),
    listening: String(fromResolved.split.listening),
    writing: String(fromResolved.split.writing),
    reading: String(fromResolved.split.reading),
  })

  useEffect(() => {
    setLocalSkill(fromResolved.skill)
    setLocalCategory(fromResolved.category)
    setLocalSplit(fromResolved.split)
    setLocalSplitText({
      speaking: String(fromResolved.split.speaking),
      listening: String(fromResolved.split.listening),
      writing: String(fromResolved.split.writing),
      reading: String(fromResolved.split.reading),
    })
  }, [fromResolved])

  const sum = SKILLS.reduce((a, s) => a + (localSplit[s] ?? 0), 0)

  function finalizeSkillInput(s: Skill) {
    const normalized = parseSplitInput(localSplitText[s] ?? '')
    setLocalSplit((prev) => ({ ...prev, [s]: normalized }))
    setLocalSplitText((prev) => ({ ...prev, [s]: String(normalized) }))
  }

  function save() {
    setIconShortcut(entryId, {
      skill: localSkill,
      category: localCategory,
      skillSplit: {
        speaking: localSplit.speaking,
        listening: localSplit.listening,
        writing: localSplit.writing,
        reading: localSplit.reading,
      },
    })
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${entry.buttonClass}`}
          >
            <Icon className={`h-6 w-6 ${entry.iconClass ?? 'text-white'}`} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[var(--color-ink)]">{t(entry.labelKey)}</div>
            <div className="truncate text-xs text-[var(--color-muted)]">
              {t(`skill.${resolved.skill}`)} · {resolved.category || t('log.uncat')}
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[var(--color-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-1 text-sm">
              <span className="text-[var(--color-muted)]">{t('settings.colSkill')}</span>
              <select
                className="glass-chip rounded-xl px-3 py-2 text-[var(--color-ink)]"
                value={localSkill}
                onChange={(e) => {
                  const skill = e.target.value as Skill
                  setLocalSkill(skill)
                  const next = singleSkillSplit(skill)
                  setLocalSplit(next)
                  setLocalSplitText({
                    speaking: String(next.speaking),
                    listening: String(next.listening),
                    writing: String(next.writing),
                    reading: String(next.reading),
                  })
                }}
              >
                {SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {t(`skill.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-sm">
              <span className="text-[var(--color-muted)]">{t('settings.colCat')}</span>
              <input
                className="glass-chip rounded-xl px-3 py-2 text-[var(--color-ink)]"
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-ink)]">{t('settings.splitTitle')}</p>
            <p className="text-xs text-[var(--color-muted)]">{t('settings.splitHint')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SKILLS.map((s) => (
                <label key={s} className="flex flex-col gap-1 text-xs">
                  <span className="text-[var(--color-muted)]">{t(`skill.${s}`)}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="glass-chip rounded-lg px-2 py-1.5 text-[var(--color-ink)]"
                    value={localSplitText[s] ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (/^\d*$/.test(raw)) {
                        setLocalSplitText((prev) => ({ ...prev, [s]: raw }))
                        setLocalSplit((prev) => ({ ...prev, [s]: parseSplitInput(raw) }))
                      }
                    }}
                    onBlur={() => finalizeSkillInput(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        finalizeSkillInput(s)
                      }
                    }}
                  />
                </label>
              ))}
            </div>
            <p
              className={`text-xs ${sum !== 100 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-muted)]'}`}
            >
              {t('settings.splitSum', { n: sum })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="neon-soft rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-medium text-white"
              onClick={save}
            >
              {t('settings.save')}
            </button>
            <button
              type="button"
              className="glass-chip rounded-xl px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-40"
              onClick={() => clearIconShortcut(entryId)}
              disabled={!isCustom}
            >
              {t('settings.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { t, settings, setLocale, setTheme } = useAppState()
  const [openId, setOpenId] = useState<string | null>(ICON_REGISTRY[0]?.id ?? null)

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 text-left">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('settings.sub')}</p>
      </header>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('settings.lang')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              settings.locale === 'en'
                ? 'neon-soft bg-[var(--color-ink)] text-[var(--color-surface)]'
                : 'glass-chip text-[var(--color-ink)]'
            }`}
            onClick={() => setLocale('en')}
          >
            {t('settings.langEn')}
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              settings.locale === 'ja'
                ? 'neon-soft bg-[var(--color-ink)] text-[var(--color-surface)]'
                : 'glass-chip text-[var(--color-ink)]'
            }`}
            onClick={() => setLocale('ja')}
          >
            {t('settings.langJa')}
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">{t('settings.theme')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              settings.theme === 'light'
                ? 'neon-soft bg-[var(--color-ink)] text-[var(--color-surface)]'
                : 'glass-chip text-[var(--color-ink)]'
            }`}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {t('settings.themeLight')}
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              settings.theme === 'dark'
                ? 'neon-soft bg-[var(--color-ink)] text-[var(--color-surface)]'
                : 'glass-chip text-[var(--color-ink)]'
            }`}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {t('settings.themeDark')}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-muted)]">
          {t('settings.shortcuts')}
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {t('settings.shortcutsHint')}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{t('settings.tapToEdit')}</p>
        <div className="mt-4 space-y-3">
          {ICON_REGISTRY.map((entry) => (
            <ShortcutEditorCard
              key={entry.id}
              iconId={entry.id}
              isOpen={openId === entry.id}
              onToggle={() => setOpenId((prev) => (prev === entry.id ? null : entry.id))}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
