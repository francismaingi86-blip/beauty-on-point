import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ComingSoonPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function ComingSoonPage({ title, description, icon: Icon }: ComingSoonPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink-50 dark:bg-white/5">
          <Icon size={24} className="text-brand-pink-500" />
        </div>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          This module is scaffolded and ready for you to build out next —
          feature folder lives at{' '}
          <code className="rounded bg-brand-black-50 px-1.5 py-0.5 text-xs dark:bg-white/10">
            src/features/{title.toLowerCase().replace(/\s+/g, '-')}
          </code>
          .
        </p>
      </Card>
    </div>
  )
}
