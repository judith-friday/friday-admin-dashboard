'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Data: every help section as a flat object for search & render
// ---------------------------------------------------------------------------
interface HelpEntry {
  id: string
  title: string
  group: string          // rendered as a divider before first item in group
  content: string        // plain-text version for search matching
  keywords: string[]
  render: (hl: (text: string) => React.ReactNode) => React.ReactNode
}

const HELP_DATA: HelpEntry[] = [
  // ── Getting Started ──────────────────────────────────────────────────────
  {
    id: 'getting-started',
    title: 'Getting Started',
    group: 'Getting Started',
    keywords: ['workflow', 'daily', 'inbox', 'draft', 'approve', 'send', 'action items', 'notes', 'translations'],
    content: 'Welcome to Friday Admin. Check the inbox unread messages have a blue dot. Click a conversation to read the guest message and Judith draft. Review the draft check the confidence score. Adjust if needed type instructions. Approve and Send confirmation with 5-second undo. Check Action Items things promised to guests. Everything you do is tracked. Staff notes shared with Judith. Don\'t approve bad drafts. When in doubt reject and say why. Translations happen automatically.',
    render: (hl) => (
      <div className="space-y-3">
        <p>{hl('Welcome to Friday Admin! This is where you review and send guest messages.')}</p>
        <div className="space-y-2">
          <p className="font-semibold" style={{color: '#e2e8f0'}}>Your daily workflow:</p>
          <div className="space-y-1.5">
            {['Check the inbox — unread messages have a blue dot',
              'Click a conversation to read the guest\'s message and Judith\'s draft',
              'Review the draft — check the confidence score for how much attention it needs',
              'Adjust if needed — type instructions like "add the WiFi password" or "be warmer"',
              'Approve & Send — a confirmation pops up with a 5-second undo window',
              'Check ⏳ Action Items — things we promised guests but haven\'t done yet',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#94a3b8'}}>
                <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{i+1}</span>
                <span>{hl(step)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 mt-3">
          <p className="font-semibold" style={{color: '#e2e8f0'}}>Key things to know:</p>
          <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
            <div>• {hl('Everything you do is tracked (who approved, who rejected, who wrote notes)')}</div>
            <div>• {hl('Staff notes are shared with Judith — she reads them when drafting future replies')}</div>
            <div>• {hl("Don't approve bad drafts to save time — Judith learns from your approvals")}</div>
            <div>• {hl('When in doubt, reject and say why — this helps Judith improve')}</div>
            <div>• {hl("Translations happen automatically — you review in English, Judith sends in the guest's language")}</div>
          </div>
        </div>
      </div>
    ),
  },

  // ── How It Works ─────────────────────────────────────────────────────────
  {
    id: 'how-it-works',
    title: 'How It Works',
    group: 'How It Works',
    keywords: ['language', 'translate', 'summarize', 'draft', 'confidence', 'queue', 'review'],
    content: 'When a guest sends a message Judith automatically detects the language and translates. Summarizes the conversation. Drafts a reply with a confidence score. Queues it for your review.',
    render: (hl) => (
      <div>
        <p className="text-xs leading-relaxed mb-2" style={{color: '#94a3b8'}}>{hl('When a guest sends a message, Judith automatically:')}</p>
        <div className="space-y-1.5">
          {['Detects the language and translates if needed', 'Summarizes the conversation', 'Drafts a reply with a confidence score', 'Queues it for your review'].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#94a3b8'}}>
              <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{i+1}</span>
              <span>{hl(step)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'confidence-scores',
    title: 'Confidence Scores',
    group: 'How It Works',
    keywords: ['score', 'green', 'amber', 'red', 'routine', 'complaint', 'complex'],
    content: 'Confidence scores 80-98% Green routine question quick review. 60-79% Amber check carefully might need revision. Below 60% Red complex situation complaint missing context.',
    render: (hl) => (
      <div className="space-y-2">
        {[
          {range: '80-98%', color: '#4ade80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.1)', badge: 'rgba(34,197,94,0.15)', label: 'Green', desc: 'Routine question with good context. Quick review and approve.'},
          {range: '60-79%', color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.1)', badge: 'rgba(245,158,11,0.15)', label: 'Amber', desc: 'Check carefully, might need revision.'},
          {range: 'Below 60%', color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.1)', badge: 'rgba(239,68,68,0.15)', label: 'Red', desc: 'Complex situation, complaint, or missing context. Review closely.'},
        ].map(s => (
          <div key={s.range} className="rounded-lg p-2.5" style={{background: s.bg, border: `1px solid ${s.border}`}}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{background: s.badge, color: s.color}}>{s.range}</span>
              <span className="text-xs font-semibold" style={{color: s.color}}>{s.label}</span>
            </div>
            <div className="text-xs" style={{color: '#94a3b8'}}>{hl(s.desc)}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'reviewing-drafts',
    title: 'Reviewing Drafts',
    group: 'How It Works',
    keywords: ['edit', 'revise', 'approve', 'reject', 'send'],
    content: 'Read the draft in the center panel. Edit directly click Edit to make changes. Ask Judith to revise type an instruction. Approve and Send sends via booking platform. Reject discards with a reason helps Judith learn.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        {[
          ['Read the draft', ' in the center panel'],
          ['Edit directly', ' — click Edit to make changes'],
          ['Ask Judith to revise', ' — type an instruction below the draft'],
          ['Approve & Send', " — sends via the guest's booking platform"],
          ['Reject', " — discards with a reason (helps Judith learn)"],
        ].map(([bold, rest], i) => (
          <div key={i}><span style={{color: '#e2e8f0', fontWeight: 500}}>{hl(bold)}</span>{hl(rest)}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'revision-tips',
    title: 'Tips for Great Revisions',
    group: 'How It Works',
    keywords: ['revision', 'instruction', 'specific', 'vague', 'wifi', 'empathetic'],
    content: 'Add the WiFi password. Guest seems upset be extra empathetic. Mention the beach is 2 min walk. Good specific revision tips.',
    render: (hl) => (
      <div className="space-y-1.5">
        {[
          ['"Add the WiFi password"', '"Add more info"'],
          ['"Guest seems upset, be extra empathetic"', '"Make it better"'],
          ['"Mention the beach is 2 min walk"', '"Talk about the location"'],
        ].map(([good, bad], i) => (
          <div key={i} className="rounded-md p-2 text-xs" style={{background: 'rgba(255,255,255,0.03)'}}>
            <span style={{color: '#4ade80'}}>Good:</span> <span style={{color: '#e2e8f0'}}>{hl(good)}</span><br/>
            <span style={{color: '#f87171'}}>Vague:</span> <span style={{color: '#64748b'}}>{hl(bad)}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'pending-actions',
    title: 'Pending Actions',
    group: 'How It Works',
    keywords: ['action', 'promise', 'urgency', 'overdue'],
    content: 'When we promise something to a guest it appears in the Actions tab. Age badges show urgency under 2h 2-6h 6h+ overdue.',
    render: (hl) => (
      <div>
        <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
          {hl('When we promise something to a guest, it appears in the ')}
          <span style={{color: '#fbbf24'}}>Actions</span>
          {hl(' tab. Age badges show urgency:')}
        </p>
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>under 2h</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>2-6h</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>6h+ overdue</span>
        </div>
      </div>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    group: 'How It Works',
    keywords: ['shortcut', 'keyboard', 'navigate', 'enter', 'escape', 'hotkey'],
    content: 'Navigate conversations up down. Open conversation enter. Focus Ask Judith slash. Approve and send command enter. Deselect escape.',
    render: () => (
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
                <span key={k} className="px-2 py-0.5 rounded text-xs font-mono" style={{background: 'rgba(255,255,255,0.08)', color: '#e2e8f0'}}>{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'staff-notes',
    title: 'Staff Notes',
    group: 'How It Works',
    keywords: ['notes', 'context', 'vip', 'repeat', 'elderly'],
    content: 'The notes field in the right panel is shared with Judith. Anything you write becomes context for future drafts. VIP guest husband proposed. Guest is elderly needs ground floor. Repeat guest prefers early check-in.',
    render: (hl) => (
      <div>
        <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
          {hl('The notes field in the right panel is shared with Judith. Anything you write becomes context for future drafts.')}
        </p>
        <div className="space-y-1 mt-2">
          {['"VIP guest, husband proposed here last year"', '"Guest is elderly, needs ground floor access"', '"Repeat guest, prefers early check-in"'].map(ex => (
            <div key={ex} className="rounded px-2 py-1 text-xs italic" style={{background: 'rgba(255,255,255,0.03)', color: '#e2e8f0'}}>{hl(ex)}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'auto-send',
    title: 'Auto-send',
    group: 'How It Works',
    keywords: ['auto', 'automatic', 'toggle', '85%'],
    content: 'Toggle per conversation in the right panel. When enabled replies with 85%+ confidence for routine questions send automatically. Start with this OFF until you trust Judith drafts.',
    render: (hl) => (
      <div>
        <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
          {hl('Toggle per conversation in the right panel. When enabled, replies with 85%+ confidence for routine questions send automatically.')}
        </p>
        <div className="mt-2 rounded-md px-2.5 py-1.5 text-xs" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24'}}>
          Start with this OFF until you trust Judith&apos;s drafts
        </div>
      </div>
    ),
  },
  {
    id: 'how-confidence-works',
    title: 'How Confidence Scores Work',
    group: 'How It Works',
    keywords: ['confidence', 'formula', 'base', 'routine', 'complaint', 'reservation', 'property', 'language', 'complexity'],
    content: 'Judith calculates confidence using a weighted formula. Base score 75%. Message type +20% routine -15% complaints. Reservation context +15% good -10% missing. Property knowledge +10% relevant -10% unknown. Language -5% non-English. Complexity -5% per extra question. Example routine WiFi 95%. Example complex complaint 40%.',
    render: (hl) => (
      <div className="space-y-2">
        <p>{hl('Judith calculates confidence using a weighted formula:')}</p>
        <div className="pl-2 space-y-1" style={{color: '#64748b'}}>
          <div>• {hl('Base score: 75%')}</div>
          <div>• {hl('Message type: +20% routine, -15% complaints')}</div>
          <div>• {hl('Reservation context: +15% good, -10% missing')}</div>
          <div>• {hl('Property knowledge: +10% relevant, -10% unknown')}</div>
          <div>• {hl('Language: -5% non-English')}</div>
          <div>• {hl('Complexity: -5% per extra question')}</div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="rounded p-2" style={{background: 'rgba(34,197,94,0.08)'}}>
            <div className="text-xs font-semibold" style={{color: '#4ade80'}}>Example: Routine WiFi question</div>
            <div className="text-xs mt-1" style={{color: '#64748b'}}>{hl('75% + 20% (routine) + 15% (good context) + 10% (property info) = 95%')}</div>
          </div>
          <div className="rounded p-2" style={{background: 'rgba(239,68,68,0.08)'}}>
            <div className="text-xs font-semibold" style={{color: '#f87171'}}>Example: Complex complaint</div>
            <div className="text-xs mt-1" style={{color: '#64748b'}}>{hl('75% - 15% (complaint) - 10% (missing context) - 10% (complex) = 40%')}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'teaching-judith',
    title: 'Teaching Judith',
    group: 'How It Works',
    keywords: ['teach', 'learn', 'revise', 'rule', 'permanent', 'one-time', 'property', 'teachings', 'revoke'],
    content: 'When you submit a revision you\'ll see three options. Revise adjusts draft doesn\'t learn permanently 3+ similar instructions triggers auto-learn. Revise and teach adjusts AND saves as a permanent rule choose this property or all properties. Revise one-time adjusts but does NOT learn for guest-specific things. View what Judith has learned click Teachings. You can revoke any teaching if it was a mistake. Never mention pool is shared. Always include parking for GBH. Don\'t teach guest-specific things. Don\'t approve bad drafts. Contradictory instructions. Editing draft text directly without revision input.',
    render: (hl) => (
      <div className="space-y-3">
        <p>{hl("When you submit a revision, you'll see three options:")}</p>
        <div className="space-y-1.5">
          <div><span style={{color: '#4ade80', fontWeight: 500}}>Revise</span> — {hl("adjusts draft, doesn't learn permanently. 3+ similar instructions triggers auto-learn.")}</div>
          <div><span style={{color: '#fbbf24', fontWeight: 500}}>Revise &amp; teach 🧠</span> — {hl('adjusts AND saves as a permanent rule. Choose: this property or all properties.')}</div>
          <div><span style={{color: '#6395ff', fontWeight: 500}}>Revise (one-time)</span> — {hl('adjusts but does NOT learn. For guest-specific things.')}</div>
        </div>
        <p className="mt-2">{hl("View what Judith has learned: click 🧠 Teachings. You can revoke any teaching if it was a mistake.")}</p>
        <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)'}}>
          <div className="text-xs font-semibold mb-1" style={{color: '#4ade80'}}>Good teaching examples</div>
          <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
            <div>✅ {hl('"Never mention the pool is shared" (property-specific)')}</div>
            <div>✅ {hl('"Always include parking for GBH properties" (global)')}</div>
          </div>
        </div>
        <div className="rounded-md p-2.5" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)'}}>
          <div className="text-xs font-semibold mb-1" style={{color: '#f87171'}}>Don&apos;t teach</div>
          <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
            <div>❌ {hl('Guest-specific things like "mention their anniversary" — use one-time instead')}</div>
            <div>❌ {hl("Approving bad drafts (she thinks it's good)")}</div>
            <div>❌ {hl('Contradictory instructions')}</div>
            <div>❌ {hl('Editing draft text directly without revision input (no feedback for Judith)')}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'judith-capabilities',
    title: "What Judith Can and Can't Do",
    group: 'How It Works',
    keywords: ['capabilities', 'translate', 'complaint', 'amenities', 'action items', 'maintenance', 'payments', 'refunds'],
    content: "What Judith CAN do: Draft personalized replies in guest's language. Detect complaint tone and urgency. Use property-specific knowledge WiFi amenities directions. Translate 50+ languages. Track promises and create action items. Suggest empathetic responses. What Judith CAN'T do: Send messages without human approval. Access Breezeway for maintenance. Modify reservations. Handle payments refunds billing. Make decisions about property policies.",
    render: (hl) => (
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold mb-1.5" style={{color: '#4ade80'}}>{'✅'} What Judith CAN do</div>
          <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
            <div>• {hl("Draft personalized replies in guest's language")}</div>
            <div>• {hl('Detect complaint tone and urgency levels')}</div>
            <div>• {hl('Use property-specific knowledge (WiFi, amenities, directions)')}</div>
            <div>• {hl('Translate messages in 50+ languages')}</div>
            <div>• {hl('Track promises and create action items')}</div>
            <div>• {hl('Suggest empathetic responses for upset guests')}</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1.5" style={{color: '#f87171'}}>{'❌'} What Judith CAN&apos;T do (yet)</div>
          <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
            <div>• {hl('Send messages without human approval')}</div>
            <div>• {hl('Access Breezeway for maintenance requests')}</div>
            <div>• {hl('Modify reservations or booking details')}</div>
            <div>• {hl('Handle payments, refunds, or billing issues')}</div>
            <div>• {hl('Make decisions about property policies')}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'escalation-triggers',
    title: 'Escalation Triggers',
    group: 'How It Works',
    keywords: ['escalate', 'Ishant', 'refund', 'safety', 'emergency', 'legal', 'injury', 'damage', 'discrimination', 'harassment', 'police'],
    content: 'Always escalate to @Ishant immediately. Refund requests over $100. Safety security emergency. Legal threats liability. Guest injuries medical. Property damage. Discrimination harassment. Issues involving minors child safety. Payment processing problems. Booking modifications affecting revenue. Noise complaints involving police. Threats of negative reviews.',
    render: (hl) => (
      <div className="space-y-2">
        <p>{hl('Always escalate these to ')}<span style={{color: '#6395ff', fontWeight: 500}}>@Ishant</span>{hl(' immediately:')}</p>
        <div className="space-y-1.5">
          {[
            'Refund requests over $100',
            'Safety, security, or emergency situations',
            'Legal threats or liability concerns',
            'Guest injuries or medical incidents',
            'Property damage reports',
            'Discrimination or harassment allegations',
            'Issues involving minors or child safety',
            'Payment processing problems',
            'Booking modifications affecting revenue',
            'Noise complaints involving police',
            'Threats of negative reviews over policy disputes',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span style={{color: '#f87171'}}>⚠️</span>
              <span style={{color: '#94a3b8'}}>{hl(item)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'exception-pattern',
    title: "The 'Exception' Pattern",
    group: 'How It Works',
    keywords: ['exception', 'favor', 'check-in', 'review', '5-star', 'flexibility'],
    content: 'When granting special requests use this proven formula. Grant the favor I\'ve arranged early check-in at 2 PM. Frame as exception this is a special accommodation standard check-in is 4 PM. Ask for 5-star review we\'d be grateful if you mention this flexibility. Positions favors as value-adds while encouraging positive feedback.',
    render: (hl) => (
      <div className="space-y-2">
        <p>{hl('When granting special requests, use this proven formula:')}</p>
        <div className="space-y-2 mt-3">
          <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
            <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>1. Grant the favor</div>
            <div className="text-xs italic" style={{color: '#94a3b8'}}>{hl("\"I've arranged early check-in at 2 PM for you.\"")}</div>
          </div>
          <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
            <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>2. Frame as exception</div>
            <div className="text-xs italic" style={{color: '#94a3b8'}}>{hl("\"This is a special accommodation as our standard check-in is 4 PM.\"")}</div>
          </div>
          <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
            <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>3. Ask for 5-star review</div>
            <div className="text-xs italic" style={{color: '#94a3b8'}}>{hl("\"We'd be grateful if you could mention this flexibility in your review!\"")}</div>
          </div>
        </div>
        <div className="mt-3 text-xs" style={{color: '#64748b'}}>
          {hl('This positions favors as value-adds while encouraging positive feedback.')}
        </div>
      </div>
    ),
  },
  {
    id: 'property-knowledge',
    title: 'Property Knowledge',
    group: 'How It Works',
    keywords: ['property', 'wifi', 'check-in', 'parking', 'amenities', 'faq', 'edit', 'knowledge card'],
    content: 'Click any property code in the sidebar to view its knowledge card WiFi check-in instructions parking amenities FAQs. If info is wrong click Edit fix it save. Judith uses updated info immediately. If no card exists you can create one. More info better drafts.',
    render: (hl) => (
      <div className="space-y-2">
        <p>{hl('Click any property code in the sidebar to view its knowledge card — WiFi, check-in instructions, parking, amenities, FAQs.')}</p>
        <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
          <div>• {hl('If info is wrong: click Edit, fix it, save. Judith uses updated info immediately.')}</div>
          <div>• {hl('If no card exists: you can create one. More info = better drafts for that property.')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'channels-sending',
    title: 'Channels and Sending',
    group: 'How It Works',
    keywords: ['channel', 'airbnb', 'booking.com', 'whatsapp', 'email', 'ota', 'direct'],
    content: 'When you approve the confirmation popup shows a channel selector. Booking platform Airbnb Booking.com messaging default for OTA bookings. WhatsApp common for direct bookings. Email for formal or fallback messages. Default is based on how the guest last messaged us. You can change it before sending.',
    render: (hl) => (
      <div className="space-y-2">
        <p>{hl('When you approve, the confirmation popup shows a channel selector:')}</p>
        <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Booking platform</span> {hl('(Airbnb/Booking.com messaging) — default for OTA bookings')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>WhatsApp</span> {hl('— common for direct bookings')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Email</span> {hl('— for formal or fallback messages')}</div>
        </div>
        <p className="mt-1">{hl('Default is based on how the guest last messaged us. You can change it before sending.')}</p>
      </div>
    ),
  },

  // ── AI Features ──────────────────────────────────────────────────────────
  {
    id: 'ask-judith',
    title: '💬 Ask Judith (3 Contexts)',
    group: 'AI Features',
    keywords: ['ask', 'judith', 'compose', 'draft review', 'revision', 'consultation', 'opinion', 'self-review', 'back-and-forth'],
    content: 'From Compose: When writing a new message click Ask Judith to get her opinion on your draft before sending. From Draft Review: Click Ask Judith on any AI-generated draft to get a self-review she\'ll flag what she\'s confident about and what you should double-check. From Revision: When revising a draft click Ask Judith First to get her opinion on your revision instruction before applying it she\'ll tell you if the change makes sense given the property and policies. You can have up to 3 back-and-forth exchanges in each consultation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>From Compose:</span> {hl("When writing a new message, click \"Ask Judith\" to get her opinion on your draft before sending")}</div>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>From Draft Review:</span> {hl("Click \"Ask Judith\" on any AI-generated draft to get a self-review — she'll flag what she's confident about and what you should double-check")}</div>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>From Revision:</span> {hl("When revising a draft, click \"Ask Judith First\" to get her opinion on your revision instruction before applying it — she'll tell you if the change makes sense given the property and policies")}</div>
        <div className="mt-2 rounded-md px-2.5 py-1.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)', color: '#6395ff'}}>
          {hl('You can have up to 3 back-and-forth exchanges in each consultation')}
        </div>
      </div>
    ),
  },
  {
    id: 'learning-queue',
    title: '🧠 Learning Queue & Recommendations',
    group: 'AI Features',
    keywords: ['learning', 'queue', 'recommendation', 'approve', 'reject', 'modify', 'teach', 'scope', 'rule', 'candidate'],
    content: "When Judith encounters something new she could learn it appears in the Learning Queue. Each candidate shows Judith's Take her recommendation on whether to approve reject or modify. Approve teaches Judith this rule for future drafts. Reject tells Judith this isn't a good rule. Modify edit the instruction before teaching it. Teaching can be scoped to one property or all properties.",
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl("When Judith encounters something new she could learn, it appears in the Learning Queue")}</div>
        <div>• {hl("Each candidate shows \"Judith's Take\" — her recommendation on whether to approve, reject, or modify")}</div>
        <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Approve:</span> {hl('teaches Judith this rule for future drafts')}</div>
        <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Reject:</span> {hl("tells Judith this isn't a good rule")}</div>
        <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Modify:</span> {hl('edit the instruction before teaching it')}</div>
        <div>• {hl('Teaching can be scoped to one property or all properties')}</div>
      </div>
    ),
  },

  // ── Messaging ────────────────────────────────────────────────────────────
  {
    id: 'message-send-retry',
    title: '🔄 Message Send & Retry',
    group: 'Messaging',
    keywords: ['send', 'retry', 'api', 'guesty', 'fallback', 'browser', 'slack', 'queue', 'copy-paste'],
    content: 'When you approve a message it sends via the Guesty API. If the API is down it automatically retries once at 1 minute again at 5 minutes. If retries fail Judith tries sending via the Guesty web interface browser fallback. If everything fails the full message is posted to #fr-guest-messages on Slack so you can copy-paste it manually. You can also click Retry Now on any queued message to try immediately.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('When you approve a message, it sends via the Guesty API')}</div>
        <div>• {hl('If the API is down, it automatically retries: once at 1 minute, again at 5 minutes')}</div>
        <div>• {hl('If retries fail, Judith tries sending via the Guesty web interface (browser fallback)')}</div>
        <div>• {hl('If everything fails, the full message is posted to #fr-guest-messages on Slack so you can copy-paste it manually')}</div>
        <div>• {hl('You can also click "Retry Now" on any queued message to try immediately')}</div>
      </div>
    ),
  },
  {
    id: 'slack-notifications',
    title: '📢 Slack Notifications',
    group: 'Messaging',
    keywords: ['slack', 'notification', 'push', 'fr-guest-messages', 'deep link', 'new message', 'draft ready', 'auto-sent', 'low confidence', 'escalation', 'overdue', 'booking', 'inquiry'],
    content: 'All GMS notifications go to #fr-guest-messages on Slack. Notifications use rich formatting with property names guest info dates channel icons and deep links. Types: new messages draft ready auto-sent confirmations low confidence alerts escalations overdue actions new bookings inquiries. Push notifications are enabled for all team members not just admins.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('All GMS notifications go to #fr-guest-messages on Slack')}</div>
        <div>• {hl('Notifications use rich formatting with property names, guest info, dates, channel icons, and deep links')}</div>
        <div>• {hl('Types: new messages, draft ready, auto-sent confirmations, low confidence alerts, escalations, overdue actions, new bookings, inquiries')}</div>
        <div>• {hl('Push notifications are enabled for all team members (not just admins)')}</div>
      </div>
    ),
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  {
    id: 'notification-bell',
    title: '🔔 Notification Bell',
    group: 'Dashboard',
    keywords: ['bell', 'notification', 'unread', 'badge', 'alert', 'action item', 'draft status'],
    content: 'The bell icon in the top right shows unread notifications. A red badge shows the count of unread items. Click to see recent draft statuses action items and system alerts. Notifications clear when you click them.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('The bell icon in the top right shows unread notifications')}</div>
        <div>• {hl('A red badge shows the count of unread items')}</div>
        <div>• {hl('Click to see recent draft statuses, action items, and system alerts')}</div>
        <div>• {hl('Notifications clear when you click them')}</div>
      </div>
    ),
  },
  {
    id: 'financial-info',
    title: '💰 Financial Info',
    group: 'Dashboard',
    keywords: ['financial', 'nightly rate', 'cleaning fee', 'total', 'host payout', 'guesty', 'currency', 'reservation'],
    content: 'The right-side guest panel shows reservation financials nightly rate times nights cleaning fee total and host payout. Data comes from Guesty and appears after the reservation is enriched. If you don\'t see financial info the reservation may not have been polled yet it updates automatically on the next cycle. Currency is auto-detected from the reservation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('The right-side guest panel shows reservation financials: nightly rate × nights, cleaning fee, total, and host payout')}</div>
        <div>• {hl('Data comes from Guesty and appears after the reservation is enriched')}</div>
        <div>• {hl("If you don't see financial info, the reservation may not have been polled yet — it updates automatically on the next cycle")}</div>
        <div>• {hl('Currency is auto-detected from the reservation')}</div>
      </div>
    ),
  },
  {
    id: 'checkin-checkout-times',
    title: '🕐 Check-in/Checkout Times',
    group: 'Dashboard',
    keywords: ['check-in', 'checkout', 'arrival', 'departure', 'planned', 'time', 'guesty'],
    content: 'Check-in and checkout dates now include planned arrival departure times when available. Times come from the guest\'s specific booking in Guesty plannedArrival plannedDeparture. If no planned time is set only the date is shown. Times only display for current and future reservations.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Check-in and checkout dates now include planned arrival/departure times when available (e.g., "Apr 10 (3:00 PM)")')}</div>
        <div>• {hl("Times come from the guest's specific booking in Guesty (plannedArrival/plannedDeparture)")}</div>
        <div>• {hl('If no planned time is set, only the date is shown')}</div>
        <div>• {hl('Times only display for current and future reservations')}</div>
      </div>
    ),
  },
  {
    id: 'response-time-metrics',
    title: '⏱️ Response Time Metrics',
    group: 'Dashboard',
    keywords: ['response time', 'RT', 'average', 'median', 'team', '30d', 'green', 'yellow', 'red', 'tooltip', 'gap'],
    content: 'Avg RT per-conversation the average of ALL response gaps in that conversation every time a guest messages and we reply the gap is measured and averaged. Team RT 30d top bar the median of all per-conversation average response times over the last 30 days this is your team overall responsiveness. Both use color coding green under 15min yellow under 60min red over 60min. Hover over each metric for a tooltip explaining the calculation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Avg RT</span> {hl('(per-conversation): The average of ALL response gaps in that conversation — every time a guest messages and we reply, the gap is measured and averaged')}</div>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Team RT (30d)</span> {hl("(top bar): The median of all per-conversation average response times over the last 30 days — this is your team's overall responsiveness")}</div>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>&lt;15min</span>
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>&lt;60min</span>
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>&gt;60min</span>
        </div>
        <div className="mt-1">• {hl('Hover over each metric for a tooltip explaining the calculation')}</div>
      </div>
    ),
  },

  // ── Operations ───────────────────────────────────────────────────────────
  {
    id: 'discount-refund',
    title: '📊 Discount & Refund Quick Reference',
    group: 'Operations',
    keywords: ['discount', 'refund', 'coupon', 'FRIDAY10', 'authority', 'Mathias', 'Franny', 'Ishant', 'gap-filler', 'compensation', 'late checkout', 'early check-in', 'cleaning fee', 'credit', 'underpromise', 'overdeliver'],
    content: 'FRIDAY10 coupon 10% discount for direct bookings on friday.mu. Authority Mathias can approve refunds up to 30% of reservation value max €200. Franny can approve maintenance up to Rs 5000 ~€100. Above that Ishant. Gap-filler preference late checkout early check-in cleaning fee waiver free extra night. Available compensation tools percentage discounts partial full refunds free early check-in free late checkout free extra nights future stay credits. NOT available dinners restaurant vouchers welcome baskets gift packages airport transfers private chef complex owner accounting. Core principle underpromise and overdeliver. Never commit to specific timeframes without checking with the team first.',
    render: (hl) => (
      <div className="space-y-3 text-xs" style={{color: '#94a3b8'}}>
        <div>
          <div className="font-semibold mb-1" style={{color: '#e2e8f0'}}>FRIDAY10 coupon</div>
          <div>{hl('10% discount for direct bookings on friday.mu')}</div>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{color: '#e2e8f0'}}>Authority</div>
          <div>{hl('Mathias can approve refunds up to 30% of reservation value (max €200). Franny can approve maintenance up to Rs 5,000 (~€100). Above that → Ishant.')}</div>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{color: '#e2e8f0'}}>Gap-filler preference</div>
          <div>{hl('late checkout → early check-in → cleaning fee waiver → free extra night')}</div>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{color: '#4ade80'}}>Available compensation tools</div>
          <div>{hl('percentage discounts, partial/full refunds, free early check-in, free late checkout, free extra nights, future stay credits')}</div>
        </div>
        <div>
          <div className="font-semibold mb-1" style={{color: '#f87171'}}>NOT available</div>
          <div>{hl('dinners, restaurant vouchers, welcome baskets, gift packages, airport transfers, private chef (complex owner accounting)')}</div>
        </div>
        <div className="rounded-md px-2.5 py-1.5 mt-2" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24'}}>
          {hl('Core principle: Underpromise and overdeliver. Never commit to specific timeframes without checking with the team first.')}
        </div>
      </div>
    ),
  },
  {
    id: 'bug-reports',
    title: '🐛 Bug Reports & Pending Review',
    group: 'Operations',
    keywords: ['bug', 'report', 'submitted', 'pending review', 'verify', 'reopen', 'filter', 'status'],
    content: 'Report bugs using the bug report button bottom right on mobile menu on desktop. New bugs start in Submitted status. Once reviewed bugs move to Pending Review the reviewer can Verify close or Reopen. Filter bugs by status in the bug reports panel.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Report bugs using the bug report button (bottom right on mobile, menu on desktop)')}</div>
        <div>• {hl('New bugs start in "Submitted" status')}</div>
        <div>• {hl('Once reviewed, bugs move to "Pending Review" — the reviewer can Verify (close) or Reopen')}</div>
        <div>• {hl('Filter bugs by status in the bug reports panel')}</div>
      </div>
    ),
  },
]

// Group order for rendering
const GROUP_ORDER = [
  'Getting Started',
  'How It Works',
  'AI Features',
  'Messaging',
  'Dashboard',
  'Operations',
]

// Groups that get a divider header (not the first two — they're "legacy")
const DIVIDER_GROUPS = new Set(['AI Features', 'Messaging', 'Dashboard', 'Operations'])

// ---------------------------------------------------------------------------
// Highlight helper: wraps substring matches in <mark>
// ---------------------------------------------------------------------------
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let last = 0
  let idx = lower.indexOf(q, last)
  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx))
    parts.push(
      <mark key={idx} style={{ background: 'rgba(99,149,255,0.2)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    last = idx + q.length
    idx = lower.indexOf(q, last)
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? <>{parts}</> : text
}

// ---------------------------------------------------------------------------
// ExpandableSection (data-driven, search-aware)
// ---------------------------------------------------------------------------
function ExpandableSection({ title, forceOpen, children }: { title: string; forceOpen?: boolean; children: React.ReactNode }) {
  const [userOpen, setUserOpen] = useState(false)
  const isOpen = forceOpen || userOpen
  return (
    <section>
      <button onClick={() => setUserOpen(o => !o)} className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6395ff' }}>
        <span>{title}</span>
        <span style={{ color: '#64748b' }}>{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="mt-2 text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{children}</div>}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('')

  const matches = useCallback((entry: HelpEntry, q: string) => {
    const lower = q.toLowerCase()
    return (
      entry.title.toLowerCase().includes(lower) ||
      entry.content.toLowerCase().includes(lower) ||
      entry.keywords.some(k => k.toLowerCase().includes(lower))
    )
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return HELP_DATA
    return HELP_DATA.filter(e => matches(e, search.trim()))
  }, [search, matches])

  const hl = useCallback(
    (text: string) => highlightText(text, search.trim()),
    [search],
  )

  if (!isOpen) return null

  // Group entries for rendering
  const grouped: { group: string; entries: HelpEntry[] }[] = []
  let lastGroup = ''
  for (const entry of filtered) {
    if (entry.group !== lastGroup) {
      grouped.push({ group: entry.group, entries: [entry] })
      lastGroup = entry.group
    } else {
      grouped[grouped.length - 1].entries.push(entry)
    }
  }
  // Reorder groups by GROUP_ORDER
  const orderedGroups = GROUP_ORDER.map(g => grouped.find(gr => gr.group === g)).filter(Boolean) as typeof grouped

  const isSearching = search.trim().length > 0

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" data-testid="modal-help-panel" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />
      <div className="relative w-full md:w-[340px] h-full overflow-y-auto slide-in-right custom-scrollbar"
           style={{ background: 'rgba(15,25,50,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-5 pb-3" style={{ background: 'rgba(15,25,50,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-bold" style={{ color: '#f1f5f9' }}>Friday Admin</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Quick guide</div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" data-testid="btn-close-help" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>✕</button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help…"
              className="w-full pl-8 pr-8 py-1.5 rounded-md text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
              autoComplete="off"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#64748b' }}>✕</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm" style={{ color: '#64748b' }}>No results for &ldquo;{search}&rdquo;</div>
              <button onClick={() => setSearch('')} className="text-xs mt-2 underline" style={{ color: '#6395ff' }}>Clear search</button>
            </div>
          )}

          {orderedGroups.map(({ group, entries }) => (
            <React.Fragment key={group}>
              {DIVIDER_GROUPS.has(group) && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>{group}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              )}
              {entries.map(entry => (
                <ExpandableSection key={entry.id} title={entry.title} forceOpen={isSearching}>
                  {entry.render(hl)}
                </ExpandableSection>
              ))}
            </React.Fragment>
          ))}

          {/* Footer – always visible when not searching */}
          {!isSearching && (
            <>
              <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Need help? Tag <span style={{ color: '#6395ff', fontWeight: 500 }}>@Ishant</span> in Slack</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>or message Judith directly</div>
              </div>

              <a href="https://slack.com/app_redirect?channel=fr-gms-feedback" target="_blank" rel="noopener noreferrer"
                 className="block w-full text-center py-2 rounded-lg text-xs mt-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                🐛 Report issue
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
