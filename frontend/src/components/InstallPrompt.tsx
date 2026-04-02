'use client'

import { useInstallPrompt } from './useInstallPrompt'

export default function InstallPrompt() {
  const { canInstall, bannerDismissed, triggerInstall, dismissBanner } = useInstallPrompt()

  if (!canInstall || bannerDismissed) return null

  const handleInstall = async () => {
    const outcome = await triggerInstall()
    if (outcome === 'unavailable') {
      // prompt failed — banner stays visible, user can retry
    }
    // 'accepted' → installed flag hides banner via canInstall
    // 'dismissed' → user cancelled native prompt, banner stays so they can try again
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(12, 74, 110, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(14, 165, 233, 0.3)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '420px',
        width: 'calc(100% - 2rem)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <img src="/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: 8 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9' }}>
          Install Friday Admin
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Get a better experience with the app
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#0ea5e9',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Install
      </button>
      <button
        onClick={dismissBanner}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.25rem',
          lineHeight: 1,
        }}
      >
        &times;
      </button>
    </div>
  )
}
