'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Data: every help section as a flat object for search & render
// ---------------------------------------------------------------------------
interface HelpEntry {
  id: string
  title: string
  group: string
  content: string
  keywords: string[]
  render: (hl: (text: string) => React.ReactNode) => React.ReactNode
}

const HELP_DATA: HelpEntry[] = [
  // ── 1. Getting Started ──────────────────────────────────────────────────
  {
    id: 'what-is-gms',
    title: 'What is Friday GMS?',
    group: '🏠 Getting Started',
    keywords: ['gms', 'friday', 'guest', 'messaging', 'system', 'what', 'overview', 'intro'],
    content: 'Friday GMS (Guest Messaging System) is where you manage all guest conversations across Airbnb, Booking.com, WhatsApp, and Email. Friday — your AI assistant — reads incoming messages, drafts replies, and learns from your corrections to get better over time.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday GMS (Guest Messaging System) is where you manage all guest conversations across Airbnb, Booking.com, WhatsApp, and Email.')}</p>
        <p className="leading-relaxed">{hl('Friday — your AI assistant — reads incoming messages, drafts replies, and learns from your corrections to get better over time.')}</p>
        <p className="leading-relaxed" style={{color: '#e2e8f0'}}>{hl('Think of it as your team inbox with a very capable assistant built in.')}</p>
      </div>
    ),
  },
  {
    id: 'inbox-basics',
    title: 'How the inbox works',
    group: '🏠 Getting Started',
    keywords: ['inbox', 'conversation', 'list', 'filter', 'status', 'open', 'sent', 'done', 'sidebar'],
    content: 'The left sidebar shows all guest conversations. Each one has a status. Use the filter bar at the top to view conversations by status. Click a conversation to open it and see the full message thread plus any AI draft.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The left sidebar shows all guest conversations. Each one has a status:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Open</span> — {hl('needs your attention, a new message came in')}</div>
          <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Sent</span> — {hl('you replied, waiting for guest response')}</div>
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Done</span> — {hl('conversation is resolved')}</div>
          <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Review</span> — {hl('AI draft needs your review before sending')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Use the filter bar at the top to view conversations by status. Click a conversation to open it and see the full message thread plus any AI draft.')}</p>
      </div>
    ),
  },
  {
    id: 'confidence-scores',
    title: 'Confidence scores & badges',
    group: '🏠 Getting Started',
    keywords: ['confidence', 'score', 'percentage', 'badge', '85', '50', 'high', 'low', 'quality'],
    content: 'Each conversation may show a percentage score. This is the AI confidence score — how sure Friday is about the draft. 80%+ confident, 50-79% needs editing, below 50% review carefully.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Each conversation may show a percentage score. This is the AI confidence score — how sure Friday is about the draft:')}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>80%+</span>
            <span>{hl('Friday is confident — draft is likely accurate and ready')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>50–79%</span>
            <span>{hl('Draft likely needs some editing or extra info')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>&lt;50%</span>
            <span>{hl('Friday is uncertain — review carefully before sending')}</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'navigation',
    title: 'Keyboard shortcuts',
    group: '🏠 Getting Started',
    keywords: ['navigate', 'keyboard', 'up', 'down', 'enter', 'escape', 'shortcut', 'arrow'],
    content: 'Use arrow keys to move between conversations. Enter to open, Escape to deselect, slash to jump to Ask Friday, Cmd+Enter to approve and send.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1.5">
          {[
            ['↑ ↓', 'Move between conversations'],
            ['Enter', 'Open selected conversation'],
            ['Esc', 'Deselect / close panel'],
            ['/', 'Jump to Ask Friday'],
            ['⌘ ↵', 'Approve & send draft'],
          ].map(([keys, desc]) => (
            <div key={keys} className="flex items-center justify-between">
              <span>{hl(desc)}</span>
              <span className="px-2 py-0.5 rounded font-mono text-xs flex-shrink-0 ml-2" style={{background: 'rgba(255,255,255,0.08)', color: '#e2e8f0'}}>{keys}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ── 2. AI & Drafts ─────────────────────────────────────────────────────
  {
    id: 'what-are-drafts',
    title: 'AI drafts',
    group: '✨ AI & Drafts',
    keywords: ['draft', 'ai', 'generated', 'automatic', 'reply', 'response', 'how'],
    content: 'When a guest sends a message, Friday automatically drafts a reply. Drafts are never sent automatically — you always review and approve first. You can edit, Ask Friday to revise, or compose from scratch.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When a guest sends a message, Friday automatically drafts a reply. The draft appears in the compose area below the conversation.')}</p>
        <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
          <span style={{color: '#e2e8f0'}}>{hl('Drafts are never sent automatically — you always review and approve before anything goes to the guest.')}</span>
        </div>
        <div className="space-y-1 mt-2">
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Approve & Send</span> — {hl('draft looks good, hit send (⌘ Enter)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Edit</span> — {hl('click into the draft and make changes')}</div>
          <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Ask Friday</span> — {hl('describe what to change ("make it warmer", "add check-in time")')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'ask-friday',
    title: 'Ask Friday',
    group: '✨ AI & Drafts',
    keywords: ['ask', 'friday', 'assistant', 'chat', 'ai', 'help', 'consult', 'session'],
    content: 'Ask Friday is your AI assistant. It can write messages, revise drafts, check property rules, and answer questions. It has access to all property info, teachings, the STR knowledge base, and the full conversation history. Friday is draft-aware — it knows when a draft exists and adjusts its suggestions accordingly.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Ask Friday is your AI assistant for everything related to guest communication:')}</p>
        <div className="space-y-1">
          <div>• {hl('Write a message from scratch or revise a draft')}</div>
          <div>• {hl('Check property rules and policies')}</div>
          <div>• {hl('Consult on how to handle tricky situations')}</div>
          <div>• {hl('Access STR knowledge base for industry best practices')}</div>
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#e2e8f0'}}>{hl('Friday is draft-aware — it knows when a draft exists and adjusts suggestions accordingly.')}</p>
      </div>
    ),
  },
  {
    id: 'contextual-chips',
    title: 'Contextual quick-action chips',
    group: '✨ AI & Drafts',
    keywords: ['chip', 'button', 'quick', 'action', 'contextual', 'behavioral', 'write', 'polish', 'shorter', 'rules'],
    content: 'Quick action chips adapt to context. When a draft exists you see Edit, Polish, Shorter, Check Rules. Without a draft you see Write it for me. Behavioral chips appear based on the conversation state — for example, a follow-up chip when the guest has been waiting.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Quick action chips adapt to the current context:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>With draft:</span> {hl('Polish, Shorter, Check Rules, Edit')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Without draft:</span> {hl('Write it for me, Compose')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Behavioral:</span> {hl('Context-aware suggestions based on conversation state (e.g., follow-up when guest is waiting)')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'context-refresh',
    title: 'Context refresh',
    group: '✨ AI & Drafts',
    keywords: ['context', 'refresh', 'reload', 'stale', 'update', 'new', 'messages'],
    content: 'If new messages arrive while you are chatting with Friday, a refresh banner appears. Click it to update Friday with the latest conversation context so its suggestions stay accurate.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('If new messages arrive while you\'re chatting with Friday, a refresh banner appears.')}</p>
        <p className="leading-relaxed">{hl('Click it to update Friday with the latest context so its suggestions stay accurate.')}</p>
      </div>
    ),
  },
  {
    id: 'action-trail',
    title: 'Action Trail',
    group: '✨ AI & Drafts',
    keywords: ['action', 'trail', 'history', 'draft', 'timeline', 'paginated', 'expandable'],
    content: 'The Action Trail (replaces Draft History) shows a timeline of all actions on a conversation — drafts generated, messages sent, edits, teachings applied. Entries are expandable to see full details. Paginated for long conversations — click "Show more" to load earlier entries.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The Action Trail shows a timeline of all actions on a conversation:')}</p>
        <div className="space-y-1">
          <div>• {hl('Drafts generated, messages sent, edits made')}</div>
          <div>• {hl('Teachings applied, learning events')}</div>
          <div>• {hl('Follow-ups and check-ins triggered')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Click any entry to expand full details. Paginated — click "Show more" to load earlier entries.')}</p>
      </div>
    ),
  },
  {
    id: 'learning-detection',
    title: 'Learning detection & suggested teachings',
    group: '✨ AI & Drafts',
    keywords: ['learn', 'teaching', 'detect', 'suggest', 'correction', 'improve', 'send', 'modal', 'candidate'],
    content: 'When you correct a draft, Friday may detect a pattern and suggest a new teaching. Suggested teachings also appear in the send confirmation modal — review and approve them before sending to help Friday improve. Teaching candidates are queued in the Knowledge panel for review.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When you correct a draft, Friday may detect a pattern and suggest a new teaching:')}</p>
        <div className="space-y-1">
          <div>• {hl('In-chat: Friday asks "Should I learn this?"')}</div>
          <div>• {hl('Send modal: suggested teachings appear for review before sending')}</div>
          <div>• {hl('Knowledge panel: teaching candidates queued for approval')}</div>
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#e2e8f0'}}>{hl('Your corrections directly improve future drafts for the whole team.')}</p>
      </div>
    ),
  },
  {
    id: 'emoji-decoding',
    title: 'Emoji decoding & interpretation',
    group: '✨ AI & Drafts',
    keywords: ['emoji', 'decode', 'interpret', 'meaning', 'thumbs', 'smiley'],
    content: 'Friday decodes emojis in guest messages and interprets their meaning in context. A thumbs-up might mean "yes" or "thanks" depending on the conversation. This helps Friday generate more accurate drafts.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday decodes emojis in guest messages and interprets their meaning in context.')}</p>
        <p className="leading-relaxed">{hl('A 👍 might mean "yes" or "thanks" depending on the conversation — Friday understands this and responds appropriately.')}</p>
      </div>
    ),
  },
  {
    id: 'property-anti-hallucination',
    title: 'Property name accuracy',
    group: '✨ AI & Drafts',
    keywords: ['property', 'name', 'hallucination', 'anti', 'accurate', 'correct'],
    content: 'Friday uses verified property names from Guesty and never invents or guesses property names. If a property name cannot be confirmed, Friday omits it rather than risk using a wrong name.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday uses verified property names from Guesty and never invents or guesses names.')}</p>
        <p className="leading-relaxed">{hl('If a name can\'t be confirmed, Friday omits it rather than risk using a wrong one.')}</p>
      </div>
    ),
  },

  // ── 3. Communication ───────────────────────────────────────────────────
  {
    id: 'smart-channel',
    title: 'Smart channel dropdown',
    group: '📡 Communication',
    keywords: ['channel', 'smart', 'dropdown', 'airbnb', 'booking', 'whatsapp', 'email', 'select', 'auto'],
    content: 'The channel dropdown intelligently detects and pre-selects the correct communication channel based on the guest conversation. Supported: Airbnb, Booking.com, WhatsApp, Email. You can override it manually if needed.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The channel dropdown auto-detects the correct platform for each conversation:')}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {['Airbnb', 'Booking.com', 'WhatsApp', 'Email'].map(ch => (
            <span key={ch} className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{ch}</span>
          ))}
        </div>
        <p className="leading-relaxed mt-2">{hl('You can override the selection manually if needed.')}</p>
      </div>
    ),
  },
  {
    id: 'whatsapp-24h',
    title: 'WhatsApp 24-hour window',
    group: '📡 Communication',
    keywords: ['whatsapp', '24h', 'window', 'template', 'expired', 'guard', 'send'],
    content: 'WhatsApp has a 24-hour messaging window — you can only send free-form messages within 24 hours of the guest\'s last message. After that, you must use an approved WhatsApp template. The UI shows a timer and blocks free-form sends when the window has expired.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('WhatsApp allows free-form messages only within 24 hours of the guest\'s last message.')}</p>
        <div className="rounded-md p-2.5 mt-1" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)'}}>
          <span style={{color: '#fbbf24', fontWeight: 500}}>After 24h:</span>
          <span style={{color: '#94a3b8'}}> {hl('You must use an approved WhatsApp template instead. The UI shows a timer and blocks free-form sends when expired.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'whatsapp-templates',
    title: 'WhatsApp template sending',
    group: '📡 Communication',
    keywords: ['whatsapp', 'template', 'approved', 'send', 'message'],
    content: 'When the WhatsApp 24h window has expired, select from approved templates to re-engage the guest. Templates are pre-approved by WhatsApp and cannot be edited. Choose the template that best fits your situation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When the 24h window has expired, use approved templates to re-engage the guest:')}</p>
        <div className="space-y-1">
          <div>• {hl('Templates are pre-approved by WhatsApp')}</div>
          <div>• {hl('Cannot be edited — choose the one that best fits')}</div>
          <div>• {hl('Once the guest replies, the 24h window reopens')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'auto-translation',
    title: 'Auto-translation',
    group: '📡 Communication',
    keywords: ['translate', 'translation', 'auto', 'language', 'english', 'inbound', 'foreign'],
    content: 'Non-English inbound messages are automatically translated to English so your team can understand them. Friday also drafts replies in the guest\'s language when appropriate. You can ask Friday to translate or provide an English version alongside.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Non-English inbound messages are automatically translated to English for your team.')}</p>
        <div className="space-y-1">
          <div>• {hl('Friday drafts replies in the guest\'s language when appropriate')}</div>
          <div>• {hl('Ask Friday: "Translate this" or "Give me an English version"')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'rtl-cjk',
    title: 'RTL & CJK language support',
    group: '📡 Communication',
    keywords: ['rtl', 'right-to-left', 'arabic', 'hebrew', 'cjk', 'chinese', 'japanese', 'korean'],
    content: 'Messages in right-to-left languages (Arabic, Hebrew) and CJK scripts (Chinese, Japanese, Korean) are properly displayed and handled. Friday can draft responses in these languages.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Full support for right-to-left languages (Arabic, Hebrew) and CJK scripts (Chinese, Japanese, Korean).')}</p>
        <p className="leading-relaxed">{hl('Messages display correctly and Friday can draft responses in these languages.')}</p>
      </div>
    ),
  },
  {
    id: 'media-attachments',
    title: 'Media attachments',
    group: '📡 Communication',
    keywords: ['media', 'attachment', 'photo', 'image', 'file', 'upload', 'send'],
    content: 'Guest media attachments (photos, files) are displayed inline in the conversation. Friday considers attached images when generating drafts — for example, a photo of a maintenance issue helps Friday understand what happened.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Guest media attachments (photos, files) display inline in the conversation.')}</p>
        <p className="leading-relaxed">{hl('Friday considers attached images when generating drafts — a photo of an issue helps it understand the situation.')}</p>
      </div>
    ),
  },
  {
    id: 'reaction-detection',
    title: 'Reaction detection',
    group: '📡 Communication',
    keywords: ['reaction', 'detect', 'like', 'heart', 'acknowledge'],
    content: 'Friday detects message reactions (likes, hearts, etc.) and understands they may serve as acknowledgment. This prevents unnecessary follow-up drafts when a guest reacts instead of typing a reply.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday detects message reactions (likes, hearts) and understands they may serve as acknowledgment.')}</p>
        <p className="leading-relaxed">{hl('This prevents unnecessary follow-up drafts when a guest reacts instead of typing a reply.')}</p>
      </div>
    ),
  },

  // ── 4. Analytics ───────────────────────────────────────────────────────
  {
    id: 'analytics-dashboard',
    title: 'Analytics dashboard',
    group: '📊 Analytics',
    keywords: ['analytics', 'dashboard', 'stats', 'metrics', 'chart', 'graph', 'overview'],
    content: 'The analytics dashboard shows team and individual performance metrics. Includes response times, draft approval rates, teaching usage, and conversation volumes. The layout has been refreshed for clarity with improved charts and filters.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The analytics dashboard shows team and individual performance metrics:')}</p>
        <div className="space-y-1">
          <div>• {hl('Response times and draft approval rates')}</div>
          <div>• {hl('Teaching usage and effectiveness')}</div>
          <div>• {hl('Conversation volumes by channel and status')}</div>
          <div>• {hl('Improved charts and filters for clarity')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'conversion-tracking',
    title: 'Conversion tracking',
    group: '📊 Analytics',
    keywords: ['conversion', 'tracking', 'inquiry', 'booking', 'rate', 'funnel'],
    content: 'Track inquiry-to-booking conversion rates. See which conversations turned into confirmed bookings, and analyze patterns in successful conversions across properties and channels.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Track inquiry-to-booking conversion rates:')}</p>
        <div className="space-y-1">
          <div>• {hl('See which conversations turned into confirmed bookings')}</div>
          <div>• {hl('Analyze patterns across properties and channels')}</div>
          <div>• {hl('Identify top-performing response strategies')}</div>
        </div>
      </div>
    ),
  },

  // ── 5. Operations ──────────────────────────────────────────────────────
  {
    id: 'inquiry-followup',
    title: 'Inquiry follow-up system',
    group: '⚙️ Operations',
    keywords: ['inquiry', 'follow-up', 'followup', 'escalation', '3h', '12h', '24h', '1w', 'automated'],
    content: 'Unanswered inquiries trigger automated follow-ups on an escalation schedule: 3 hours, 12 hours, 24 hours, and 1 week. Each follow-up is AI-drafted and respects platform-specific rules (e.g., WhatsApp 24h window). Follow-ups appear in your queue for review before sending.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Unanswered inquiries trigger automated follow-ups:')}</p>
        <div className="space-y-1.5">
          {[
            ['3h', 'Gentle first follow-up'],
            ['12h', 'Second check-in with more detail'],
            ['24h', 'Stronger follow-up with urgency'],
            ['1w', 'Final outreach attempt'],
          ].map(([time, desc]) => (
            <div key={time} className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{time}</span>
              <span>{hl(desc)}</span>
            </div>
          ))}
        </div>
        <p className="leading-relaxed mt-2">{hl('Follow-ups are AI-drafted, respect platform rules, and appear for your review before sending.')}</p>
      </div>
    ),
  },
  {
    id: 'active-issue-checkin',
    title: 'Active issue check-ins',
    group: '⚙️ Operations',
    keywords: ['active', 'issue', 'check-in', 'checkin', 'escalation', '1h', '2h', '4h', 'maintenance'],
    content: 'Active issues (maintenance, complaints) get automatic check-in reminders on an escalation schedule: 1 hour, 2 hours, 4 hours. Ensures no guest issue falls through the cracks.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Active issues get automatic check-in reminders:')}</p>
        <div className="space-y-1.5">
          {[
            ['1h', 'Initial check-in — is the issue resolved?'],
            ['2h', 'Follow-up if no response'],
            ['4h', 'Escalation reminder'],
          ].map(([time, desc]) => (
            <div key={time} className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(245,158,11,0.1)', color: '#fbbf24'}}>{time}</span>
              <span>{hl(desc)}</span>
            </div>
          ))}
        </div>
        <p className="leading-relaxed mt-2">{hl('Ensures no guest issue falls through the cracks.')}</p>
      </div>
    ),
  },
  {
    id: 'pending-actions',
    title: 'Pending actions & click-to-navigate',
    group: '⚙️ Operations',
    keywords: ['pending', 'action', 'click', 'navigate', 'overdue', 'tasks', 'follow'],
    content: 'Pending actions appear in the dashboard header. Click any pending action to navigate directly to the related conversation. Overdue items are highlighted in red. Review pending actions at the start of each shift.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Pending actions appear in the dashboard header:')}</p>
        <div className="space-y-1">
          <div>• {hl('Click any pending action to navigate directly to that conversation')}</div>
          <div>• <span style={{color: '#f87171'}}>{hl('Overdue items')}</span> {hl('are highlighted in red')}</div>
          <div>• {hl('Review pending actions at the start of each shift')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'guesty-fallback',
    title: 'Guesty browser fallback',
    group: '⚙️ Operations',
    keywords: ['guesty', 'playwright', 'browser', 'fallback', 'api', 'scrape'],
    content: 'When the Guesty API is unavailable, Friday falls back to a browser-based approach to fetch property and reservation data. This happens automatically — you will not notice any difference in functionality.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When the Guesty API is unavailable, Friday automatically falls back to browser-based data fetching.')}</p>
        <p className="leading-relaxed">{hl('This happens transparently — you won\'t notice any difference in functionality.')}</p>
      </div>
    ),
  },
  {
    id: 'bug-reports',
    title: 'Bug reports',
    group: '⚙️ Operations',
    keywords: ['bug', 'report', 'issue', 'feedback', 'status', 'edit', 'simplified'],
    content: 'Report issues using the bug button. Bug reports have simplified statuses: Open, In Progress, Resolved. You can edit your bug reports after submitting. Include what you were doing, what happened, and screenshots if possible.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Report issues using the 🐛 bug button:')}</p>
        <div className="space-y-1">
          <div>• {hl('Simplified statuses: Open → In Progress → Resolved')}</div>
          <div>• {hl('You can edit reports after submitting')}</div>
          <div>• {hl('Include what happened and screenshots if possible')}</div>
        </div>
      </div>
    ),
  },

  // ── 6. Knowledge & Rules ───────────────────────────────────────────────
  {
    id: 'teachings-what',
    title: 'What are teachings?',
    group: '🧠 Knowledge & Rules',
    keywords: ['teaching', 'rule', 'knowledge', 'what', 'why', 'matter', 'important'],
    content: 'Teachings are rules that tell Friday how to respond. Property-specific rules apply to one property, global rules apply to all. Good teachings lead to better drafts that need less editing.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Teachings are rules that tell Friday how to respond in specific situations:')}</p>
        <div className="space-y-1.5">
          {[
            '"Always include the WiFi password when guests ask about internet"',
            '"Check-in is at 2pm for Villa Soleil"',
            '"For maintenance issues, ask for a photo first"',
          ].map(ex => (
            <div key={ex} className="rounded px-2.5 py-1" style={{background: 'rgba(255,255,255,0.04)', fontStyle: 'italic'}}>
              {hl(ex)}
            </div>
          ))}
        </div>
        <div className="space-y-1 mt-2">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Property-specific</span> — {hl('applies to one property only')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Global</span> — {hl('applies to all properties')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'teachings-panel',
    title: 'Knowledge & Rules panel',
    group: '🧠 Knowledge & Rules',
    keywords: ['panel', 'brain', 'button', 'tabs', 'active', 'review', 'metrics', 'corrections'],
    content: 'Open with the brain button in the header. Active Rules to view, edit, pause, or revoke rules. Review Queue for AI-detected teaching candidates. Metrics for bulk analysis. Corrections for team edit history.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Open:</span> {hl('Click the 🧠 button in the header')}</div>
        <div className="space-y-1.5 mt-2">
          {[
            ['Active Rules', 'View, edit, pause, or revoke existing rules'],
            ['Review Queue', 'Approve or reject AI-detected teaching candidates'],
            ['Metrics', 'Bulk AI review via "Analyze All"'],
            ['Corrections', 'History of team corrections and revisions'],
          ].map(([tab, desc]) => (
            <div key={tab} className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{tab}</span>
              <span>{hl(desc)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ── 7. Common Scenarios ────────────────────────────────────────────────
  {
    id: 'scenario-checkin',
    title: 'Check-in / check-out questions',
    group: '📋 Common Scenarios',
    keywords: ['check-in', 'check-out', 'time', 'early', 'late', 'arrival', 'departure'],
    content: 'Friday handles these well if property info is complete. For early check-in or late check-out: check availability first, then respond.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday handles these well if property info is complete. Review to make sure times are correct.')}</p>
        <div className="rounded-md p-2.5 mt-1" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)'}}>
          <span style={{color: '#fbbf24', fontWeight: 500}}>Early/late requests:</span>
          <span style={{color: '#94a3b8'}}> {hl('Check availability first, then respond.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-escalate',
    title: 'When to escalate to Ishant',
    group: '📋 Common Scenarios',
    keywords: ['escalate', 'ishant', 'help', 'urgent', 'serious', 'manager'],
    content: 'Escalate when: refund or compensation requested, negative review threatened, safety/emergency, legal concerns, genuinely unsure after checking teachings. Tag @Ishant in Slack.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Escalate to Ishant when:')}</p>
        <div className="space-y-1">
          <div>• {hl('Refund or compensation is requested')}</div>
          <div>• {hl('Guest threatens a negative review')}</div>
          <div>• {hl('Safety or emergency situation')}</div>
          <div>• {hl('Legal or liability concerns')}</div>
          <div>• {hl('Genuinely unsure after checking teachings')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Tag @Ishant in Slack with the conversation link and a brief summary.')}</p>
      </div>
    ),
  },

  // ── 8. Tips & Best Practices ───────────────────────────────────────────
  {
    id: 'tips-review',
    title: 'Always review before sending',
    group: '💡 Tips & Best Practices',
    keywords: ['review', 'check', 'before', 'sending', 'important', 'always'],
    content: 'AI drafts are suggestions. Always read through before sending. Check names, dates, times, and property-specific details.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed" style={{color: '#e2e8f0'}}>{hl('AI drafts are suggestions, not final messages.')}</p>
        <div className="space-y-1">
          <div>• {hl('Always read through before hitting send')}</div>
          <div>• {hl('Check names, dates, times, and property-specific details')}</div>
          <div>• {hl('A quick review catches most issues')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips-concise',
    title: 'Keep responses concise',
    group: '💡 Tips & Best Practices',
    keywords: ['concise', 'short', 'brief', 'length', 'response'],
    content: '1-2 sentences for routine questions. Longer only for complex issues. Use "we" language: "We would be happy to arrange that."',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('1–2 sentences for routine questions')}</div>
          <div>• {hl('Longer only for complex issues')}</div>
          <div>• {hl('Use "we" language: "We would be happy to…"')}</div>
          <div>• {hl('Don\'t over-explain or include unnecessary pleasantries')}</div>
        </div>
      </div>
    ),
  },
]

// Group order for rendering
const GROUP_ORDER = [
  '🏠 Getting Started',
  '✨ AI & Drafts',
  '📡 Communication',
  '📊 Analytics',
  '⚙️ Operations',
  '🧠 Knowledge & Rules',
  '📋 Common Scenarios',
  '💡 Tips & Best Practices',
]

// Groups that get a divider header
const DIVIDER_GROUPS = new Set([
  '📡 Communication',
  '📊 Analytics',
  '⚙️ Operations',
  '🧠 Knowledge & Rules',
  '📋 Common Scenarios',
  '💡 Tips & Best Practices',
])

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
    <div className="fixed inset-0 z-[60] flex justify-end" data-testid="modal-help-panel" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />
      <div className="relative w-full md:w-[340px] h-full overflow-y-auto slide-in-right custom-scrollbar"
           style={{ background: 'rgba(15,25,50,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-5 pb-3" style={{ background: 'rgba(15,25,50,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-bold" style={{ color: '#f1f5f9' }}>Friday GMS Guide</div>
              <div className="text-xs" style={{ color: '#64748b' }}>v5.8 — Sprint 5 complete</div>
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
              className="w-full pl-8 pr-8 py-1.5 rounded-md text-base outline-none"
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

          {/* Footer */}
          {!isSearching && (
            <>
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

              <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Need help? Tag <span style={{ color: '#6395ff', fontWeight: 500 }}>@Ishant</span> in Slack</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>or message Friday directly</div>
              </div>

              <a href="https://slack.com/app_redirect?channel=fr-gms-feedback" target="_blank" rel="noopener noreferrer"
                 className="block w-full text-center py-2 rounded-lg text-xs mt-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                Report issue
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
