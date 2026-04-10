'use client'

import React from 'react'

function getInstallInstructions(): { browser: string; instructions: string } {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isMac = /Macintosh/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|Edg/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isFirefox = /Firefox/.test(ua)

  if (isSafari && isIOS) {
    return { browser: 'Safari (iOS)', instructions: "Tap the Share button (□↑) at the bottom of the screen, then tap 'Add to Home Screen'." }
  }
  if (isSafari && isMac) {
    return { browser: 'Safari (Mac)', instructions: "Safari doesn't support PWA install. Use Chrome or Edge instead for the best experience." }
  }
  if (isChrome && isAndroid) {
    return { browser: 'Chrome (Android)', instructions: "Tap the three-dot menu (⋮) in the top right, then tap 'Add to Home Screen' or 'Install app'." }
  }
  if (isChrome) {
    return { browser: 'Chrome', instructions: "Click the install icon (⊕) in the address bar, or go to Menu → 'Install Friday Admin Dashboard'." }
  }
  if (isEdge) {
    return { browser: 'Edge', instructions: "Click the install icon in the address bar, or go to Menu → Apps → 'Install this site as an app'." }
  }
  if (isFirefox) {
    return { browser: 'Firefox', instructions: "Firefox doesn't support PWA install. Use Chrome or Edge instead for the best experience." }
  }
  return { browser: 'your browser', instructions: "Use Chrome or Edge for the best install experience." }
}

export default function InstallInstructions({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null

  const { browser, instructions } = getInstallInstructions()

  return (
    <div
      data-install-prompt
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0c1a2e 0%, #0f2847 100%)',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9' }}>
              📲 Install Friday Admin
            </h2>
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
              Get the app experience — works offline, launches from your home screen
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '0.25rem',
              marginTop: '-0.25rem',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.15)',
            borderRadius: '10px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {browser}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6 }}>
            {instructions}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.625rem',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
