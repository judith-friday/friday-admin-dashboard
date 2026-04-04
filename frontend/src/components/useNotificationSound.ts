'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export default function useNotificationSound() {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Init mute state from localStorage
  useEffect(() => {
    const muted = localStorage.getItem('gms_muted')
    if (muted === 'true') {
      setIsMuted(true)
      isMutedRef.current = true
    }
  }, [])

  // Initialize AudioContext on first user interaction (iOS PWA requires user gesture)
  useEffect(() => {
    const initAudio = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext()
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume()
        }
      } catch {}
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio)
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
  }, [])

  // Toggle mute handler
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      localStorage.setItem('gms_muted', String(next))
      isMutedRef.current = next
      if (!next) {
        // Unmuting — create/resume AudioContext during this user gesture
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext()
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume()
          }
        } catch {}
      }
      return next
    })
  }, [])

  // Play notification chime using AudioContext (880Hz → 1100Hz sine wave, 0.3s)
  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  return { playChime, toggleMute, isMuted, isMutedRef }
}
