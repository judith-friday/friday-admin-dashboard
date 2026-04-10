'use client'

import LoginScreen from '../../components/LoginScreen'

// This page exists so Next.js static export generates /reset-password/index.html.
// The LoginScreen component detects the ?token= query param and shows the reset form.
export default function ResetPasswordPage() {
  return <LoginScreen onLogin={(token) => {
    localStorage.setItem('gms_token', token)
    window.location.href = '/'
  }} />
}
