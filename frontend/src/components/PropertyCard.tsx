'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setShowScrollHint(el.scrollHeight > el.clientHeight + 20 && el.scrollTop < el.scrollHeight - el.clientHeight - 40)
    check()
    el.addEventListener('scroll', check)
    return () => el.removeEventListener('scroll', check)
  }, [propertyCard.data, cardEditing])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => { setPropertyCard(null); setCardEditing(false); }}>
      <div ref={scrollRef} className="rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[85vh] overflow-y-auto relative" data-testid="section-property-card" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,149,255,0.3) rgba(255,255,255,0.05)'}} onClick={e => e.stopPropagation()}>
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
            {(() => {
              try {
                const parsed = JSON.parse(cardEditData);
                const update = (mutate: (d: any) => void) => {
                  const copy = JSON.parse(cardEditData);
                  mutate(copy);
                  setCardEditData(JSON.stringify(copy, null, 2));
                };
                const inputStyle = {background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'} as const;
                const sectionLabel = (title: string) => (
                  <div className="text-xs font-semibold uppercase mb-1.5 pb-1" style={{color: '#6395ff', letterSpacing: '0.5px', borderBottom: '1px solid rgba(99,149,255,0.15)'}}>{title}</div>
                );
                const fieldLabel = (label: string) => (
                  <label className="text-xs font-medium block mb-1" style={{color: '#94a3b8'}}>{label}</label>
                );
                const textInput = (value: string, onChange: (v: string) => void, placeholder?: string) => (
                  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full text-base rounded px-2 py-1.5 outline-none" style={inputStyle} />
                );
                const numberInput = (value: number | undefined, onChange: (v: number) => void) => (
                  <input type="number" value={value ?? ''} onChange={e => onChange(Number(e.target.value))}
                    className="w-full text-base rounded px-2 py-1.5 outline-none" style={inputStyle} />
                );
                const toggleInput = (value: boolean, onChange: (v: boolean) => void, label: string) => (
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!value)}>
                    <div className="w-9 h-5 rounded-full relative transition-colors" style={{background: value ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{background: value ? '#22c55e' : '#64748b', left: value ? '18px' : '2px'}} />
                    </div>
                    <span className="text-xs" style={{color: '#94a3b8'}}>{label}</span>
                  </div>
                );
                const stringListEditor = (items: string[], onUpdate: (items: string[]) => void, placeholder?: string) => (
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input type="text" value={item} onChange={e => { const copy = [...items]; copy[i] = e.target.value; onUpdate(copy); }}
                          placeholder={placeholder} className="flex-1 text-base rounded px-2 py-1.5 outline-none" style={inputStyle} />
                        <button onClick={() => onUpdate(items.filter((_, j) => j !== i))}
                          className="px-2 py-1 rounded text-xs flex-shrink-0" style={{color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)'}}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => onUpdate([...items, ''])}
                      className="px-2 py-1 rounded text-xs" style={{color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)'}}>+ Add</button>
                  </div>
                );

                // Known top-level string/number fields
                const simpleFields: {key: string; label: string; type: 'text' | 'number'}[] = [
                  {key: 'full_name', label: 'Full Name', type: 'text'},
                  {key: 'location', label: 'Location', type: 'text'},
                  {key: 'property_type', label: 'Property Type', type: 'text'},
                  {key: 'bedrooms', label: 'Bedrooms', type: 'number'},
                  {key: 'bathrooms', label: 'Bathrooms', type: 'number'},
                  {key: 'guest_capacity', label: 'Guest Capacity', type: 'number'},
                ];
                // Track which keys we render with dedicated editors
                const handledKeys = new Set(['full_name', 'location', 'property_type', 'bedrooms', 'bathrooms', 'guest_capacity',
                  'emergency_contact', 'common_issues', 'quick_responses', 'property_details',
                  'building_intelligence', 'general_intelligence', 'best_for', 'auto_send']);

                return (<>
                  {/* Property Overview */}
                  {sectionLabel('Property Overview')}
                  {simpleFields.map(f => parsed[f.key] !== undefined ? (
                    <div key={f.key}>
                      {fieldLabel(f.label)}
                      {f.type === 'number'
                        ? numberInput(parsed[f.key], v => update(d => { d[f.key] = v; }))
                        : textInput(parsed[f.key] || '', v => update(d => { d[f.key] = v; }))}
                    </div>
                  ) : null)}

                  {/* Emergency Contact */}
                  {parsed.emergency_contact !== undefined && (<div>
                    {sectionLabel('Emergency Contact')}
                    {textInput(parsed.emergency_contact || '', v => update(d => { d.emergency_contact = v; }), 'Phone number')}
                  </div>)}

                  {/* Common Issues */}
                  {parsed.common_issues !== undefined && (<div>
                    {sectionLabel('Common Issues')}
                    {stringListEditor(
                      Array.isArray(parsed.common_issues) ? parsed.common_issues : [],
                      items => update(d => { d.common_issues = items; }),
                      'Describe an issue...'
                    )}
                  </div>)}

                  {/* Best-for Tags */}
                  {parsed.best_for !== undefined && (<div>
                    {sectionLabel('Best For')}
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {(Array.isArray(parsed.best_for) ? parsed.best_for : []).map((tag: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                          {tag}
                          <button onClick={() => update(d => { d.best_for = d.best_for.filter((_: string, j: number) => j !== i); })}
                            className="ml-0.5 hover:text-red-400" style={{color: '#6395ff'}}>✕</button>
                        </span>
                      ))}
                    </div>
                    <input type="text" placeholder="Type a tag and press Enter"
                      className="w-full text-base rounded px-2 py-1.5 outline-none" style={inputStyle}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          update(d => { d.best_for = [...(d.best_for || []), val]; });
                          (e.target as HTMLInputElement).value = '';
                        }
                        e.stopPropagation();
                      }} />
                  </div>)}

                  {/* Quick Responses */}
                  {parsed.quick_responses && (<div>
                    {sectionLabel('Quick Responses')}
                    <div className="space-y-2">
                      {Object.entries(parsed.quick_responses as Record<string, any>).map(([key, qr]: [string, any]) => (
                        <div key={key} className="p-2 rounded-lg space-y-1.5" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase" style={{color: '#94a3b8'}}>{key.replace(/_/g, ' ')}</span>
                            <button onClick={() => update(d => { delete d.quick_responses[key]; })}
                              className="px-1.5 py-0.5 rounded text-xs" style={{color: '#f87171', background: 'rgba(248,113,113,0.1)'}}>✕</button>
                          </div>
                          {typeof qr === 'object' && qr !== null ? (<>
                            {qr.response !== undefined && (
                              <textarea value={qr.response} onChange={e => update(d => { d.quick_responses[key].response = e.target.value; })}
                                onKeyDown={e => e.stopPropagation()} rows={2}
                                className="w-full text-base rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                            )}
                            {qr.trigger !== undefined && (<>
                              {fieldLabel('Trigger')}
                              {textInput(qr.trigger, v => update(d => { d.quick_responses[key].trigger = v; }))}
                            </>)}
                          </>) : (
                            <textarea value={typeof qr === 'string' ? qr : JSON.stringify(qr, null, 2)}
                              onChange={e => update(d => { d.quick_responses[key] = e.target.value; })}
                              onKeyDown={e => e.stopPropagation()} rows={2}
                              className="w-full text-base rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                          )}
                        </div>
                      ))}
                      <button onClick={() => {
                        const name = prompt('Quick response name (e.g. parking, pool):');
                        if (name) update(d => { d.quick_responses[name.toLowerCase().replace(/\s+/g, '_')] = {response: '', trigger: name}; });
                      }} className="px-2 py-1 rounded text-xs" style={{color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)'}}>+ Add Quick Response</button>
                    </div>
                  </div>)}

                  {/* Property Details */}
                  {parsed.property_details && (<div>
                    {sectionLabel('Property Details')}
                    <div className="space-y-2">
                      {typeof parsed.property_details === 'object' && Object.entries(parsed.property_details as Record<string, any>).map(([key, val]: [string, any]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between">
                            {fieldLabel(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}
                            <button onClick={() => update(d => { delete d.property_details[key]; })}
                              className="px-1 py-0.5 rounded text-xs" style={{color: '#f87171', background: 'rgba(248,113,113,0.1)'}}>✕</button>
                          </div>
                          {Array.isArray(val) ? (
                            stringListEditor(val, items => update(d => { d.property_details[key] = items; }))
                          ) : typeof val === 'boolean' ? (
                            toggleInput(val, v => update(d => { d.property_details[key] = v; }), key.replace(/_/g, ' '))
                          ) : typeof val === 'object' && val !== null ? (
                            <textarea value={JSON.stringify(val, null, 2)} onChange={e => {
                              try { update(d => { d.property_details[key] = JSON.parse(e.target.value); }); } catch {}
                            }} onKeyDown={e => e.stopPropagation()} rows={3}
                              className="w-full text-base font-mono rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                          ) : (
                            textInput(String(val ?? ''), v => update(d => {
                              const num = Number(v);
                              d.property_details[key] = !isNaN(num) && v.trim() !== '' ? num : v;
                            }))
                          )}
                        </div>
                      ))}
                      <button onClick={() => {
                        const name = prompt('Field name:');
                        if (name) update(d => { d.property_details[name.toLowerCase().replace(/\s+/g, '_')] = ''; });
                      }} className="px-2 py-1 rounded text-xs" style={{color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)'}}>+ Add Field</button>
                    </div>
                  </div>)}

                  {/* Building Intelligence */}
                  {parsed.building_intelligence && (<div>
                    {sectionLabel('Building Intelligence')}
                    <div className="space-y-2">
                      {parsed.building_intelligence.building_notes !== undefined && (<div>
                        {fieldLabel('Building Notes')}
                        <textarea value={parsed.building_intelligence.building_notes || ''} onChange={e => update(d => { d.building_intelligence.building_notes = e.target.value; })}
                          onKeyDown={e => e.stopPropagation()} rows={2}
                          className="w-full text-base rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                      </div>)}
                      {parsed.building_intelligence.area_info !== undefined && (<div>
                        {fieldLabel('Area Info')}
                        <textarea value={parsed.building_intelligence.area_info || ''} onChange={e => update(d => { d.building_intelligence.area_info = e.target.value; })}
                          onKeyDown={e => e.stopPropagation()} rows={2}
                          className="w-full text-base rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                      </div>)}
                      {parsed.building_intelligence.common_questions !== undefined && (<div>
                        {fieldLabel('Common Questions')}
                        {stringListEditor(
                          Array.isArray(parsed.building_intelligence.common_questions) ? parsed.building_intelligence.common_questions : [],
                          items => update(d => { d.building_intelligence.common_questions = items; }),
                          'A common question...'
                        )}
                      </div>)}
                      {parsed.building_intelligence.things_to_avoid !== undefined && (<div>
                        {fieldLabel('Things to Avoid')}
                        {stringListEditor(
                          Array.isArray(parsed.building_intelligence.things_to_avoid) ? parsed.building_intelligence.things_to_avoid : [],
                          items => update(d => { d.building_intelligence.things_to_avoid = items; }),
                          'Something to avoid...'
                        )}
                      </div>)}
                    </div>
                  </div>)}

                  {/* Operational Intelligence */}
                  {parsed.general_intelligence && (<div>
                    {sectionLabel('Operational Intelligence')}
                    <div className="space-y-2">
                      {parsed.general_intelligence.common_pain_points !== undefined && (<div>
                        {fieldLabel('Common Pain Points')}
                        {stringListEditor(
                          Array.isArray(parsed.general_intelligence.common_pain_points) ? parsed.general_intelligence.common_pain_points : [],
                          items => update(d => { d.general_intelligence.common_pain_points = items; }),
                          'A pain point...'
                        )}
                      </div>)}
                      {parsed.general_intelligence.successful_patterns !== undefined && (<div>
                        {fieldLabel('What Works Well')}
                        {stringListEditor(
                          Array.isArray(parsed.general_intelligence.successful_patterns) ? parsed.general_intelligence.successful_patterns : [],
                          items => update(d => { d.general_intelligence.successful_patterns = items; }),
                          'A successful pattern...'
                        )}
                      </div>)}
                      {parsed.general_intelligence.services_to_mention !== undefined && (<div>
                        {fieldLabel('Services to Mention')}
                        {stringListEditor(
                          Array.isArray(parsed.general_intelligence.services_to_mention) ? parsed.general_intelligence.services_to_mention : [],
                          items => update(d => { d.general_intelligence.services_to_mention = items; }),
                          'A service...'
                        )}
                      </div>)}
                    </div>
                  </div>)}

                  {/* Auto-send settings */}
                  {parsed.auto_send !== undefined && (<div>
                    {sectionLabel('Auto-Send Settings')}
                    {typeof parsed.auto_send === 'object' && parsed.auto_send !== null ? (<div className="space-y-2">
                      {parsed.auto_send.enabled !== undefined && toggleInput(parsed.auto_send.enabled, v => update(d => { d.auto_send.enabled = v; }), 'Auto-send enabled')}
                      {parsed.auto_send.threshold !== undefined && (<div>
                        {fieldLabel('Confidence Threshold')}
                        {numberInput(parsed.auto_send.threshold, v => update(d => { d.auto_send.threshold = v; }))}
                      </div>)}
                    </div>) : (
                      toggleInput(!!parsed.auto_send, v => update(d => { d.auto_send = v; }), 'Auto-send enabled')
                    )}
                  </div>)}

                  {/* Remaining unhandled top-level keys */}
                  {Object.entries(parsed).filter(([key]) => !handledKeys.has(key)).map(([key, value]) => (
                    <div key={key}>
                      {fieldLabel(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}
                      {typeof value === 'string' ? (
                        textInput(value, v => update(d => { d[key] = v; }))
                      ) : typeof value === 'number' ? (
                        numberInput(value, v => update(d => { d[key] = v; }))
                      ) : typeof value === 'boolean' ? (
                        toggleInput(value, v => update(d => { d[key] = v; }), key.replace(/_/g, ' '))
                      ) : (
                        <textarea value={JSON.stringify(value, null, 2)} onChange={e => {
                          try { update(d => { d[key] = JSON.parse(e.target.value); }); } catch {}
                        }} onKeyDown={e => e.stopPropagation()} rows={4}
                          className="w-full text-base font-mono rounded px-2 py-1.5 outline-none" style={{...inputStyle, resize: 'vertical' as const}} />
                      )}
                    </div>
                  ))}

                  {/* Raw JSON toggle */}
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer" style={{color: '#64748b'}}>Advanced: Raw JSON</summary>
                    <textarea
                      value={cardEditData}
                      onChange={e => setCardEditData(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full rounded-lg p-3 text-base font-mono mt-2"
                      style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: '200px', resize: 'vertical'}}
                      spellCheck={false}
                    />
                  </details>
                </>);
              } catch { return (
                <div>
                  <p className="text-xs mb-2" style={{color: '#f87171'}}>Invalid JSON — fix in raw editor below</p>
                  <textarea
                    value={cardEditData}
                    onChange={e => setCardEditData(e.target.value)}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full rounded-lg p-3 text-base font-mono"
                    style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(248,113,113,0.3)', minHeight: '300px', resize: 'vertical'}}
                    spellCheck={false}
                  />
                </div>
              ); }
            })()}
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
        {showScrollHint && (
          <div className="sticky bottom-0 left-0 right-0 text-center py-2 text-xs" style={{color: '#6395ff', background: 'linear-gradient(transparent, rgba(15,25,50,0.95) 40%)'}}>
            {'\u2193'} Scroll for more
          </div>
        )}
      </div>
    </div>
  )
}
