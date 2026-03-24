import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Friday GMS - Guest Messaging System',
  description: 'Real-time guest communication dashboard for Friday Retreats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
