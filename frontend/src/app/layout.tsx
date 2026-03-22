import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Friday Admin Dashboard',
  description: 'Team operations interface for Friday Retreats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}