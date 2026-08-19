import { useEffect, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Without this, an installed phone app can keep running whatever version
 * of the code was loaded when it was last opened — sometimes for weeks —
 * even after new fixes are deployed. That's exactly how the phone app and
 * the plain browser link can end up showing different stock numbers: one
 * of them is quietly running older logic. This makes an available update
 * impossible to miss, and updating is one tap.
 */
export function UpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a newer deployed version periodically, not just on load —
      // catches an update that ships while the app is sitting open.
      if (!registration) return
      setInterval(() => {
        registration.update()
      }, 30 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  if (!needRefresh || dismissed) return null

  return (
    <div className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-sm rounded-2xl bg-brand-black-900 p-4 text-white shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-pink-500">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">A newer version is ready</p>
          <p className="mt-0.5 text-xs text-white/70">
            Update now to make sure you're seeing the latest stock, prices, and fixes.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="focus-ring flex items-center gap-1.5 rounded-full bg-brand-pink-500 px-3 py-1.5 text-xs font-medium hover:bg-brand-pink-600"
            >
              <RefreshCw size={13} /> Update now
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="focus-ring rounded-full px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
