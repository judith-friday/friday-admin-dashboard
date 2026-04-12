'use client'

interface FilterChip {
  key: string
  label: string
  count?: number
}

interface FilterChipsProps {
  chips: FilterChip[]
  activeKey: string
  onChange: (key: string) => void
}

export default function FilterChips({ chips, activeKey, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {chips.map(chip => {
        const isActive = chip.key === activeKey
        return (
          <button
            key={chip.key}
            onClick={() => { if (!isActive) onChange(chip.key) }}
            className="px-2 py-0.5 text-xs rounded whitespace-nowrap shrink-0"
            style={{
              background: isActive ? 'rgba(99,149,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#6395ff' : '#64748b',
              border: `1px solid ${isActive ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              cursor: isActive ? 'default' : 'pointer',
            }}
          >
            {chip.label}{chip.count !== undefined ? ` (${chip.count})` : ''}
          </button>
        )
      })}
    </div>
  )
}
