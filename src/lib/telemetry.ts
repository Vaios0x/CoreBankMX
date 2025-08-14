import { env } from './env'

declare global {
  interface Window {
    posthog?: any
  }
}

let initialized = false

export async function initTelemetry() {
  if (!env.TELEMETRY_ENABLED || initialized) return
  if (!env.POSTHOG_KEY) return
  // Carga ligera desde CDN
  await new Promise<void>((resolve) => {
    const s = document.createElement('script')
    s.src = `${env.POSTHOG_HOST || 'https://app.posthog.com'}/static/array.js`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => resolve()
    document.head.appendChild(s)
  })
  try {
    if (window.posthog && typeof window.posthog.init === 'function') {
      window.posthog.init(env.POSTHOG_KEY, { api_host: env.POSTHOG_HOST || 'https://app.posthog.com', capture_pageview: true })
      initialized = true
    }
  } catch {}
}

export function track(event: string, properties?: Record<string, any>) {
  try {
    if (env.TELEMETRY_ENABLED && window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, properties)
    }
  } catch {}
}


