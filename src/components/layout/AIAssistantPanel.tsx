import { X, Sparkles, Send } from 'lucide-react'
import { useState } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { Button } from '@/components/ui/button'

export function AIAssistantPanel() {
  const { aiPanelOpen, toggleAIPanel } = useUIStore()
  const [message, setMessage] = useState('')

  if (!aiPanelOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="absolute inset-0 bg-black/20"
        onClick={toggleAIPanel}
        aria-label="Close AI assistant"
      />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles size={18} className="text-brand-gold-500" />
            AI Assistant
          </h2>
          <button onClick={toggleAIPanel} className="focus-ring rounded-full p-1.5 hover:bg-brand-pink-50 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="card-surface p-3 text-sm">
            Hi Francis 👋 — connect your business data and I'll surface restock
            suggestions, slow movers, and profit tips here. I only report on
            real sales and stock data — never a guess dressed up as a fact.
          </div>
        </div>

        <form
          className="flex items-center gap-2 border-t border-[var(--border-subtle)] p-3"
          onSubmit={(e) => {
            e.preventDefault()
            setMessage('')
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about sales, stock, profit…"
            className="focus-ring flex-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-2 text-sm"
          />
          <Button type="submit" size="icon" aria-label="Send">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}
