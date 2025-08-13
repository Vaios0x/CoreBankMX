import { useEffect } from 'react'
import { create } from 'zustand'

type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string }

type ToastStore = {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  remove: (id: number) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export function ToastViewport() {
  const { toasts, remove } = useToastStore()
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 4000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, remove])
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            t.type === 'error' ? 'border-red-700 bg-red-900/40 text-red-100' : t.type === 'success' ? 'border-green-700 bg-green-900/40 text-green-100' : 'border-ui bg-gray-900/80 text-gray-100'
          }`}
          role="status"
          tabIndex={0}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}


