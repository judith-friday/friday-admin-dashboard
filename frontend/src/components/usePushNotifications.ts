'use client'

import { useEffect, useState } from 'react'

// VAPID public key — replace with your actual key when backend push is set up
const VAPID_PUBLIC_KEY = ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== 'granted' || !VAPID_PUBLIC_KEY) return result === 'granted'

    // Subscribe to push if VAPID key is configured
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    setSubscription(sub)

    // TODO: Send subscription to backend via POST /api/push/subscribe
    // await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub), headers: { 'Content-Type': 'application/json' } })

    return true
  }

  return { permission, subscription, requestPermission }
}
