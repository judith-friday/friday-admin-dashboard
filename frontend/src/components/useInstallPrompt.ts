'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DAYS = 7

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  if (isNaN(ts)) return false
  const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    setBannerDismissed(isDismissed())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => setInstalled(true)
    window.addEventListener('appinstalled', installedHandler)

    // Check if already in standalone mode (includes iOS Safari)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) {
      setInstalled(true)
    }

    // Listen for display-mode changes
    const mql = window.matchMedia('(display-mode: standalone)')
    const mqlHandler = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true)
    }
    mql.addEventListener('change', mqlHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      mql.removeEventListener('change', mqlHandler)
    }
  }, [])

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable'
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      // prompt is consumed regardless of outcome
      setDeferredPrompt(null)
      if (outcome === 'accepted') {
        setInstalled(true)
        localStorage.removeItem(DISMISS_KEY)
      }
      return outcome
    } catch {
      // prompt() failed — don't consume the event reference
      return 'unavailable'
    }
  }, [deferredPrompt])

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }, [])

  const resetDismissal = useCallback(() => {
    setBannerDismissed(false)
    localStorage.removeItem(DISMISS_KEY)
  }, [])

  return {
    canInstall: !!deferredPrompt && !installed,
    installed,
    bannerDismissed,
    triggerInstall,
    dismissBanner,
    resetDismissal,
  }
}
