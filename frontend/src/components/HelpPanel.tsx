'use client'

import React, { useState } from 'react'

export default function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  // ExpandableSection sub-component for training content
  const ExpandableSection = ({title, children}: {title: string, children: React.ReactNode}) => {
    const [open, setOpen] = useState(false)
    return (
      <section>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide mb-1" style={{color: '#6395ff'}}>
          <span>{title}</span>
          <span style={{color: '#64748b'}}>{open ? '▼' : '▶'}</span>
        </button>
        {open && <div className="mt-2 text-xs leading-relaxed" style={{color: '#94a3b8'}}>{children}</div>}
      </section>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="modal-help-panel" onClick={onClose}>
      <div className="absolute inset-0" style={{background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)'}} />
      <div className="relative w-full md:w-[340px] h-full overflow-y-auto slide-in-right custom-scrollbar" 
           style={{background: 'rgba(15,25,50,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)'}}
           onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-6 pt-5 pb-4 flex items-center justify-between" style={{background: 'rgba(15,25,50,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div>
            <div className="text-base font-bold" style={{color: '#f1f5f9'}}>Friday Admin</div>
            <div className="text-xs" style={{color: '#64748b'}}>Quick guide</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" data-testid="btn-close-help" style={{background: 'rgba(255,255,255,0.06)', color: '#64748b'}}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-6">
          <ExpandableSection title="Getting started">
            <div className="space-y-3">
              <p>Welcome to Friday Admin! This is where you review and send guest messages.</p>
              <div className="space-y-2">
                <p className="font-semibold" style={{color: '#e2e8f0'}}>Your daily workflow:</p>
                <div className="space-y-1.5">
                  {['Check the inbox — unread messages have a blue dot',
                    'Click a conversation to read the guest\'s message and Judith\'s draft',
                    'Review the draft — check the confidence score for how much attention it needs',
                    'Adjust if needed — type instructions like \"add the WiFi password\" or \"be warmer\"',
                    'Approve & Send — a confirmation pops up with a 5-second undo window',
                    'Check \u23F3 Action Items — things we promised guests but haven\'t done yet',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#94a3b8'}}>
                      <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-semibold" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{i+1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <p className="font-semibold" style={{color: '#e2e8f0'}}>Key things to know:</p>
                <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
                  <div>\u2022 Everything you do is tracked (who approved, who rejected, who wrote notes)</div>
                  <div>\u2022 Staff notes are shared with Judith — she reads them when drafting future replies</div>
                  <div>\u2022 Don&apos;t approve bad drafts to save time — Judith learns from your approvals</div>
                  <div>\u2022 When in doubt, reject and say why — this helps Judith improve</div>
                  <div>\u2022 Translations happen automatically — you review in English, Judith sends in the guest&apos;s language</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>How it works</h4>
            <p className="text-xs leading-relaxed mb-2" style={{color: '#94a3b8'}}>When a guest sends a message, Judith automatically:</p>
            <div className="space-y-1.5">
              {['Detects the language and translates if needed', 'Summarizes the conversation', 'Drafts a reply with a confidence score', 'Queues it for your review'].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#94a3b8'}}>
                  <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-semibold" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{i+1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Confidence scores</h4>
            <div className="space-y-2">
              {[
                {range: '80-98%', color: '#4ade80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.1)', badge: 'rgba(34,197,94,0.15)', label: 'Green', desc: 'Routine question with good context. Quick review and approve.'},
                {range: '60-79%', color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.1)', badge: 'rgba(245,158,11,0.15)', label: 'Amber', desc: 'Check carefully, might need revision.'},
                {range: 'Below 60%', color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.1)', badge: 'rgba(239,68,68,0.15)', label: 'Red', desc: 'Complex situation, complaint, or missing context. Review closely.'},
              ].map(s => (
                <div key={s.range} className="rounded-lg p-2.5" style={{background: s.bg, border: `1px solid ${s.border}`}}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{background: s.badge, color: s.color}}>{s.range}</span>
                    <span className="text-xs font-semibold" style={{color: s.color}}>{s.label}</span>
                  </div>
                  <div className="text-xs" style={{color: '#94a3b8'}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Reviewing drafts</h4>
            <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
              {[
                ['Read the draft', ' in the center panel'],
                ['Edit directly', ' — click Edit to make changes'],
                ['Ask Judith to revise', ' — type an instruction below the draft'],
                ['Approve & Send', ' — sends via the guest\'s booking platform'],
                ['Reject', ' — discards with a reason (helps Judith learn)'],
              ].map(([bold, rest], i) => (
                <div key={i}><span style={{color: '#e2e8f0', fontWeight: 500}}>{bold}</span>{rest}</div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Tips for great revisions</h4>
            <div className="space-y-1.5">
              {[
                ['"Add the WiFi password"', '"Add more info"'],
                ['"Guest seems upset, be extra empathetic"', '"Make it better"'],
                ['"Mention the beach is 2 min walk"', '"Talk about the location"'],
              ].map(([good, bad], i) => (
                <div key={i} className="rounded-md p-2 text-xs" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <span style={{color: '#4ade80'}}>Good:</span> <span style={{color: '#e2e8f0'}}>{good}</span><br/>
                  <span style={{color: '#f87171'}}>Vague:</span> <span style={{color: '#64748b'}}>{bad}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Pending actions</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              When we promise something to a guest, it appears in the <span style={{color: '#fbbf24'}}>Actions</span> tab. Age badges show urgency:
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>under 2h</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>2-6h</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>6h+ overdue</span>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Keyboard shortcuts</h4>
            <div className="space-y-1.5">
              {[
                ['Navigate conversations', ['↑', '↓']],
                ['Open conversation', ['Enter']],
                ['Focus "Ask Judith"', ['/']],
                ['Approve & send', ['⌘', '↵']],
                ['Deselect', ['Esc']],
              ].map(([label, keys]) => (
                <div key={label as string} className="flex items-center justify-between text-xs">
                  <span style={{color: '#94a3b8'}}>{label as string}</span>
                  <div className="flex gap-1">
                    {(keys as string[]).map(k => (
                      <span key={k} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{background: 'rgba(255,255,255,0.08)', color: '#e2e8f0'}}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Staff notes</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              The notes field in the right panel is shared with Judith. Anything you write becomes context for future drafts.
            </p>
            <div className="space-y-1 mt-2">
              {['"VIP guest, husband proposed here last year"', '"Guest is elderly, needs ground floor access"', '"Repeat guest, prefers early check-in"'].map(ex => (
                <div key={ex} className="rounded px-2 py-1 text-xs italic" style={{background: 'rgba(255,255,255,0.03)', color: '#e2e8f0'}}>{ex}</div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Auto-send</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              Toggle per conversation in the right panel. When enabled, replies with 85%+ confidence for routine questions send automatically.
            </p>
            <div className="mt-2 rounded-md px-2.5 py-1.5 text-xs" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24'}}>
              Start with this OFF until you trust Judith&apos;s drafts
            </div>
          </section>

          
          {/* Team Training Sections */}
          <ExpandableSection title="How confidence scores work">
            <div className="space-y-2">
              <p>Judith calculates confidence using a weighted formula:</p>
              <div className="pl-2 space-y-1" style={{color: '#64748b'}}>
                <div>• Base score: 75%</div>
                <div>• Message type: +20% routine, -15% complaints</div>
                <div>• Reservation context: +15% good, -10% missing</div>
                <div>• Property knowledge: +10% relevant, -10% unknown</div>
                <div>• Language: -5% non-English</div>
                <div>• Complexity: -5% per extra question</div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="rounded p-2" style={{background: 'rgba(34,197,94,0.08)'}}>
                  <div className="text-xs font-semibold" style={{color: '#4ade80'}}>Example: Routine WiFi question</div>
                  <div className="text-xs mt-1" style={{color: '#64748b'}}>75% + 20% (routine) + 15% (good context) + 10% (property info) = 95%</div>
                </div>
                <div className="rounded p-2" style={{background: 'rgba(239,68,68,0.08)'}}>
                  <div className="text-xs font-semibold" style={{color: '#f87171'}}>Example: Complex complaint</div>
                  <div className="text-xs mt-1" style={{color: '#64748b'}}>75% - 15% (complaint) - 10% (missing context) - 10% (complex) = 40%</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Teaching Judith">
            <div className="space-y-3">
              <p>When you submit a revision, you&apos;ll see three options:</p>
              <div className="space-y-1.5">
                <div><span style={{color: '#4ade80', fontWeight: 500}}>Revise</span> — adjusts draft, doesn&apos;t learn permanently. 3+ similar instructions triggers auto-learn.</div>
                <div><span style={{color: '#fbbf24', fontWeight: 500}}>Revise &amp; teach \uD83E\uDDE0</span> — adjusts AND saves as a permanent rule. Choose: this property or all properties.</div>
                <div><span style={{color: '#6395ff', fontWeight: 500}}>Revise (one-time)</span> — adjusts but does NOT learn. For guest-specific things.</div>
              </div>
              <p className="mt-2">View what Judith has learned: click \uD83E\uDDE0 Teachings. You can revoke any teaching if it was a mistake.</p>
              <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)'}}>
                <div className="text-xs font-semibold mb-1" style={{color: '#4ade80'}}>Good teaching examples</div>
                <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
                  <div>\u2705 &quot;Never mention the pool is shared&quot; (property-specific)</div>
                  <div>\u2705 &quot;Always include parking for GBH properties&quot; (global)</div>
                </div>
              </div>
              <div className="rounded-md p-2.5" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)'}}>
                <div className="text-xs font-semibold mb-1" style={{color: '#f87171'}}>Don&apos;t teach</div>
                <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
                  <div>\u274C Guest-specific things like &quot;mention their anniversary&quot; — use one-time instead</div>
                  <div>\u274C Approving bad drafts (she thinks it&apos;s good)</div>
                  <div>\u274C Contradictory instructions</div>
                  <div>\u274C Editing draft text directly without revision input (no feedback for Judith)</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="What Judith can and can't do">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{color: '#4ade80'}}>{'✅'} What Judith CAN do</div>
                <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
                  <div>• Draft personalized replies in guest's language</div>
                  <div>• Detect complaint tone and urgency levels</div>
                  <div>• Use property-specific knowledge (WiFi, amenities, directions)</div>
                  <div>• Translate messages in 50+ languages</div>
                  <div>• Track promises and create action items</div>
                  <div>• Suggest empathetic responses for upset guests</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{color: '#f87171'}}>{'❌'} What Judith CAN'T do (yet)</div>
                <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
                  <div>• Send messages without human approval</div>
                  <div>• Access Breezeway for maintenance requests</div>
                  <div>• Modify reservations or booking details</div>
                  <div>• Handle payments, refunds, or billing issues</div>
                  <div>• Make decisions about property policies</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Escalation triggers">
            <div className="space-y-2">
              <p>Always escalate these to <span style={{color: '#6395ff', fontWeight: 500}}>@Ishant</span> immediately:</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Refund requests over $100</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Safety, security, or emergency situations</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Legal threats or liability concerns</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Guest injuries or medical incidents</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Property damage reports</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Discrimination or harassment allegations</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Issues involving minors or child safety</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Payment processing problems</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Booking modifications affecting revenue</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Noise complaints involving police</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Threats of negative reviews over policy disputes</span>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="The 'exception' pattern">
            <div className="space-y-2">
              <p>When granting special requests, use this proven formula:</p>
              <div className="space-y-2 mt-3">
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>1. Grant the favor</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"I've arranged early check-in at 2 PM for you."</div>
                </div>
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>2. Frame as exception</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"This is a special accommodation as our standard check-in is 4 PM."</div>
                </div>
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>3. Ask for 5-star review</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"We'd be grateful if you could mention this flexibility in your review!"</div>
                </div>
              </div>
              <div className="mt-3 text-xs" style={{color: '#64748b'}}>
                This positions favors as value-adds while encouraging positive feedback.
              </div>
            </div>
          </ExpandableSection>


          <ExpandableSection title="Property knowledge">
            <div className="space-y-2">
              <p>Click any property code in the sidebar to view its knowledge card — WiFi, check-in instructions, parking, amenities, FAQs.</p>
              <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
                <div>\u2022 If info is wrong: click Edit, fix it, save. Judith uses updated info immediately.</div>
                <div>\u2022 If no card exists: you can create one. More info = better drafts for that property.</div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Channels and sending">
            <div className="space-y-2">
              <p>When you approve, the confirmation popup shows a channel selector:</p>
              <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
                <div>\u2022 <span style={{fontWeight: 500, color: '#e2e8f0'}}>Booking platform</span> (Airbnb/Booking.com messaging) — default for OTA bookings</div>
                <div>\u2022 <span style={{fontWeight: 500, color: '#e2e8f0'}}>WhatsApp</span> — common for direct bookings</div>
                <div>\u2022 <span style={{fontWeight: 500, color: '#e2e8f0'}}>Email</span> — for formal or fallback messages</div>
              </div>
              <p className="mt-1">Default is based on how the guest last messaged us. You can change it before sending.</p>
            </div>
          </ExpandableSection>

          <div className="rounded-lg p-4 text-center" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)'}}>
            <div className="text-xs" style={{color: '#94a3b8'}}>Need help? Tag <span style={{color: '#6395ff', fontWeight: 500}}>@Ishant</span> in Slack</div>
            <div className="text-xs mt-0.5" style={{color: '#64748b'}}>or message Judith directly</div>
          </div>

          <a href="https://slack.com/app_redirect?channel=fr-gms-feedback" target="_blank" rel="noopener noreferrer"
             className="block w-full text-center py-2 rounded-lg text-xs mt-2" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171'}}>
            \uD83D\uDC1B Report issue
          </a>
        </div>
      </div>
    </div>
  )
}
