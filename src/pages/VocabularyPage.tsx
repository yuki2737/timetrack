import { NotebookPen } from 'lucide-react'
import { useAppState } from '../context/AppState'

export function VocabularyPage() {
  const { t } = useAppState()
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-left">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {t('vocabulary.title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('vocabulary.sub')}</p>
      </header>

      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 text-[var(--color-ink)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] text-[var(--color-accent)]">
            <NotebookPen className="h-5 w-5" />
          </span>
          <p className="text-sm">{t('vocabulary.empty')}</p>
        </div>
      </section>
    </div>
  )
}
