import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppState } from '../context/AppState'

export function LoginPanel() {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    authError,
    clearAuthError,
    t,
  } = useAppState()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearAuthError()
    setPending(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password)
      } else {
        await signUpWithEmail(email.trim(), password)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4">
      <div className="mx-auto max-w-md space-y-4 text-left">
        <p className="text-sm text-[var(--color-muted)]">{t('login.lead')}</p>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">{t('login.email')}</span>
            <input
              type="email"
              autoComplete="email"
              required
              className="glass-chip mt-1 w-full rounded-xl px-3 py-2 text-[var(--color-ink)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">{t('login.password')}</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className="glass-chip mt-1 w-full rounded-xl px-3 py-2 text-[var(--color-ink)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {authError && (
            <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="neon-soft inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-surface)] disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? t('login.signIn') : t('login.create')}
            </button>
            <button
              type="button"
              className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline"
              onClick={() => {
                clearAuthError()
                setMode((m) => (m === 'login' ? 'signup' : 'login'))
              }}
            >
              {mode === 'login' ? t('login.switchSignup') : t('login.switchLogin')}
            </button>
          </div>
        </form>
        <div className="relative flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-muted)]">{t('login.or')}</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <button
          type="button"
          disabled={pending}
          className="glass-chip w-full rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-border)]/40 disabled:opacity-50"
          onClick={() => {
            clearAuthError()
            void signInWithGoogle()
          }}
        >
          {t('login.google')}
        </button>
      </div>
    </div>
  )
}
