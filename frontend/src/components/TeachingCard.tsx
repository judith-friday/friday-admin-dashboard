'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AcademicCapIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'

interface TeachingCardProps {
  instruction: string
  suggestedScope?: 'global' | 'property'
  propertyCode?: string
  onDismiss: () => void
  onConfirm?: (scope: string, propertyCode?: string) => void
  onTeachingCreated?: (teaching: { id: string; instruction: string; scope: string }) => void
}

export default function TeachingCard({
  instruction, suggestedScope = 'global', propertyCode, onDismiss, onConfirm, onTeachingCreated,
}: TeachingCardProps) {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [allProperties, setAllProperties] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch property list
  useEffect(() => {
    apiFetch('/api/conversations/filters')
      .then((data: any) => {
        const props: string[] = data.properties || []
        setAllProperties(props)
        // Pre-select based on suggested scope
        if (suggestedScope === 'global') {
          setSelectedProperties(props) // all = global
        } else if (propertyCode && props.includes(propertyCode)) {
          setSelectedProperties([propertyCode])
        } else if (propertyCode) {
          // Property not in list yet — add it
          setAllProperties(prev => [...new Set([...prev, propertyCode])])
          setSelectedProperties([propertyCode])
        } else {
          setSelectedProperties(props) // fallback to global
        }
      })
      .catch(() => {
        // Fallback: just show current property if available
        if (propertyCode) {
          setAllProperties([propertyCode])
          setSelectedProperties(suggestedScope === 'global' ? [propertyCode] : [propertyCode])
        }
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isAllSelected = allProperties.length > 0 && selectedProperties.length === allProperties.length
  const isGlobal = isAllSelected || allProperties.length === 0

  const toggleProperty = (code: string) => {
    setSelectedProperties(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    )
  }

  const toggleAll = () => {
    if (isAllSelected) {
      // Deselect all, keep current property if available
      setSelectedProperties(propertyCode ? [propertyCode] : [])
    } else {
      setSelectedProperties([...allProperties])
    }
  }

  const handleConfirm = async () => {
    if (selectedProperties.length === 0) return
    setSaving(true)
    const scope = isGlobal ? 'global' : 'property'
    try {
      const result = await apiFetch('/api/teachings', {
        method: 'POST',
        body: JSON.stringify({
          instruction,
          scope,
          property_codes: isGlobal ? null : selectedProperties,
          property_code: !isGlobal && selectedProperties.length === 1 ? selectedProperties[0] : null,
          taught_by: 'ask_judith',
        }),
      })
      setSaved(true)
      const teachingId = result?.id || result?.teaching?.id
      if (teachingId && onTeachingCreated) {
        onTeachingCreated({ id: teachingId, instruction, scope })
      }
      if (onConfirm) onConfirm(scope, !isGlobal && selectedProperties.length === 1 ? selectedProperties[0] : undefined)
      setTimeout(onDismiss, 2000)
    } catch (err: any) {
      console.error('Failed to save teaching:', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mx-3 my-1.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
        style={{background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80'}}>
        <AcademicCapIcon className="h-4 w-4 flex-shrink-0" />
        <span>Teaching saved! Friday will apply this going forward.</span>
      </div>
    )
  }

  const scopeLabel = isGlobal
    ? '🌐 All properties'
    : selectedProperties.length === 1
      ? `📍 ${selectedProperties[0]}`
      : `📍 ${selectedProperties.length} properties`

  return (
    <div className="mx-3 my-1.5 px-3 py-2.5 rounded-lg"
      style={{background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)'}}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <AcademicCapIcon className="h-4 w-4 flex-shrink-0" style={{color: '#c084fc'}} />
          <span className="text-xs font-medium" style={{color: '#c084fc'}}>Teachable moment</span>
        </div>
        <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/10" style={{color: '#64748b'}}>
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs mb-2" style={{color: '#e2e8f0'}}>{instruction}</p>
      <div className="flex items-center gap-2">
        {/* Multi-property scope selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-xs rounded px-2 py-1 outline-none flex items-center gap-1"
            style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}}>
            <span>{scopeLabel}</span>
            <ChevronDownIcon className="h-3 w-3" style={{color: '#64748b'}} />
          </button>
          {dropdownOpen && (
            <div className="absolute bottom-full mb-1 left-0 z-50 rounded-lg py-1 min-w-[180px] max-h-[200px] overflow-y-auto custom-scrollbar"
              style={{background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'}}>
              {/* Select all */}
              <label className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5 text-xs"
                style={{color: '#f1f5f9', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                <input type="checkbox" checked={isAllSelected} onChange={toggleAll}
                  className="rounded" style={{accentColor: '#6395ff'}} />
                <span className="font-medium">🌐 Select all (global)</span>
              </label>
              {/* Individual properties */}
              {allProperties.map(code => (
                <label key={code} className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/5 text-xs"
                  style={{color: '#e2e8f0'}}>
                  <input type="checkbox" checked={selectedProperties.includes(code)} onChange={() => toggleProperty(code)}
                    className="rounded" style={{accentColor: '#6395ff'}} />
                  <span>{code}</span>
                </label>
              ))}
              {allProperties.length === 0 && (
                <div className="px-2.5 py-1.5 text-xs" style={{color: '#64748b'}}>No properties found</div>
              )}
            </div>
          )}
        </div>
        <button onClick={handleConfirm} disabled={saving || selectedProperties.length === 0}
          className="px-2.5 py-1 text-xs rounded disabled:opacity-50"
          style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)'}}>
          {saving ? 'Saving...' : 'Learn this'}
        </button>
        <button onClick={onDismiss}
          className="px-2.5 py-1 text-xs rounded"
          style={{background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)'}}>
          Skip
        </button>
      </div>
    </div>
  )
}
