'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export default function useNotificationSound() {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  // Init mute state from localStorage
  useEffect(() => {
    const muted = localStorage.getItem('gms_muted')
    if (muted === 'true') {
      setIsMuted(true)
      isMutedRef.current = true
    }
  }, [])

  // Create Audio element and unlock on first user interaction (iOS PWA requires user gesture)
  useEffect(() => {
    const audio = new Audio('/sounds/notification.wav')
    audio.preload = 'auto'
    audio.volume = 0.5
    audioRef.current = audio

    const unlock = () => {
      if (!unlockedRef.current && audioRef.current) {
        // Play silent audio to unlock playback on iOS
        const a = audioRef.current
        const prevVol = a.volume
        a.volume = 0
        a.play().then(() => {
          a.pause()
          a.currentTime = 0
          a.volume = prevVol
          unlockedRef.current = true
        }).catch(() => {})
      }
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  // Toggle mute handler
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      localStorage.setItem('gms_muted', String(next))
      isMutedRef.current = next
      if (!next && audioRef.current && !unlockedRef.current) {
        // Unmuting during a user gesture — unlock audio
        const a = audioRef.current
        const prevVol = a.volume
        a.volume = 0
        a.play().then(() => {
          a.pause()
          a.currentTime = 0
          a.volume = prevVol
          unlockedRef.current = true
        }).catch(() => {})
      }
      return next
    })
  }, [])

  // Play notification chime using Audio element
  const playChime = useCallback(() => {
    if (audioRef.current && unlockedRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  return { playChime, toggleMute, isMuted, isMutedRef }
}
