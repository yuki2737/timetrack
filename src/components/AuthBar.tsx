import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useAppState } from '../context/AppState'
import { LoginPanel } from './LoginPanel'

export function AuthBar() {
  const {
    user,
    authReady,
    hydrated,
    firebaseConfigured,
    useCloud,
    signOutUser,
    authError,
    clearAuthError,
    t,
  } = useAppState()

  if (!authReady) {
    return (
      <div className="glass-card flex items-center justify-center gap-2 rounded-none border-x-0 border-t-0 px-4 py-2 text-xs text-[var(--color-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('auth.checking')}
      </div>
    )
  }

  return (
    <div className="glass-card rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs sm:text-sm">
          {firebaseConfigured ? (
            useCloud ? (
              <>
                <Cloud className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate text-[var(--color-ink)]">
                  {t('auth.sync')}{' '}
                  <strong>{user?.displayName ?? user?.email ?? t('auth.signedIn')}</strong>
                </span>
                {!hydrated && (
                  <span className="flex items-center gap-1 text-[var(--color-muted)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('auth.syncing')}
                  </span>
                )}
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                <span className="text-[var(--color-muted)]">{t('auth.localOnly')}</span>
              </>
            )
          ) : (
            <>
              <CloudOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-[var(--color-muted)]">{t('auth.noFirebase')}</span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {authError && user && (
            <button
              type="button"
              className="max-w-[200px] truncate text-xs text-red-600 underline-offset-2 hover:underline dark:text-red-400"
              title={authError}
              onClick={clearAuthError}
            >
              {authError}
            </button>
          )}
          {firebaseConfigured && user && (
            <button
              type="button"
              className="glass-chip rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
              onClick={() => void signOutUser()}
            >
              {t('auth.signOut')}
            </button>
          )}
        </div>
      </div>
      {firebaseConfigured && !user && <LoginPanel />}
    </div>
  )
}
