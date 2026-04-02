'use client'

import React from 'react'
import { toast } from 'react-hot-toast'
import { HomeIcon } from '@heroicons/react/24/outline'
import { ConversationDetail } from './types'

interface PropertyCardProps {
  propertyCard: { code: string; data: any; loading: boolean }
  setPropertyCard: (v: { code: string; data: any; loading: boolean } | null) => void
  cardEditing: boolean
  setCardEditing: (v: boolean) => void
  cardEditData: string
  setCardEditData: (v: string) => void
  cardEditHistory: any[]
  cardSaving: boolean
  savePropertyCard: () => void
  fetchPropertyCard: (code: string) => void
  detail: ConversationDetail | null
}

export default function PropertyCard({
  propertyCard, setPropertyCard, cardEditing, setCardEditing,
  cardEditData, setCardEditData, cardEditHistory, cardSaving,
  savePropertyCard, fetchPropertyCard, detail,
}: PropertyCardProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => { setPropertyCard(null); setCardEditing(false); }}>
      <div className="rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[85vh] overflow-y-auto" data-testid="section-property-card" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,149,255,0.3) rgba(255,255,255,0.05)'}} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>
            <HomeIcon className="h-5 w-5 inline mr-2" style={{color: '#6395ff'}} />
            {propertyCard.code}
          </h3>
          <div className="flex items-center gap-2">
            {propertyCard.data?.exists && !cardEditing && (
              <button onClick={() => { setCardEditing(true); setCardEditData(JSON.stringify(propertyCard.data.card, null, 2)); }} className="px-3 py-1 rounded-lg text-xs font-medium" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Edit</button>
            )}
            {cardEditing && (
              <>
                <button onClick={() => setCardEditing(false)} className="px-3 py-1 rounded-lg text-xs" style={{color: '#94a3b8'}}>Cancel</button>
                <button onClick={savePropertyCard} disabled={cardSaving} className="px-3 py-1 rounded-lg text-xs font-medium" style={{background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)'}}>{cardSaving ? 'Saving...' : 'Save'}</button>
              </>
            )}
            <button onClick={() => { setPropertyCard(null); setCardEditing(false); }} className="text-sm" style={{color: '#64748b'}}>✕</button>
          </div>
        </div>
        {propertyCard.loading ? (
          <p className="text-sm" style={{color: '#94a3b8'}}>Loading property card...</p>
        ) : cardEditing ? (
          <div className="space-y-3">
            {(() => { try { return Object.entries(JSON.parse(cardEditData) || {}).map(([key, value]) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1" style={{color: '#94a3b8', textTransform: 'capitalize'}}>{key.replace(/_/g, ' ')}</label>
                {typeof value === 'string' ? (
                  <input type="text" value={value as string} onChange={e => {
                    const parsed = JSON.parse(cardEditData);
                    parsed[key] = e.target.value;
                    setCardEditData(JSON.stringify(parsed, null, 2));
                  }} className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                ) : typeof value === 'object' && value !== null ? (
                  <textarea value={JSON.stringify(value, null, 2)} onChange={e => {
                    try {
                      const parsed = JSON.parse(cardEditData);
                      parsed[key] = JSON.parse(e.target.value);
                      setCardEditData(JSON.stringify(parsed, null, 2));
                    } catch {}
                  }} onKeyDown={e => e.stopPropagation()} className="w-full text-xs font-mono rounded px-2 py-1.5 outline-none" rows={4} style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', resize: 'vertical'}} />
                ) : (
                  <input type="text" value={String(value)} onChange={e => {
                    const parsed = JSON.parse(cardEditData);
                    const num = Number(e.target.value);
                    parsed[key] = !isNaN(num) && e.target.value.trim() !== '' ? num : e.target.value;
                    setCardEditData(JSON.stringify(parsed, null, 2));
                  }} className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                )}
              </div>
            )); } catch { return null; } })()}
            <details className="mt-2">
              <summary className="text-xs cursor-pointer" style={{color: '#64748b'}}>Advanced: Raw JSON</summary>
              <textarea
                value={cardEditData}
                onChange={e => setCardEditData(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full rounded-lg p-3 text-xs font-mono mt-2"
                style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: '200px', resize: 'vertical'}}
                spellCheck={false}
              />
            </details>
            <p className="text-xs" style={{color: '#64748b'}}>Edit property details above. Nested sections show as JSON for complex fields.</p>
          </div>
        ) : propertyCard.data?.exists && propertyCard.data?.card ? (
          <div className="space-y-4">
            {(() => {
              const c = propertyCard.data.card;
              const copyBtn = (text: string, label?: string) => (
                <button onClick={() => { navigator.clipboard.writeText(text); toast.success((label || 'Copied') + ' copied!') }}
                  className="ml-1.5 px-1.5 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                  Copy
                </button>
              );
              const section = (title: string, children: any) => (
                <div>
                  <div className="text-xs font-semibold uppercase mb-1.5 pb-1" style={{color: '#6395ff', letterSpacing: '0.5px', borderBottom: '1px solid rgba(99,149,255,0.15)'}}>{title}</div>
                  <div className="space-y-1">{children}</div>
                </div>
              );
              const row = (label: string, value: any) => value ? (
                <div className="flex items-start text-sm"><span className="flex-shrink-0" style={{color: '#64748b', minWidth: '100px'}}>{label}:</span><span style={{color: '#e2e8f0'}}>{String(value)}</span></div>
              ) : null;

              return (<>
                {section('Property Overview', <>
                  {c.full_name && <div className="text-sm font-medium mb-1" style={{color: '#f1f5f9'}}>{c.full_name}</div>}
                  {row('Location', c.location)}
                  {row('Type', c.property_type)}
                  {row('Bedrooms', c.bedrooms)}
                  {row('Bathrooms', c.bathrooms)}
                  {row('Capacity', c.guest_capacity ? `${c.guest_capacity} guests` : null)}
                </>)}

                {c.quick_responses && section('Access & WiFi', <>
                  {c.quick_responses.wifi && (
                    <div className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.04)'}}>
                      <div className="flex items-center text-sm gap-2">
                        <span style={{color: '#64748b', flexShrink: 0}}>WiFi:</span>
                        <span className="font-mono text-xs" style={{color: '#22c55e'}}>{c.quick_responses.wifi.response}</span>
                        {copyBtn(c.quick_responses.wifi.response, 'WiFi info')}
                      </div>
                    </div>
                  )}
                  {c.quick_responses.access && (
                    <div className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.04)'}}>
                      <div className="flex items-center text-sm gap-2">
                        <span style={{color: '#64748b', flexShrink: 0}}>Access:</span>
                        <span className="font-mono text-xs" style={{color: '#fbbf24'}}>{c.quick_responses.access.response}</span>
                        {copyBtn(c.quick_responses.access.response, 'Access codes')}
                      </div>
                    </div>
                  )}
                </>)}

                {c.property_details && section('Check-in / Check-out', <>
                  {row('Check-in', c.property_details.check_in_time)}
                  {row('Check-out', c.property_details.check_out_time)}
                  {c.quick_responses?.checkout && (
                    <div className="text-xs mt-1 p-2 rounded" style={{background: 'rgba(255,255,255,0.03)', color: '#94a3b8'}}>
                      {c.quick_responses.checkout.response}
                    </div>
                  )}
                </>)}

                {c.quick_responses && section('Quick Responses', <>
                  {Object.entries(c.quick_responses as Record<string, any>).filter(([k]) => !['wifi', 'access', 'checkout'].includes(k)).map(([key, qr]: [string, any]) => (
                    <div key={key} className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.03)'}}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase" style={{color: '#94a3b8'}}>{key.replace(/_/g, ' ')}</span>
                        {copyBtn(qr.response, key)}
                      </div>
                      <div className="text-xs mt-1" style={{color: '#e2e8f0'}}>{qr.response}</div>
                    </div>
                  ))}
                </>)}

                {c.common_issues && c.common_issues.length > 0 && section('Common Issues', <>
                  {(c.common_issues as string[]).map((issue: string, i: number) => (
                    <div key={i} className="text-sm flex items-start gap-2" style={{color: '#e2e8f0'}}>
                      <span style={{color: '#f59e0b'}}>{'•'}</span><span>{issue}</span>
                    </div>
                  ))}
                </>)}

                {c.building_intelligence && section('Building Intelligence', <>
                  {c.building_intelligence.building_notes && row('Notes', c.building_intelligence.building_notes)}
                  {c.building_intelligence.area_info && row('Area', c.building_intelligence.area_info)}
                  {c.building_intelligence.common_questions && c.building_intelligence.common_questions.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs" style={{color: '#64748b'}}>Common questions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(c.building_intelligence.common_questions as string[]).map((q: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{q}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.building_intelligence.things_to_avoid && c.building_intelligence.things_to_avoid.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs" style={{color: '#ef4444'}}>Things to avoid:</span>
                      {(c.building_intelligence.things_to_avoid as string[]).map((t: string, i: number) => (
                        <div key={i} className="text-xs mt-0.5" style={{color: '#f87171'}}>{'•'} {t}</div>
                      ))}
                    </div>
                  )}
                </>)}

                {c.general_intelligence && section('Operational Intelligence', <>
                  {c.general_intelligence.common_pain_points && c.general_intelligence.common_pain_points.length > 0 && (
                    <div>
                      <span className="text-xs" style={{color: '#64748b'}}>Common pain points:</span>
                      {(c.general_intelligence.common_pain_points as string[]).map((p: string, i: number) => (
                        <div key={i} className="text-xs mt-0.5" style={{color: '#e2e8f0'}}>{'•'} {p}</div>
                      ))}
                    </div>
                  )}
                  {c.general_intelligence.successful_patterns && c.general_intelligence.successful_patterns.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs" style={{color: '#64748b'}}>What works well:</span>
                      {(c.general_intelligence.successful_patterns as string[]).map((p: string, i: number) => (
                        <div key={i} className="text-xs mt-0.5" style={{color: '#22c55e'}}>{'✓'} {p}</div>
                      ))}
                    </div>
                  )}
                  {c.general_intelligence.services_to_mention && c.general_intelligence.services_to_mention.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs" style={{color: '#64748b'}}>Services to mention:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(c.general_intelligence.services_to_mention as string[]).map((s: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{background: 'rgba(34,197,94,0.1)', color: '#4ade80'}}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>)}

                {c.property_details && section('Property Details', <>
                  {row('Address', c.property_details.address)}
                  {c.property_details.parking && <div className="text-xs mt-1" style={{color: '#94a3b8'}}><span style={{color: '#64748b'}}>Parking: </span>{typeof c.property_details.parking === 'string' ? c.property_details.parking : JSON.stringify(c.property_details.parking)}</div>}
                  {c.property_details.amenities && (
                    <div className="mt-1">
                      <span className="text-xs" style={{color: '#64748b'}}>Amenities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(c.property_details.amenities) ? c.property_details.amenities : [c.property_details.amenities]).slice(0, 15).map((a: string, i: number) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(255,255,255,0.05)', color: '#94a3b8'}}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>)}

                {c.emergency_contact && section('Emergency', <>
                  <div className="flex items-center text-sm gap-2">
                    <span style={{color: '#64748b'}}>Contact:</span>
                    <span className="font-mono" style={{color: '#ef4444'}}>{c.emergency_contact}</span>
                    {copyBtn(c.emergency_contact, 'Emergency number')}
                  </div>
                </>)}
              </>);
            })()}
            {cardEditHistory.length > 0 && (
              <div className="mt-4 pt-3" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase mb-2" style={{color: '#64748b'}}>Edit History</div>
                {cardEditHistory.slice(0, 5).map((edit: any, i: number) => (
                  <div key={i} className="text-xs mb-1" style={{color: '#94a3b8'}}>
                    {edit.change_summary} — {edit.edited_by} · {new Date(edit.edited_at).toLocaleDateString('en-MU', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{color: '#64748b'}}>No knowledge card on file.</p>
            {detail && detail.conversation.property_name === propertyCard.code && (
              <div className="space-y-2 text-sm" style={{color: '#e2e8f0'}}>
                {detail.conversation.check_in_date && <div><span style={{color: '#64748b'}}>Check-in:</span> {detail.conversation.check_in_date}</div>}
                {detail.conversation.check_out_date && <div><span style={{color: '#64748b'}}>Check-out:</span> {detail.conversation.check_out_date}</div>}
                {detail.conversation.num_guests && <div><span style={{color: '#64748b'}}>Guests:</span> {detail.conversation.num_guests}</div>}
                {detail.conversation.channel && <div><span style={{color: '#64748b'}}>Channel:</span> {detail.conversation.channel}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
