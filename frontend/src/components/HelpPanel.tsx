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
    content: 'Friday GMS (Guest Messaging System) is where you manage all guest conversations across Airbnb, Booking.com, WhatsApp, and Email. Friday — your AI assistant — reads incoming messages, drafts replies, and learns from your corrections to get better over time. Think of it as your team inbox with a very capable assistant built in.',
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
    content: 'Each conversation may show a percentage score like 85% or 50%. This is the AI confidence score — how sure Friday is about the draft. 80%+ means Friday is confident the draft is accurate. 50-79% means the draft likely needs some editing. Below 50% means Friday is uncertain — review carefully.',
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
    title: 'Navigating between conversations',
    group: '🏠 Getting Started',
    keywords: ['navigate', 'keyboard', 'up', 'down', 'enter', 'escape', 'shortcut', 'arrow'],
    content: 'Click any conversation in the sidebar to open it. Use arrow keys up and down to move between conversations. Press Enter to open. Press Escape to deselect. Press slash to jump to Ask Friday.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Click any conversation in the sidebar to open it. Or use keyboard shortcuts:')}</p>
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

  // ── 2. AI Drafts ────────────────────────────────────────────────────────
  {
    id: 'what-are-drafts',
    title: 'What are AI drafts?',
    group: '✨ AI Drafts',
    keywords: ['draft', 'ai', 'generated', 'automatic', 'reply', 'response', 'how'],
    content: 'When a guest sends a message, Friday automatically reads it and writes a draft reply. The draft appears in the compose area below the conversation. Drafts are suggestions — they are never sent automatically. You always review and approve before anything goes to the guest.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When a guest sends a message, Friday automatically reads it and writes a draft reply. The draft appears in the compose area below the conversation.')}</p>
        <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
          <span style={{color: '#e2e8f0'}}>{hl('Drafts are suggestions — they are never sent automatically. You always review and approve before anything goes to the guest.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'review-draft',
    title: 'How to review a draft',
    group: '✨ AI Drafts',
    keywords: ['review', 'approve', 'send', 'edit', 'reject', 'revise', 'draft', 'action'],
    content: 'When you see a draft you have three options. Approve and Send — if the draft looks good, hit send. Edit — click into the draft text and make changes, then send. Ask Friday — if you want Friday to revise the draft, open Ask Friday and describe what you want changed.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When you see a draft, you have three options:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Approve & Send</span> — {hl('the draft looks good, hit send (or ⌘ Enter)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Edit</span> — {hl('click into the draft text, make your changes, then send')}</div>
          <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Ask Friday</span> — {hl('open Ask Friday and describe what you want changed ("make it warmer", "add check-in time")')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'needs-review',
    title: '"Needs Review" — what it means',
    group: '✨ AI Drafts',
    keywords: ['needs', 'review', 'flag', 'low', 'confidence', 'attention', 'careful'],
    content: 'When a draft is marked Needs Review it means Friday is less confident about it. This happens when the guest question is complex, touches multiple topics, or Friday does not have a clear rule for it. Give these drafts extra attention — they may need more editing.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('"Needs Review" means Friday is less confident about this draft. This happens when:')}</p>
        <div className="space-y-1">
          <div>• {hl('The guest question is complex or touches multiple topics')}</div>
          <div>• {hl('Friday doesn\'t have a clear rule or teaching for this situation')}</div>
          <div>• {hl('The property info is incomplete')}</div>
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#fbbf24'}}>{hl('Give these drafts extra attention — they usually need more editing.')}</p>
      </div>
    ),
  },
  {
    id: 'no-draft',
    title: 'When drafts are NOT generated',
    group: '✨ AI Drafts',
    keywords: ['no', 'draft', 'missing', 'ended', 'stale', 'old', 'not', 'generated', 'why'],
    content: 'Friday does not generate drafts for ended or resolved conversations. Very old or stale conversations also do not get new drafts. If the last message was from your team (not the guest) no new draft is needed. In these cases use Compose to write from scratch or Ask Friday for help.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday skips draft generation when:')}</p>
        <div className="space-y-1">
          <div>• {hl('The conversation is ended or resolved')}</div>
          <div>• {hl('The conversation has been stale for too long')}</div>
          <div>• {hl('The last message was from your team (not the guest)')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('In these cases, use Compose to write from scratch or Ask Friday for help.')}</p>
      </div>
    ),
  },

  // ── 3. Ask Friday ──────────────────────────────────────────────────────
  {
    id: 'ask-friday-what',
    title: 'What Ask Friday does',
    group: '💬 Ask Friday',
    keywords: ['ask', 'friday', 'assistant', 'chat', 'ai', 'help', 'what', 'does'],
    content: 'Ask Friday is your AI assistant for everything related to guest communication. You can ask it to write a message from scratch, revise a draft, check property rules, or just ask a question about how to handle a situation. Friday has access to all property info, teachings, and the conversation history.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Ask Friday is your AI assistant for everything related to guest communication. You can ask it to:')}</p>
        <div className="space-y-1">
          <div>• {hl('Write a message from scratch')}</div>
          <div>• {hl('Revise or improve a draft')}</div>
          <div>• {hl('Check property rules and policies')}</div>
          <div>• {hl('Get advice on how to handle a situation')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Friday has access to all property info, teachings, and the full conversation history.')}</p>
      </div>
    ),
  },
  {
    id: 'ask-friday-chips',
    title: 'Quick action chips',
    group: '💬 Ask Friday',
    keywords: ['chip', 'button', 'quick', 'action', 'write', 'polish', 'shorter', 'check', 'rules'],
    content: 'When you open Ask Friday you will see quick action chips. "Write it for me" asks Friday to draft a full response. "Polish" cleans up grammar and tone. "Shorter" makes the draft more concise. "Check rules" asks Friday to verify the draft against property rules and teachings.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Quick action chips appear when you open Ask Friday:')}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {['Write it for me', 'Polish', 'Shorter', 'Check rules'].map(chip => (
            <span key={chip} className="px-2.5 py-1 rounded-full text-xs" style={{background: 'rgba(99,149,255,0.12)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>{chip}</span>
          ))}
        </div>
        <div className="space-y-1 mt-2">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Write it for me</span> — {hl('Friday drafts a full response based on the conversation')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Polish</span> — {hl('cleans up grammar, spelling, and tone')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Shorter</span> — {hl('makes the message more concise')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Check rules</span> — {hl('verifies the draft against property rules and teachings')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'ask-friday-revise',
    title: 'Revising drafts with Friday',
    group: '💬 Ask Friday',
    keywords: ['revise', 'change', 'edit', 'rewrite', 'tone', 'warmer', 'formal', 'draft', 'modify'],
    content: 'To revise a draft just describe what you want changed in Ask Friday. For example: "Make it warmer" or "Add the check-in time" or "Remove the part about parking". Friday will update the draft directly in the compose editor — you will not see it in the chat window.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Just describe what you want changed in plain language:')}</p>
        <div className="space-y-1.5">
          {['"Make it warmer and more friendly"', '"Add the check-in time"', '"Remove the part about parking"', '"Translate to French"'].map(ex => (
            <div key={ex} className="rounded px-2.5 py-1" style={{background: 'rgba(255,255,255,0.04)', fontStyle: 'italic'}}>
              {hl(ex)}
            </div>
          ))}
        </div>
        <p className="leading-relaxed mt-2">{hl('Friday updates the draft directly in the compose editor — you won\'t see it in the chat window.')}</p>
      </div>
    ),
  },
  {
    id: 'ask-friday-learning',
    title: 'When Friday asks "Should I learn this?"',
    group: '💬 Ask Friday',
    keywords: ['learn', 'teaching', 'detect', 'should', 'remember', 'correction', 'improve'],
    content: 'When you correct a draft or give Friday specific instructions, it may detect a pattern and ask "Should I learn this?". If you say yes, Friday creates a new teaching rule so it handles similar situations the same way next time. This is how Friday gets smarter over time — your corrections directly improve future drafts for the whole team.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When you correct a draft or give Friday specific instructions, it may detect a pattern and ask "Should I learn this?"')}</p>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Say yes</span> — {hl('Friday creates a new teaching rule for similar situations')}</div>
          <div>• <span style={{fontWeight: 500, color: '#94a3b8'}}>Say no</span> — {hl('it was a one-off correction, no rule needed')}</div>
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#e2e8f0'}}>{hl('This is how Friday gets smarter — your corrections directly improve future drafts for the whole team.')}</p>
      </div>
    ),
  },
  {
    id: 'ask-friday-new-convo',
    title: 'Starting a new Friday conversation',
    group: '💬 Ask Friday',
    keywords: ['new', 'conversation', 'reset', 'clear', 'fresh', 'start', 'button'],
    content: 'Use the new conversation button (↻) to start fresh with Friday. Do this when you are switching to a different topic or when Friday seems confused by a long chat history. The conversation history is saved — you can scroll back to see earlier exchanges.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-sm" style={{background: 'rgba(255,255,255,0.08)'}}>↻</span>
          <span className="leading-relaxed">{hl('Use the "New conversation" button to start fresh with Friday.')}</span>
        </div>
        <p className="leading-relaxed mt-1">{hl('Do this when you are switching topics or when Friday seems confused by a long chat history. Your conversation history is saved — scroll back to see earlier exchanges.')}</p>
      </div>
    ),
  },

  // ── 4. Compose ──────────────────────────────────────────────────────────
  {
    id: 'compose-from-scratch',
    title: 'Composing a message from scratch',
    group: '✍️ Compose',
    keywords: ['compose', 'write', 'new', 'message', 'scratch', 'editor', 'type'],
    content: 'To write a message without starting from an AI draft, click into the compose area and start typing. This is useful when you want full control over the message, or when Friday did not generate a draft for this conversation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Click into the compose area and start typing. This is useful when:')}</p>
        <div className="space-y-1">
          <div>• {hl('You want full control over the message')}</div>
          <div>• {hl('Friday didn\'t generate a draft for this conversation')}</div>
          <div>• {hl('You\'re following up on a previous message')}</div>
          <div>• {hl('The situation needs a very personal touch')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'compose-fix',
    title: 'Using the Fix button',
    group: '✍️ Compose',
    keywords: ['fix', 'grammar', 'tone', 'spelling', 'proofread', 'clean', 'button'],
    content: 'The Fix button cleans up your message — it corrects grammar, spelling, and adjusts tone to be professional and friendly. Use it after writing or editing a message. It is quick and does not change the meaning, just polishes the language.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The Fix button cleans up your message — corrects grammar, spelling, and adjusts tone to be professional and friendly.')}</p>
        <p className="leading-relaxed">{hl('Use it after writing or editing a message. It\'s quick and doesn\'t change the meaning, just polishes the language.')}</p>
      </div>
    ),
  },
  {
    id: 'compose-channels',
    title: 'Channel selection',
    group: '✍️ Compose',
    keywords: ['channel', 'airbnb', 'booking', 'whatsapp', 'email', 'select', 'platform', 'send'],
    content: 'Before sending, check the channel. It is auto-detected from the guest conversation but you can change it. Airbnb, Booking.com, WhatsApp, and Email are supported. The channel determines where the guest receives your reply.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Before sending, check the channel — it\'s auto-detected but you can change it:')}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {['Airbnb', 'Booking.com', 'WhatsApp', 'Email'].map(ch => (
            <span key={ch} className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{ch}</span>
          ))}
        </div>
        <p className="leading-relaxed mt-2">{hl('The channel determines where the guest receives your reply.')}</p>
      </div>
    ),
  },
  {
    id: 'compose-vs-draft',
    title: 'Compose vs editing a draft',
    group: '✍️ Compose',
    keywords: ['compose', 'vs', 'draft', 'difference', 'when', 'use', 'choose'],
    content: 'Edit an AI draft when Friday got it mostly right — just tweak what needs changing. Compose from scratch when the draft is way off, when there is no draft, or when you need to say something specific that Friday would not know. Ask Friday for help in either case.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-2">
          <div>
            <span style={{fontWeight: 500, color: '#6395ff'}}>Edit the draft</span>
            <span> — {hl('when Friday got it mostly right, just tweak what needs changing')}</span>
          </div>
          <div>
            <span style={{fontWeight: 500, color: '#fbbf24'}}>Compose from scratch</span>
            <span> — {hl('when the draft is way off, there\'s no draft, or you need something very specific')}</span>
          </div>
        </div>
        <p className="leading-relaxed mt-2">{hl('You can Ask Friday for help in either case.')}</p>
      </div>
    ),
  },

  // ── 5. Knowledge & Rules ────────────────────────────────────────────────
  {
    id: 'teachings-what',
    title: 'What are teachings?',
    group: '🧠 Knowledge & Rules',
    keywords: ['teaching', 'rule', 'knowledge', 'what', 'why', 'matter', 'important'],
    content: 'Teachings are rules that tell Friday how to respond in specific situations. For example: "Always include the WiFi password when guests ask about internet" or "Check-in is at 2pm for Villa Soleil". Friday uses these rules when generating drafts, so good teachings lead to better, more accurate drafts that need less editing.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Teachings are rules that tell Friday how to respond in specific situations. For example:')}</p>
        <div className="space-y-1.5">
          {[
            '"Always include the WiFi password when guests ask about internet"',
            '"Check-in is at 2pm for Villa Soleil"',
            '"For maintenance issues, ask for a photo and notify the property manager"',
          ].map(ex => (
            <div key={ex} className="rounded px-2.5 py-1" style={{background: 'rgba(255,255,255,0.04)', fontStyle: 'italic'}}>
              {hl(ex)}
            </div>
          ))}
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#e2e8f0'}}>{hl('Good teachings = better drafts = less editing for you.')}</p>
      </div>
    ),
  },
  {
    id: 'teachings-panel',
    title: 'The Knowledge & Rules panel',
    group: '🧠 Knowledge & Rules',
    keywords: ['panel', 'brain', 'button', 'header', 'tabs', 'active', 'review', 'metrics', 'corrections', 'open'],
    content: 'Open the Knowledge and Rules panel by clicking the brain button in the header. It has 4 tabs: Active Rules shows current rules you can edit pause or revoke. Review Queue shows AI-detected teaching candidates waiting for approval. Metrics shows bulk analysis. Corrections shows history of team edits.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Open:</span> {hl('Click the 🧠 button in the header')}</div>
        <div className="space-y-1.5 mt-2">
          <p className="font-semibold" style={{color: '#e2e8f0'}}>4 tabs:</p>
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
  {
    id: 'teachings-created',
    title: 'How teachings are created',
    group: '🧠 Knowledge & Rules',
    keywords: ['create', 'new', 'teaching', 'how', 'add', 'learn', 'detection', 'manual'],
    content: 'Teachings come from two sources. Automatic: when you correct a draft or give Friday instructions, it may detect a pattern and suggest a new rule. Manual: you can add rules directly from the Active Rules tab in the Teaching Panel. Both types work the same way once active.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Teachings come from two sources:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Automatic</span> — {hl('when you correct a draft or give Friday instructions, it may detect a pattern and suggest a new rule')}</div>
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Manual</span> — {hl('add rules directly from the Active Rules tab in the Teaching Panel')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Both types work the same way once active.')}</p>
      </div>
    ),
  },
  {
    id: 'teachings-scope',
    title: 'Property-specific vs global rules',
    group: '🧠 Knowledge & Rules',
    keywords: ['property', 'specific', 'global', 'scope', 'all', 'villa', 'apartment'],
    content: 'Rules can be property-specific (only apply to one property like Villa Soleil) or global (apply to all properties). Property-specific rules are great for unique details like WiFi passwords, check-in codes, or house rules. Global rules cover general guidelines like tone of voice, response times, or escalation procedures.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Property-specific</span> — {hl('only applies to one property (e.g., WiFi password for Villa Soleil, house rules for a specific apartment)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Global</span> — {hl('applies to all properties (e.g., tone of voice, escalation procedures, general policies)')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'teachings-manage',
    title: 'Editing, pausing, or removing a teaching',
    group: '🧠 Knowledge & Rules',
    keywords: ['edit', 'pause', 'resume', 'revoke', 'remove', 'delete', 'manage', 'teaching', 'rule'],
    content: 'From the Active Rules tab you can edit a rule to update its content, pause a rule to temporarily disable it without deleting, resume a paused rule, or revoke a rule to remove it permanently. If you are unsure about a rule pause it first to see if drafts improve without it.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('From the Active Rules tab:')}</p>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Edit</span> — {hl('update the rule content')}</div>
          <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Pause</span> — {hl('temporarily disable without deleting')}</div>
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Resume</span> — {hl('reactivate a paused rule')}</div>
          <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Revoke</span> — {hl('remove permanently')}</div>
        </div>
        <p className="leading-relaxed mt-2" style={{color: '#94a3b8'}}>{hl('Unsure about a rule? Pause it first to see if drafts improve without it.')}</p>
      </div>
    ),
  },

  // ── 6. Common Scenarios ─────────────────────────────────────────────────
  {
    id: 'scenario-checkin',
    title: 'Guest asks about check-in/check-out',
    group: '📋 Common Scenarios',
    keywords: ['check-in', 'check-out', 'time', 'early', 'late', 'arrival', 'departure', 'scenario'],
    content: 'Friday usually handles check-in and check-out time questions well if the property info is complete. Review the draft to make sure the times are correct for that specific property. For early check-in or late check-out requests: check availability first, then respond. If unsure, tell the guest you will check and confirm shortly.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday usually handles these well if the property info is complete. Review the draft to make sure times are correct for the specific property.')}</p>
        <div className="rounded-md p-2.5 mt-1" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)'}}>
          <span style={{color: '#fbbf24', fontWeight: 500}}>Early check-in / late check-out:</span>
          <span style={{color: '#94a3b8'}}> {hl('Check availability first, then respond. If unsure, tell the guest you\'ll check and confirm shortly.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-maintenance',
    title: 'Guest reports a maintenance issue',
    group: '📋 Common Scenarios',
    keywords: ['maintenance', 'issue', 'broken', 'repair', 'fix', 'problem', 'report', 'photo'],
    content: 'Ask the guest for a photo if they have not sent one. Acknowledge the issue and let them know you are on it. Escalate to Ishant for urgent issues like no water, no electricity, or safety concerns. For minor issues, note the action and follow up.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>1. {hl('Ask the guest for a photo if they haven\'t sent one')}</div>
          <div>2. {hl('Acknowledge the issue and let them know you\'re on it')}</div>
          <div>3. {hl('Escalate to Ishant for urgent issues (no water, no electricity, safety)')}</div>
          <div>4. {hl('For minor issues, note the action and follow up')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-complaints',
    title: 'Handling guest complaints',
    group: '📋 Common Scenarios',
    keywords: ['complaint', 'upset', 'angry', 'unhappy', 'empathy', 'apologize', 'resolve'],
    content: 'Lead with empathy. Acknowledge their frustration. Never be defensive. Use "we" language: "We apologize" not "I am sorry". Offer a concrete next step. For serious complaints (refund requests, threats of negative reviews) escalate to Ishant before responding.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('Lead with empathy — acknowledge their frustration')}</div>
          <div>• {hl('Never be defensive')}</div>
          <div>• {hl('Use "we" language: "We apologize" not "I\'m sorry"')}</div>
          <div>• {hl('Offer a concrete next step')}</div>
        </div>
        <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)'}}>
          <span style={{color: '#f87171', fontWeight: 500}}>Escalate to Ishant</span>
          <span style={{color: '#94a3b8'}}> {hl('for refund requests, threats of negative reviews, or safety concerns.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-booking',
    title: 'Booking inquiries from new leads',
    group: '📋 Common Scenarios',
    keywords: ['booking', 'inquiry', 'new', 'lead', 'availability', 'price', 'rate', 'reserve'],
    content: 'Be responsive — new leads expect quick replies. Confirm availability and share the rate. Keep it warm and inviting. Mention property highlights. If the rate or availability is unclear, check Guesty first, then respond.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('Be responsive — new leads expect quick replies')}</div>
          <div>• {hl('Confirm availability and share the rate')}</div>
          <div>• {hl('Keep it warm and inviting — mention property highlights')}</div>
          <div>• {hl('If rate or availability is unclear, check Guesty first')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-activities',
    title: 'Guest asks about activities/tours',
    group: '📋 Common Scenarios',
    keywords: ['activities', 'tours', 'attractions', 'mauritius', 'things', 'do', 'recommend'],
    content: 'Direct guests to Mauritius Attractions for tours and activities. We have a partnership with them. Share their contact details or offer to connect them. For restaurant recommendations, check the property guide if available.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('Direct guests to Mauritius Attractions for tours and activities')}</div>
          <div>• {hl('We have a partnership with them — share their contact or offer to connect')}</div>
          <div>• {hl('For restaurant recommendations, check the property guide if available')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'scenario-languages',
    title: 'Messages in different languages',
    group: '📋 Common Scenarios',
    keywords: ['language', 'french', 'german', 'translate', 'translation', 'foreign', 'multilingual'],
    content: 'Friday can understand and reply in multiple languages. If the guest writes in French or German, Friday will typically draft a response in that language. Review carefully if you do not speak the language — you can ask Friday to translate or to provide an English version alongside.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday understands and replies in multiple languages. If a guest writes in French or German, Friday will typically draft in that language.')}</p>
        <p className="leading-relaxed">{hl('If you don\'t speak the language, ask Friday: "Translate this to English" or "Give me an English version alongside."')}</p>
      </div>
    ),
  },
  {
    id: 'scenario-escalate',
    title: 'When to escalate to Ishant',
    group: '📋 Common Scenarios',
    keywords: ['escalate', 'ishant', 'help', 'urgent', 'serious', 'manager', 'supervisor'],
    content: 'Escalate to Ishant when: refund or compensation is requested, guest threatens a negative review, safety or emergency situation, legal or liability concerns, you are genuinely unsure how to proceed after checking teachings. Tag @Ishant in Slack with the conversation link and a brief summary.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Escalate to Ishant when:')}</p>
        <div className="space-y-1">
          <div>• {hl('Refund or compensation is requested')}</div>
          <div>• {hl('Guest threatens a negative review')}</div>
          <div>• {hl('Safety or emergency situation')}</div>
          <div>• {hl('Legal or liability concerns')}</div>
          <div>• {hl('You\'re genuinely unsure after checking teachings')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Tag @Ishant in Slack with the conversation link and a brief summary.')}</p>
      </div>
    ),
  },

  // ── 7. Tips & Best Practices ────────────────────────────────────────────
  {
    id: 'tips-review',
    title: 'Always review before sending',
    group: '💡 Tips & Best Practices',
    keywords: ['review', 'check', 'before', 'sending', 'important', 'always', 'verify'],
    content: 'AI drafts are suggestions, not final messages. Always read through before hitting send. Check names, dates, times, and property-specific details. A quick review catches most issues and takes just a few seconds.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed" style={{color: '#e2e8f0'}}>{hl('AI drafts are suggestions, not final messages.')}</p>
        <div className="space-y-1">
          <div>• {hl('Always read through before hitting send')}</div>
          <div>• {hl('Check names, dates, times, and property-specific details')}</div>
          <div>• {hl('A quick review catches most issues and takes just a few seconds')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips-ask-friday',
    title: 'Use Ask Friday when unsure',
    group: '💡 Tips & Best Practices',
    keywords: ['unsure', 'ask', 'friday', 'help', 'question', 'advice', 'guidance'],
    content: 'If you are not sure how to handle something, ask Friday. It has access to all property info and teachings. Even if it cannot give a perfect answer, it can point you in the right direction or surface relevant rules.',
    render: (hl) => (
      <div className="text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Not sure how to handle something? Ask Friday. It has access to all property info and teachings. Even if it can\'t give a perfect answer, it can point you in the right direction or surface relevant rules.')}</p>
      </div>
    ),
  },
  {
    id: 'tips-concise',
    title: 'Keep responses concise',
    group: '💡 Tips & Best Practices',
    keywords: ['concise', 'short', 'brief', 'length', 'sentences', 'response'],
    content: 'One to two sentences for routine questions. Longer only for complex issues. Guests appreciate quick, clear answers. Do not over-explain or include unnecessary pleasantries.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('1–2 sentences for routine questions')}</div>
          <div>• {hl('Longer only for complex issues')}</div>
          <div>• {hl('Guests appreciate quick, clear answers')}</div>
          <div>• {hl('Don\'t over-explain or include unnecessary pleasantries')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips-we-language',
    title: 'Use "we" language',
    group: '💡 Tips & Best Practices',
    keywords: ['we', 'language', 'tone', 'voice', 'team', 'professional', 'friendly'],
    content: 'Always say "we" not "I". "We would be happy to arrange that" not "I will arrange that". This keeps communication consistent and professional, regardless of who is responding.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>✓</span>
            <span style={{fontStyle: 'italic'}}>{hl('"We would be happy to arrange that"')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>✗</span>
            <span style={{fontStyle: 'italic'}}>{hl('"I will arrange that"')}</span>
          </div>
        </div>
        <p className="leading-relaxed mt-1">{hl('Keeps communication consistent and professional, regardless of who responds.')}</p>
      </div>
    ),
  },
  {
    id: 'tips-pending',
    title: 'Check pending actions daily',
    group: '💡 Tips & Best Practices',
    keywords: ['pending', 'actions', 'daily', 'overdue', 'check', 'tasks', 'follow'],
    content: 'Review pending actions at the start of each shift. Overdue items appear in red and need immediate attention. Mark items as Done when completed so the team knows. This keeps things from falling through the cracks.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• {hl('Review pending actions at the start of each shift')}</div>
          <div>• <span style={{color: '#f87171'}}>{hl('Overdue items (in red)')}</span> {hl('need immediate attention')}</div>
          <div>• {hl('Mark items as Done when completed so the team knows')}</div>
          <div>• {hl('This keeps things from falling through the cracks')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips-bug',
    title: 'Reporting issues',
    group: '💡 Tips & Best Practices',
    keywords: ['bug', 'report', 'issue', 'problem', 'feedback', 'broken', 'not working'],
    content: 'If something is not working right, use the bug button or report in the Slack feedback channel. Include what you were doing, what happened, and what you expected. Screenshots are super helpful. The more detail, the faster the fix.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('If something\'s not working right, use the 🐛 bug button or report in the Slack feedback channel.')}</p>
        <div className="space-y-1">
          <div>• {hl('What you were doing')}</div>
          <div>• {hl('What happened vs what you expected')}</div>
          <div>• {hl('Screenshots are super helpful')}</div>
        </div>
      </div>
    ),
  },
]

// Group order for rendering
const GROUP_ORDER = [
  '🏠 Getting Started',
  '✨ AI Drafts',
  '💬 Ask Friday',
  '✍️ Compose',
  '🧠 Knowledge & Rules',
  '📋 Common Scenarios',
  '💡 Tips & Best Practices',
]

// Groups that get a divider header
const DIVIDER_GROUPS = new Set([
  '✍️ Compose',
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
              <div className="text-xs" style={{ color: '#64748b' }}>Everything you need to get started</div>
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
