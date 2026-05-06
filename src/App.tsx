import { useState } from 'react'
import { AppStateProvider } from './context/AppState'
import { AuthBar } from './components/AuthBar'
import { LoadingGate } from './components/LoadingGate'
import { AppShell, type RouteId } from './components/AppShell'
import { LogPage } from './pages/LogPage'
import { DashboardPage } from './pages/DashboardPage'
import { WeeklyPage } from './pages/WeeklyPage'
import { SkillsComparePage } from './pages/SkillsComparePage'
import { GoalsPage } from './pages/GoalsPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { SettingsPage } from './pages/SettingsPage'

function Router({ route }: { route: RouteId }) {
  switch (route) {
    case 'log':
      return <LogPage />
    case 'dash':
      return <DashboardPage />
    case 'week':
      return <WeeklyPage />
    case 'skills':
      return <SkillsComparePage />
    case 'goals':
      return <GoalsPage />
    case 'vocabulary':
      return <VocabularyPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <LogPage />
  }
}

function AppInner() {
  const [route, setRoute] = useState<RouteId>('log')
  return (
    <AppShell route={route} onNavigate={setRoute}>
      <Router route={route} />
    </AppShell>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AuthBar />
      <LoadingGate>
        <AppInner />
      </LoadingGate>
    </AppStateProvider>
  )
}
