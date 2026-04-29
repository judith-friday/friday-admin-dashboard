'use client'

import { useEffect, useState } from 'react'
import { API_BASE } from './types'

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

    if (result !== 'granted') return false

    // Fetch VAPID public key from backend
    let vapidKey = ''
    try {
      const resp = await fetch(`${API_BASE}/api/push/vapid-key`)
      const data = await resp.json()
      vapidKey = data.publicKey
    } catch (err) {
      console.error('[Push] Failed to fetch VAPID key:', err)
      return true
    }

    if (!vapidKey) return true

    // Subscribe to push
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })
    setSubscription(sub)

    // Send subscription to backend
    const token = localStorage.getItem('gms_token')
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      body: JSON.stringify(sub),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    return true
  }

  return { permission, subscription, requestPermission }
}
