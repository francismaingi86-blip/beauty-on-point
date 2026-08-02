import { X, AlertTriangle, PackageX, CalendarClock } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

const SAMPLE_NOTIFICATIONS = [
  {
    icon: PackageX,
    title: 'Out of stock',
    body: 'Matte Lip Kit - Rose Nude is out of stock.',
    tone: 'danger' as const,
  },
  {
    icon: AlertTriangle,
    title: 'Low stock',
    body: '5 products are below their minimum stock level.',
    tone: 'gold' as const,
  },
  {
    icon: CalendarClock,
    title: 'Expiring soon',
    body: '3 products expire within 30 days.',
    tone: 'gold' as const,
  },
]

export function NotificationCenter() {
  const { notificationsOpen, toggleNotifications } = useUIStore()

  if (!notificationsOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="absolute inset-0 bg-black/20"
        onClick={toggleNotifications}
        aria-label="Close notifications"
      />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Notifications</h2>
          <button onClick={toggleNotifications} className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {SAMPLE_NOTIFICATIONS.map(({ icon: Icon, title, body, tone }) => (
            <div key={title} className="card-surface flex gap-3 p-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-brand-gold-100 text-brand-gold-700'
                )}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
