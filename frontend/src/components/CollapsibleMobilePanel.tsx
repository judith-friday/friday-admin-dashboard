'use client'

import React, { useState, useEffect } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface CollapsibleMobilePanelProps {
  title: string
  icon: string
  subtitle?: string
  children: React.ReactNode
  defaultCollapsed?: boolean
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export default function CollapsibleMobilePanel({
  title,
  icon,
  subtitle,
  children,
  defaultCollapsed = false,
}: CollapsibleMobilePanelProps) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  if (!isMobile) return <>{children}</>

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        className="flex items-center justify-between px-4 cursor-pointer"
        style={{
          height: 44,
          background: 'rgba(15, 25, 50, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm" style={{ color: '#e2e8f0' }}>
            {title} {icon}
          </span>
          {subtitle && (
            <span
              className="text-xs truncate"
              style={{ color: '#64748b' }}
            >
              — {subtitle}
            </span>
          )}
        </div>
        <ChevronUpIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#64748b' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Collapse handle */}
      <div
        onClick={() => setIsCollapsed(true)}
        className="flex flex-col items-center justify-center cursor-pointer"
        style={{
          height: 28,
          background: 'rgba(15, 25, 50, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle visual */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.15)',
            marginBottom: 2,
          }}
        />
        <ChevronDownIcon className="h-3 w-3" style={{ color: '#64748b' }} />
      </div>
      {children}
    </div>
  )
}
