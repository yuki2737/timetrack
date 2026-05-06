import type { ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  NotebookPen,
  CalendarRange,
  Goal,
  Settings,
  Timer,
} from 'lucide-react'
import { useAppState } from '../context/AppState'

export type RouteId =
  | 'log'
  | 'dash'
  | 'week'
  | 'skills'
  | 'goals'
  | 'vocabulary'
  | 'settings'

const NAV: { id: RouteId; labelKey: string; icon: typeof Timer }[] = [
  { id: 'log', labelKey: 'nav.log', icon: Timer },
  { id: 'dash', labelKey: 'nav.today', icon: BarChart3 },
  { id: 'week', labelKey: 'nav.week', icon: CalendarRange },
  { id: 'skills', labelKey: 'nav.skills', icon: BookOpen },
  { id: 'goals', labelKey: 'nav.goals', icon: Goal },
  { id: 'vocabulary', labelKey: 'nav.vocabulary', icon: NotebookPen },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
]

export function AppShell({
  route,
  onNavigate,
  children,
}: {
  route: RouteId
  onNavigate: (r: RouteId) => void
  children: ReactNode
}) {
  const { t } = useAppState()
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface)] text-[var(--color-ink)] dark:bg-transparent">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="glass-card fixed bottom-0 left-0 right-0 z-10 rounded-none border-x-0 border-b-0">
        <ul className="mx-auto flex max-w-3xl justify-between gap-1 px-2 py-2">
          {NAV.map(({ id, labelKey, icon: Icon }) => {
            const active = route === id
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition sm:text-xs ${
                    active
                      ? 'neon-soft bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] text-[var(--color-accent)] dark:bg-[color-mix(in_oklab,var(--color-accent)_28%,transparent)]'
                      : 'text-[var(--color-muted)] hover:bg-[color-mix(in_oklab,var(--color-surface-2)_55%,transparent)] hover:text-[var(--color-ink)] dark:hover:bg-[color-mix(in_oklch,white_8%,transparent)]'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {t(labelKey)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
