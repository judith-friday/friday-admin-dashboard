'use client'
import { useState, useEffect, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'

interface Rule {
  id: string; rule_name: string; source_type: string|null; category: string|null;
  action_type: string|null; tier: string|null; text_pattern: string|null;
  conversation_status: string|null; min_age_hours: number|null; urgency: string|null;
  action: string; enabled: boolean; created_at: string;
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  suppress: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  auto_dismiss: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  auto_complete: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
}

export default function AutoDismissRulesPanel({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ rule_name: '', source_type: '', category: '', action_type: '', tier: '', text_pattern: '', conversation_status: '', min_age_hours: '', urgency: '', action: 'auto_dismiss', enabled: false })

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try { const data = await apiFetch('/api/auto-dismiss-rules'); setRules(data.rules || []) }
    catch (e) { console.error('Failed to fetch rules', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (show) fetchRules() }, [show, fetchRules])

  const toggleEnabled = async (rule: Rule) => {
    await apiFetch(`/api/auto-dismiss-rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !rule.enabled }) })
    fetchRules()
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    await apiFetch(`/api/auto-dismiss-rules/${id}`, { method: 'DELETE' })
    fetchRules()
  }

  const handleSubmit = async () => {
    if (!form.rule_name || !form.action) return
    const body: any = { rule_name: form.rule_name, action: form.action, enabled: form.enabled }
    if (form.source_type) body.source_type = form.source_type
    if (form.category) body.category = form.category
    if (form.action_type) body.action_type = form.action_type
    if (form.tier) body.tier = form.tier
    if (form.text_pattern) body.text_pattern = form.text_pattern
    if (form.conversation_status) body.conversation_status = form.conversation_status
    if (form.min_age_hours) body.min_age_hours = parseInt(form.min_age_hours)
    if (form.urgency) body.urgency = form.urgency
    await apiFetch('/api/auto-dismiss-rules', { method: 'POST', body: JSON.stringify(body) })
    setForm({ rule_name: '', source_type: '', category: '', action_type: '', tier: '', text_pattern: '', conversation_status: '', min_age_hours: '', urgency: '', action: 'auto_dismiss', enabled: false })
    setShowForm(false)
    fetchRules()
  }

  const criteria = (r: Rule) => {
    const chips: string[] = []
    if (r.source_type) chips.push(`source: ${r.source_type}`)
    if (r.category) chips.push(`cat: ${r.category}`)
    if (r.action_type) chips.push(`type: ${r.action_type}`)
    if (r.tier) chips.push(`tier: ${r.tier}`)
    if (r.text_pattern) chips.push(`text: ${r.text_pattern}`)
    if (r.conversation_status) chips.push(`conv: ${r.conversation_status}`)
    if (r.min_age_hours) chips.push(`age>${r.min_age_hours}h`)
    if (r.urgency) chips.push(`urgency: ${r.urgency}`)
    return chips
  }

  if (!show) return null

  const inputStyle = { background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', width: '100%' }
  const labelStyle = { color: '#94a3b8', fontSize: '0.65rem', marginBottom: '2px', display: 'block' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '520px', maxWidth: '90vw', background: '#1e293b', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{'\uD83D\uDD07'} Auto-Dismiss Rules</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(!showForm)} className="px-2.5 py-1 text-xs rounded" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>
              {showForm ? 'Cancel' : '+ Add Rule'}
            </button>
            <button onClick={onClose}><XMarkIcon className="h-5 w-5" style={{ color: '#64748b' }} /></button>
          </div>
        </div>

        {showForm && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="col-span-2"><label style={labelStyle}>Rule Name *</label><input value={form.rule_name} onChange={e => setForm({...form, rule_name: e.target.value})} style={inputStyle} placeholder="My rule" /></div>
              <div><label style={labelStyle}>Source Type</label><select value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})} style={inputStyle}><option value="">-- Any --</option><option>auto</option><option>manual</option><option>ai_suggested</option></select></div>
              <div><label style={labelStyle}>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}><option value="">-- Any --</option><option>guest_communication</option><option>internal_admin</option><option>property_maintenance</option><option>financial</option></select></div>
              <div><label style={labelStyle}>Action Type</label><input value={form.action_type} onChange={e => setForm({...form, action_type: e.target.value})} style={inputStyle} placeholder="e.g. inquiry_followup" /></div>
              <div><label style={labelStyle}>Tier</label><select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} style={inputStyle}><option value="">-- Any --</option><option>active</option><option>suggested</option></select></div>
              <div><label style={labelStyle}>Text Pattern</label><input value={form.text_pattern} onChange={e => setForm({...form, text_pattern: e.target.value})} style={inputStyle} placeholder="% as wildcard" /></div>
              <div><label style={labelStyle}>Conv Status</label><select value={form.conversation_status} onChange={e => setForm({...form, conversation_status: e.target.value})} style={inputStyle}><option value="">-- Any --</option><option>active</option><option>done</option></select></div>
              <div><label style={labelStyle}>Min Age (hours)</label><input type="number" value={form.min_age_hours} onChange={e => setForm({...form, min_age_hours: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Urgency</label><select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} style={inputStyle}><option value="">-- Any --</option><option>low</option><option>medium</option><option>high</option><option>critical</option></select></div>
              <div><label style={labelStyle}>Rule Action *</label><select value={form.action} onChange={e => setForm({...form, action: e.target.value})} style={inputStyle}><option>auto_dismiss</option><option>suppress</option><option>auto_complete</option></select></div>
            </div>
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}><input type="checkbox" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} /> Enabled</label>
              <button onClick={handleSubmit} className="px-3 py-1 text-xs rounded font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Create Rule</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? <div className="p-8 text-center text-xs" style={{ color: '#475569' }}>Loading...</div> : rules.length === 0 ? <div className="p-8 text-center text-xs" style={{ color: '#475569' }}>No rules configured</div> : rules.map(rule => (
            <div key={rule.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{rule.rule_name}</span>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ ...ACTION_COLORS[rule.action] || ACTION_COLORS.auto_dismiss, fontSize: '0.6rem' }}>{rule.action}</span>
                  <button onClick={() => toggleEnabled(rule)} className="px-2 py-0.5 rounded text-xs" style={{ background: rule.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: rule.enabled ? '#4ade80' : '#64748b', border: `1px solid ${rule.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, fontSize: '0.65rem' }}>{rule.enabled ? 'ON' : 'OFF'}</button>
                  <button onClick={() => deleteRule(rule.id)} className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>{'\u2715'}</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {criteria(rule).map((c, i) => <span key={i} className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', fontSize: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>{c}</span>)}
                {criteria(rule).length === 0 && <span className="text-xs" style={{ color: '#475569', fontSize: '0.6rem' }}>No criteria (matches all)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
