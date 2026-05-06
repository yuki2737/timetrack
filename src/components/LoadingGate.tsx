import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppState } from '../context/AppState'

export function LoadingGate({ children }: { children: ReactNode }) {
  const { authReady, useCloud, hydrated, t } = useAppState()
  const busy = !authReady || (useCloud && !hydrated)

  if (busy) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--color-surface)] text-[var(--color-muted)] dark:bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        <p className="text-sm">{t('loading')}</p>
      </div>
    )
  }
  return <>{children}</>
}
