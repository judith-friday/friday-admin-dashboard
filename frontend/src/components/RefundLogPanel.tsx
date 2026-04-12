'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface Refund {
  id: string
  guest_name: string
  amount: number
  currency: string
  property_code: string | null
  reservation_id: string | null
  reason: string | null
  notes: string | null
  status: string
  initiated_by: string
  initiated_at: string
  updated_at: string | null
}

interface RefundLogPanelProps {
  show: boolean
  onClose: () => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'rgba(234,179,8,0.15)',   text: '#fbbf24', label: 'Pending' },
  approved:  { bg: 'rgba(99,149,255,0.15)',   text: '#6395ff', label: 'Approved' },
  processed: { bg: 'rgba(34,197,94,0.15)',    text: '#4ade80', label: 'Processed' },
  declined:  { bg: 'rgba(239,68,68,0.15)',    text: '#f87171', label: 'Declined' },
  voided:    { bg: 'rgba(100,116,139,0.15)',   text: '#94a3b8', label: 'Voided' },
}

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '\u20AC', USD: '$', MUR: 'Rs', GBP: '\u00A3' }

export default function RefundLogPanel({ show, onClose }: RefundLogPanelProps) {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // New refund form state
  const [formGuestName, setFormGuestName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCurrency, setFormCurrency] = useState('EUR')
  const [formPropertyCode, setFormPropertyCode] = useState('')
  const [formReservationId, setFormReservationId] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRefunds = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const data = await apiFetch(`/api/refunds?${params.toString()}`)
      setRefunds(data.refunds || [])
    } catch (err: any) {
      toast.error('Failed to load refunds')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => {
    if (show) fetchRefunds()
  }, [show, fetchRefunds])

  const openDetail = (r: Refund) => {
    setSelectedRefund(r)
    setEditStatus(r.status)
    setEditNotes(r.notes || '')
  }

  const saveDetail = async () => {
    if (!selectedRefund) return
    setSaving(true)
    try {
      await apiFetch(`/api/refunds/${selectedRefund.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      })
      toast.success('Refund updated')
      setSelectedRefund(null)
      fetchRefunds()
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const submitRefund = async () => {
    if (!formGuestName.trim() || !formAmount) {
      toast.error('Guest name and amount are required')
      return
    }
    setSubmitting(true)
    try {
      const displayName = typeof window !== 'undefined' ? localStorage.getItem('gms_display_name') || 'Dashboard' : 'Dashboard'
      await apiFetch('/api/refunds', {
        method: 'POST',
        body: JSON.stringify({
          guest_name: formGuestName.trim(),
          amount: parseFloat(formAmount),
          currency: formCurrency,
          property_code: formPropertyCode.trim() || null,
          reservation_id: formReservationId.trim() || null,
          reason: formReason.trim() || null,
          notes: formNotes.trim() || null,
          initiated_by: displayName,
        }),
      })
      toast.success('Refund logged')
      setShowForm(false)
      setFormGuestName(''); setFormAmount(''); setFormCurrency('EUR')
      setFormPropertyCode(''); setFormReservationId('')
      setFormReason(''); setFormNotes('')
      fetchRefunds()
    } catch (err: any) {
      toast.error('Failed to log refund: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!show) return null

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9',
    fontSize: '16px',
  }

  return (
    <div className="fixed inset-0 z-[70] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: '#0d1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{'\uD83D\uDCB0'} Refund Log</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{refunds.length} refund{refunds.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              + Log Refund
            </button>
            <button onClick={onClose} className="text-sm px-2 py-1 rounded" style={{ color: '#64748b' }}>
              {'\u2715'}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2 flex gap-1.5 flex-wrap items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'processed', label: 'Processed' },
            { value: 'declined', label: 'Declined' },
            { value: 'voided', label: 'Voided' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                background: statusFilter === f.value ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === f.value ? '#6395ff' : '#64748b',
                border: `1px solid ${statusFilter === f.value ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs px-2 py-1 rounded ml-2" style={{ ...inputStyle, fontSize: '12px' }} title="From date" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs px-2 py-1 rounded" style={{ ...inputStyle, fontSize: '12px' }} title="To date" />
        </div>

        {/* Log Refund Form */}
        {showForm && (
          <div className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Log New Refund</h3>
              <button onClick={() => setShowForm(false)} className="text-xs" style={{ color: '#64748b' }}>{'\u2715'}</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Guest Name *</label>
                <input type="text" value={formGuestName} onChange={e => setFormGuestName(e.target.value)} className="w-full rounded px-3 py-1.5 outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Amount *</label>
                <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full rounded px-3 py-1.5 outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Currency</label>
                <select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full rounded px-3 py-1.5 outline-none" style={inputStyle}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="MUR">MUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Property Code</label>
                <input type="text" value={formPropertyCode} onChange={e => setFormPropertyCode(e.target.value)} className="w-full rounded px-3 py-1.5 outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Reservation ID</label>
                <input type="text" value={formReservationId} onChange={e => setFormReservationId(e.target.value)} className="w-full rounded px-3 py-1.5 outline-none" style={inputStyle} />
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Reason</label>
                <textarea value={formReason} onChange={e => setFormReason(e.target.value)} className="w-full rounded px-3 py-2 outline-none resize-y" style={{ ...inputStyle, minHeight: '60px' }} rows={2} />
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full rounded px-3 py-2 outline-none resize-y" style={{ ...inputStyle, minHeight: '60px' }} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                disabled={submitting}
                onClick={submitRefund}
                className="text-xs px-4 py-1.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Detail view */}
        {selectedRefund ? (
          <div className="px-5 py-4 space-y-3">
            <button onClick={() => setSelectedRefund(null)} className="text-xs mb-2" style={{ color: '#6395ff' }}>{'\u2190'} Back to list</button>
            <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{selectedRefund.guest_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded" style={{
                  background: (STATUS_COLORS[selectedRefund.status] || STATUS_COLORS.pending).bg,
                  color: (STATUS_COLORS[selectedRefund.status] || STATUS_COLORS.pending).text,
                }}>
                  {(STATUS_COLORS[selectedRefund.status] || STATUS_COLORS.pending).label}
                </span>
              </div>
              <div className="text-sm space-y-1" style={{ color: '#cbd5e1' }}>
                <div><span style={{ color: '#94a3b8' }}>Amount:</span> {CURRENCY_SYMBOLS[selectedRefund.currency] || selectedRefund.currency}{selectedRefund.amount.toFixed(2)}</div>
                <div><span style={{ color: '#94a3b8' }}>Date:</span> {new Date(selectedRefund.initiated_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div><span style={{ color: '#94a3b8' }}>Initiated by:</span> {selectedRefund.initiated_by}</div>
                {selectedRefund.property_code && <div><span style={{ color: '#94a3b8' }}>Property:</span> {selectedRefund.property_code}</div>}
                {selectedRefund.reservation_id && <div><span style={{ color: '#94a3b8' }}>Reservation:</span> {selectedRefund.reservation_id}</div>}
                {selectedRefund.reason && <div><span style={{ color: '#94a3b8' }}>Reason:</span> {selectedRefund.reason}</div>}
              </div>

              <div className="pt-2 space-y-2">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="text-sm rounded px-3 py-1.5 outline-none" style={inputStyle}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="processed">Processed</option>
                    <option value="declined">Declined</option>
                    <option value="voided">Voided</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full text-sm rounded px-3 py-2 outline-none resize-y" style={{ ...inputStyle, minHeight: '80px' }} rows={3} />
                </div>
                <button
                  disabled={saving}
                  onClick={saveDetail}
                  className="text-xs px-4 py-1.5 rounded-lg"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Refund list table */
          <div className="px-5 py-3">
            {loading ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>No refunds{statusFilter ? ` with status "${STATUS_COLORS[statusFilter]?.label || statusFilter}"` : ''}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ color: '#cbd5e1' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="text-left text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Date</th>
                      <th className="text-left text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Guest</th>
                      <th className="text-left text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Property</th>
                      <th className="text-right text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Amount</th>
                      <th className="text-center text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Status</th>
                      <th className="text-left text-xs py-2 px-2 font-medium" style={{ color: '#64748b' }}>Initiated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map(r => {
                      const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending
                      return (
                        <tr
                          key={r.id}
                          className="cursor-pointer transition-all"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          onClick={() => openDetail(r)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="py-2 px-2 text-xs" style={{ color: '#94a3b8' }}>
                            {new Date(r.initiated_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2 px-2 text-sm" style={{ color: '#f1f5f9' }}>{r.guest_name}</td>
                          <td className="py-2 px-2 text-xs" style={{ color: '#94a3b8' }}>{r.property_code || '\u2014'}</td>
                          <td className="py-2 px-2 text-sm text-right" style={{ color: '#f1f5f9' }}>
                            {CURRENCY_SYMBOLS[r.currency] || r.currency}{r.amount.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-xs" style={{ color: '#94a3b8' }}>{r.initiated_by}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
