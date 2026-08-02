import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'
import { FloatingActionButton } from './FloatingActionButton'
import { NotificationCenter } from './NotificationCenter'
import { AIAssistantPanel } from './AIAssistantPanel'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--surface-muted)]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopNav />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FloatingActionButton />
      <NotificationCenter />
      <AIAssistantPanel />
    </div>
  )
}
