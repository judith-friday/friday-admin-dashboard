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

// ---------------------------------------------------------------------------
// Tier 1: Featured Essentials
// ---------------------------------------------------------------------------
interface EssentialEntry {
  id: string
  icon: string
  title: string
  brief: string
  keywords: string[]
  content: string
  render: (hl: (text: string) => React.ReactNode) => React.ReactNode
}

const ESSENTIALS_DATA: EssentialEntry[] = [
  {
    id: 'how-to-talk-to-friday',
    icon: '🗣️',
    title: 'How to Talk to Friday',
    brief: 'Get better results by collaborating with Friday instead of commanding',
    keywords: ['talk', 'collaborate', 'context', 'thinking', 'analyze', 'command', 'instruct', 'better', 'results', 'how to use', 'guide'],
    content: 'Friday works best when you collaborate with it instead of giving it direct commands. Share context, explain your thinking, and let Friday help you figure things out.',
    render: (hl) => (
      <div className="space-y-4 text-xs" style={{color: '#94a3b8'}}>
        {/* The core insight */}
        <div className="rounded-lg p-3" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.12)'}}>
          <p className="leading-relaxed" style={{color: '#e2e8f0'}}>
            {hl('Friday is your teammate, not a command line. The more context you give, the better it performs.')}
          </p>
        </div>

        {/* Bad vs Good examples */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color: '#f87171'}}>
            Instead of commanding...
          </div>
          <div className="space-y-2">
            <div className="rounded-md px-3 py-2" style={{background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)'}}>
              <span style={{color: '#f87171'}}>✕</span>{' '}
              <span style={{color: '#94a3b8'}}>{hl('"Set minimum stay to 3 nights"')}</span>
            </div>
            <div className="rounded-md px-3 py-2" style={{background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)'}}>
              <span style={{color: '#f87171'}}>✕</span>{' '}
              <span style={{color: '#94a3b8'}}>{hl('"Tell the guest we can\'t do 2 nights"')}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color: '#4ade80'}}>
            Try collaborating...
          </div>
          <div className="space-y-2">
            <div className="rounded-md px-3 py-2" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
              <span style={{color: '#4ade80'}}>✓</span>{' '}
              <span style={{color: '#e2e8f0'}}>{hl('"Rajiv is asking for 2 nights but I think we have a 3-night minimum. Can you check the property knowledge and our policies? He\'s a returning guest so I want to be welcoming but also stick to our rules."')}</span>
            </div>
            <div className="rounded-md px-3 py-2" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
              <span style={{color: '#4ade80'}}>✓</span>{' '}
              <span style={{color: '#e2e8f0'}}>{hl('"Eleanor is reporting low water pressure. I\'m not sure if this is a known issue at this property. Can you check and draft a helpful response? We might need to involve maintenance."')}</span>
            </div>
          </div>
        </div>

        {/* The 4 principles */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color: '#6395ff'}}>
            4 principles for great results
          </div>
          <div className="space-y-2">
            {[
              { label: 'Give CONTEXT', desc: 'Tell Friday what the guest wants, what you know, and any relevant history.', example: '"This is a returning guest who stayed with us last summer..."' },
              { label: 'Share THINKING', desc: 'Explain what you\'re leaning toward and why you\'re unsure.', example: '"I want to say yes but I\'m worried about the noise policy..."' },
              { label: 'Ask to ANALYZE', desc: 'Let Friday check rules, knowledge bases, and policies for you.', example: '"Can you check if we allow pets at this property?"' },
              { label: 'Let Friday STRUCTURE', desc: 'Give the facts, let Friday craft the message. It knows tone and format.', example: '"Here\'s the situation — can you write something warm but firm?"' },
            ].map(p => (
              <div key={p.label} className="rounded-md p-2.5" style={{background: 'rgba(255,255,255,0.03)'}}>
                <div className="font-medium mb-0.5" style={{color: '#e2e8f0'}}>{hl(p.label)}</div>
                <div className="leading-relaxed">{hl(p.desc)}</div>
                <div className="mt-1 italic" style={{color: '#64748b', fontSize: '11px'}}>{hl(p.example)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why it matters */}
        <div className="rounded-lg p-3" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
          <div className="font-medium mb-1" style={{color: '#4ade80', fontSize: '11px'}}>Why this works better</div>
          <div className="space-y-1 leading-relaxed">
            <div>{hl('• Friday catches things you might miss (policies, past interactions)')}</div>
            <div>{hl('• Teachings it creates from your edits are higher quality')}</div>
            <div>{hl('• Drafts need less editing — saves you time')}</div>
            <div>{hl('• The whole team benefits from better AI learning')}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'essential-ai-drafts',
    icon: '✏️',
    title: 'Understanding AI Drafts',
    brief: 'What drafts are, confidence scores, and how to review them',
    keywords: ['draft', 'ai', 'confidence', 'score', 'review', 'approve', 'edit', 'send', 'green', 'yellow', 'red'],
    content: 'When a guest sends a message, Friday drafts a reply. Drafts are never sent automatically. Review, edit, or ask Friday to revise before sending.',
    render: (hl) => (
      <div className="space-y-3 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('When a guest sends a message, Friday automatically drafts a reply. The draft appears in the compose area below the conversation.')}</p>

        <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.12)'}}>
          <span style={{color: '#e2e8f0', fontWeight: 500}}>{hl('Drafts are never sent automatically — you always review and approve first.')}</span>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Confidence scores')}</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>80%+</span>
              <span>{hl('Friday is confident — draft is likely accurate and ready')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>60–79%</span>
              <span>{hl('Draft likely needs some editing or extra info')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>&lt;60%</span>
              <span>{hl('Friday is uncertain — review carefully before sending')}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('How to review')}</div>
          <div className="space-y-1">
            <div><span style={{color: '#e2e8f0'}}>1.</span> {hl('Read the draft — does it sound right?')}</div>
            <div><span style={{color: '#e2e8f0'}}>2.</span> {hl('Check facts — names, dates, times, property details')}</div>
            <div><span style={{color: '#e2e8f0'}}>3.</span> {hl('Edit tone if needed — make it more warm, formal, or concise')}</div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Your options')}</div>
          <div className="space-y-1">
            <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Send it</span> — {hl('draft looks good, approve and send')}</div>
            <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Polish more</span> — {hl('ask Friday to refine the draft')}</div>
            <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Start over</span> — {hl('regenerate from scratch')}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'essential-teaching-friday',
    icon: '🧠',
    title: 'Teaching Friday',
    brief: 'How Friday learns from your corrections and gets smarter over time',
    keywords: ['teach', 'teaching', 'learn', 'learning', 'correct', 'correction', 'improve', 'candidate', 'accept', 'rule', 'blue', 'card'],
    content: 'When you correct a draft, Friday may detect a pattern and suggest a new teaching. Accept to help Friday learn. Teaching candidates appear as blue cards during conversations.',
    render: (hl) => (
      <div className="space-y-3 text-xs" style={{color: '#94a3b8'}}>
        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('What are teachable moments?')}</div>
          <p className="leading-relaxed">{hl('When you correct a draft or give Friday new information, it may detect a pattern and suggest a new rule. These appear as blue cards in the conversation.')}</p>
        </div>

        <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.12)'}}>
          <div className="text-xs" style={{color: '#6395ff', fontWeight: 500}}>Example teaching suggestion:</div>
          <div className="mt-1 italic" style={{color: '#e2e8f0'}}>{hl('"Always mention the WiFi password when guests ask about internet at Villa Soleil"')}</div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('What to do')}</div>
          <div className="space-y-1.5">
            <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Accept</span> — {hl('Friday learns this rule for future drafts')}</div>
            <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Refine</span> — {hl('click Accept, then edit the wording to make it more precise')}</div>
            <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Dismiss</span> — {hl('not a useful pattern, skip it')}</div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Where teachings appear')}</div>
          <div className="space-y-1">
            <div>• {hl('In-chat: blue cards after you correct a draft')}</div>
            <div>• {hl('Send modal: suggested teachings to review before sending')}</div>
            <div>• {hl('Knowledge panel: teaching candidates queued for approval')}</div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Scope')}</div>
          <div className="space-y-1">
            <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Property-specific</span> — {hl('applies only to one property (e.g., check-in time)')}</div>
            <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Global</span> — {hl('applies to all properties (e.g., tone preferences)')}</div>
          </div>
        </div>

        <div className="rounded-lg p-2.5" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
          <span style={{color: '#4ade80', fontSize: '11px'}}>Here&apos;s a tip:</span>{' '}
          <span>{hl('The more teachings you accept and refine, the faster Friday improves for your whole team.')}</span>
        </div>
      </div>
    ),
  },
  {
    id: 'essential-quick-actions',
    icon: '⚡',
    title: 'Quick Actions Explained',
    brief: 'What each action chip does and when to use it',
    keywords: ['chip', 'action', 'send', 'polish', 'start over', 'write', 'check rules', 'str kb', 'sales kb', 'quick'],
    content: 'Quick action chips give you one-tap access to common tasks. They adapt based on whether a draft exists and the conversation context.',
    render: (hl) => (
      <div className="space-y-3 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Action chips appear below the Ask Friday input. They change based on context — what you see depends on whether a draft exists and the conversation state.')}</p>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Draft actions (when a draft exists)')}</div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(34,197,94,0.12)', color: '#4ade80'}}>Send it</span>
              <span>{hl('Approve the draft and send it to the guest')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.12)', color: '#6395ff'}}>Polish more</span>
              <span>{hl('Ask Friday to refine tone, grammar, or clarity')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(245,158,11,0.12)', color: '#fbbf24'}}>Start over</span>
              <span>{hl('Discard the current draft and regenerate from scratch')}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Compose actions (no draft)')}</div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.12)', color: '#6395ff'}}>Write it for me</span>
              <span>{hl('Have Friday compose a new message from scratch')}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1.5" style={{color: '#e2e8f0'}}>{hl('Knowledge chips (always available)')}</div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(139,92,246,0.12)', color: '#a78bfa'}}>Check rules</span>
              <span>{hl('Verify the draft against property rules and teachings')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.12)', color: '#6395ff'}}>STR KB</span>
              <span>{hl('Consult the Short-Term Rental knowledge base — industry best practices')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{background: 'rgba(34,197,94,0.12)', color: '#4ade80'}}>Sales KB</span>
              <span>{hl('Consult the Sales knowledge base — pricing, negotiation, conversion tips')}</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'essential-daily-workflow',
    icon: '📋',
    title: 'Your Daily Workflow',
    brief: 'A simple 5-step routine for handling your shift',
    keywords: ['workflow', 'daily', 'routine', 'shift', 'step', 'start', 'review', 'unread', 'actions', 'status'],
    content: 'Follow this 5-step workflow to stay on top of guest conversations: check status, handle reviews, read new messages, manage actions, ask Friday for help.',
    render: (hl) => (
      <div className="space-y-3 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-2.5">
          {[
            { step: '1', title: 'Check the status bar', desc: 'Open GMS and look at the top bar — it shows your unread count and pending actions at a glance.', color: '#6395ff' },
            { step: '2', title: 'Review tab first', desc: 'Handle drafts waiting for review. These are AI drafts that need your approval before they go to guests.', color: '#f87171' },
            { step: '3', title: 'Unread tab next', desc: 'New guest messages that haven\'t been addressed yet. Friday may already have drafts ready for some.', color: '#6395ff' },
            { step: '4', title: 'Actions tab', desc: 'Pending actions, follow-ups, and next steps. Sort by urgency — CRIT and HIGH items first.', color: '#fbbf24' },
            { step: '5', title: 'Ask Friday if you need help', desc: 'Stuck on a conversation? Ask Friday to check rules, draft a response, or suggest an approach.', color: '#4ade80' },
          ].map(s => (
            <div key={s.step} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{background: `${s.color}20`, color: s.color}}>
                {s.step}
              </div>
              <div>
                <div className="font-medium" style={{color: '#e2e8f0'}}>{hl(s.title)}</div>
                <div className="leading-relaxed mt-0.5">{hl(s.desc)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg p-2.5" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
          <span style={{color: '#4ade80', fontSize: '11px'}}>Here&apos;s a tip:</span>{' '}
          <span>{hl('Start with the Review tab — those drafts are ready and just need your approval. It\'s the fastest way to clear your queue.')}</span>
        </div>
      </div>
    ),
  },
]

// ---------------------------------------------------------------------------
// Tier 2: Advanced help entries (existing 28 entries)
// ---------------------------------------------------------------------------
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
    content: 'The left sidebar shows all guest conversations. Tabs: All, Unread, Review, Open, Done, Actions. Sort by recent, oldest, or urgency. Filter by property, channel, or date range.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The left sidebar shows all guest conversations. Use the tabs at the top to filter:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>All</span> — {hl('every conversation')}</div>
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Unread</span> — {hl('new messages you haven\'t seen')}</div>
          <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Review</span> — {hl('AI draft needs your review before sending')}</div>
          <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Open</span> — {hl('active conversations needing attention')}</div>
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Done</span> — {hl('conversation is resolved')}</div>
          <div>• <span style={{fontWeight: 500, color: '#c084fc'}}>Actions</span> — {hl('conversations with pending actions')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Use the Sort button (recent, oldest, urgency) and Filters (property, channel, date range) to narrow the list. Click a conversation to open it.')}</p>
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
    id: 'intent-detection',
    title: 'Intent detection badges',
    group: '🏠 Getting Started',
    keywords: ['intent', 'badge', 'new booking', 'extension', 'followup', 'follow-up', 'green', 'blue', 'yellow', 'color', 'detect'],
    content: 'Friday detects the guest intent and shows a colored badge in the conversation header. Green "New Booking" for new inquiries, blue "Extension" for stay extensions, yellow "Follow-up" for returning guests. Intent determines which knowledge bases are available and how Friday prioritizes the conversation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday detects the guest\'s intent and shows a colored badge in the conversation header:')}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>New Booking</span>
            <span>{hl('Guest is inquiring about a new reservation')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>Extension</span>
            <span>{hl('Guest wants to extend their current stay')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>Follow-up</span>
            <span>{hl('Returning guest or ongoing negotiation')}</span>
          </div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Intent determines which knowledge bases Friday uses and how it prioritizes the conversation.')}</p>
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

  // ── 1b. Conversation View ───────────────────────────────────────────────
  {
    id: 'conversation-summary',
    title: 'Conversation summary',
    group: '🏠 Getting Started',
    keywords: ['summary', 'context', 'ai', 'overview', 'collapsible'],
    content: 'Each conversation has a collapsible AI-generated summary at the top. Click the arrow to expand it and see a synopsis of the full thread, key issues, and timeline.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Each conversation has a collapsible AI-generated summary at the top of the thread.')}</p>
        <p className="leading-relaxed">{hl('Click the arrow to expand — it shows a synopsis of the conversation, key issues, and timeline.')}</p>
      </div>
    ),
  },
  {
    id: 'staff-notes',
    title: 'Staff notes & next steps',
    group: '🏠 Getting Started',
    keywords: ['staff', 'notes', 'next', 'steps', 'right', 'panel', 'info'],
    content: 'The right panel shows Staff Notes where you can add context for the team. Below that, Next Steps shows AI-suggested actions based on the conversation. Use the Mark as Done button to close a conversation.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Staff Notes:</span> {hl('Add notes for Friday and your team. Friday reads these when drafting.')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Next Steps:</span> {hl('AI-suggested actions based on the conversation context')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Mark as Done:</span> {hl('Close the conversation when resolved')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications',
    group: '🏠 Getting Started',
    keywords: ['notification', 'bell', 'alert', 'new', 'message', 'draft', 'ready'],
    content: 'Notifications are accessible via the menu (🔔). They show new messages, draft ready alerts, and issue check-in reminders. Click a notification to jump to that conversation. Use "Mark all read" to clear the badge.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Open Notifications via the ☰ menu (or 🔔 on desktop):')}</p>
        <div className="space-y-1">
          <div>• {hl('New messages from guests')}</div>
          <div>• {hl('Draft ready alerts')}</div>
          <div>• {hl('Issue check-in reminders')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Click any notification to jump to that conversation. "Mark all read" clears the badge.')}</p>
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
    id: 'knowledge-bases',
    title: 'Knowledge bases (STR KB & Sales KB)',
    group: '✨ AI & Drafts',
    keywords: ['knowledge', 'base', 'kb', 'str', 'sales', 'chip', 'short-term', 'rental', 'booking', 'inquiry'],
    content: 'Friday has two knowledge bases available as chips in Ask Friday. STR KB (Short-Term Rental Knowledge Base) contains industry best practices, platform rules, and hospitality guidelines — available for all conversations. Sales KB contains pricing strategies, negotiation tactics, objection handling, and booking conversion tips — only available for new_booking, extension, and follow-up conversations.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Friday has two knowledge bases, available as chips in Ask Friday:')}</p>
        <div className="space-y-2 mt-2">
          <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>STR KB</span>
              <span style={{color: '#e2e8f0', fontWeight: 500, fontSize: '11px'}}>All conversations</span>
            </div>
            <div className="space-y-0.5 mt-1">
              <div>{hl('Industry best practices for short-term rentals')}</div>
              <div>{hl('Platform rules (Airbnb, Booking.com policies)')}</div>
              <div>{hl('Hospitality guidelines and guest communication tips')}</div>
            </div>
          </div>
          <div className="rounded-md p-2.5" style={{background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)'}}>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>Sales KB</span>
              <span style={{color: '#e2e8f0', fontWeight: 500, fontSize: '11px'}}>Booking/extension/follow-up only</span>
            </div>
            <div className="space-y-0.5 mt-1">
              <div>{hl('Pricing strategies and negotiation tactics')}</div>
              <div>{hl('Objection handling (price, cancellation, payment)')}</div>
              <div>{hl('Booking conversion tips and follow-up templates')}</div>
            </div>
          </div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Click a KB chip in Ask Friday to have Friday consult that knowledge base when drafting.')}</p>
      </div>
    ),
  },
  {
    id: 'compose-panel',
    title: 'Compose panel & Fix button',
    group: '✨ AI & Drafts',
    keywords: ['compose', 'fix', 'write', 'message', 'scratch', 'panel', 'polish'],
    content: 'Click the Compose button below the conversation to write a message from scratch. Use the Fix button (sparkle icon) to let Friday polish your text. Ask Friday button opens the AI assistant for help.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Click the Compose button below the conversation to write from scratch:')}</p>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Fix (✨)</span> — {hl('Friday polishes your text (grammar, tone, clarity)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#6395ff'}}>Ask Friday</span> — {hl('opens the AI assistant for help composing')}</div>
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>Send</span> — {hl('sends the message (or ⌘ Enter)')}</div>
        </div>
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
    content: 'The analytics dashboard has two tabs: Developer (system metrics, AI costs, token usage, error trends, feature usage) and Team (response times per user, messages sent, draft decisions, Ask Friday usage, sentiment trends). Includes Actionable Insights with key metrics. Open via the menu.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Open via the ☰ menu → Analytics. Two tabs:')}</p>
        <div className="space-y-1.5">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Developer:</span> {hl('Actionable Insights, AI costs, token usage trends, draft quality, error rates, feature usage')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Team:</span> {hl('Response times per user, messages sent, draft decisions, Ask Friday usage, sentiment trends')}</div>
        </div>
      </div>
    ),
  },

  // ── 5. Operations ──────────────────────────────────────────────────────
  {
    id: 'inquiry-followup',
    title: 'Inquiry follow-up & escalation system',
    group: '⚙️ Operations',
    keywords: ['inquiry', 'follow-up', 'followup', 'escalation', '3h', '12h', '24h', '1w', 'automated', 'platform', 'rules', 'risk', 'losing', 'booking'],
    content: 'Unanswered inquiries trigger automated follow-ups on an escalation schedule: 3 hours, 12 hours, 24 hours, and 1 week. Each escalation increases urgency. Platform rules are respected — WhatsApp 24h window, Airbnb response time requirements. The Actions tab shows warning alerts like "78h without response — Risk of losing booking" when inquiries are stale. Follow-ups are AI-drafted and appear for review before sending.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Unanswered inquiries trigger automated follow-ups with escalating urgency:')}</p>
        <div className="space-y-1.5">
          {[
            ['3h', 'Gentle first follow-up — MED urgency'],
            ['12h', 'Second check-in with more detail — MED urgency'],
            ['24h', 'Stronger follow-up — HIGH urgency'],
            ['1w', 'Final outreach attempt — CRIT urgency'],
          ].map(([time, desc]) => (
            <div key={time} className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{time}</span>
              <span>{hl(desc)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md p-2.5 mt-2" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)'}}>
          <span style={{color: '#fbbf24', fontWeight: 500}}>Platform rules:</span>
          <div className="space-y-0.5 mt-1">
            <div>{hl('WhatsApp: 24h messaging window respected — uses templates after expiry')}</div>
            <div>{hl('Airbnb: Response time requirements tracked to protect host metrics')}</div>
          </div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Stale inquiries show warning alerts in the Actions tab (e.g., "78h without response — Risk of losing booking"). Follow-ups are AI-drafted and appear for your review before sending.')}</p>
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
    id: 'auto-send',
    title: 'Auto-send toggle',
    group: '⚙️ Operations',
    keywords: ['auto', 'send', 'toggle', 'automatic', 'review'],
    content: 'The auto-send toggle in the right panel controls whether high-confidence drafts are sent automatically or require manual review. When off (default), all drafts require your approval.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The auto-send toggle in the right panel controls automatic sending:')}</p>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#4ade80'}}>On:</span> {hl('High-confidence drafts are sent automatically')}</div>
          <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Off (default):</span> {hl('All drafts require your review and approval')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'send-queue',
    title: 'Send Queue',
    group: '⚙️ Operations',
    keywords: ['queue', 'send', 'failed', 'retry', 'outbound', 'pending'],
    content: 'The Send Queue shows outbound messages that are queued or failed. Tabs: All, Queued, Failed. Retry failed messages or check why they failed. Open via the menu.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('The Send Queue (☰ menu → Queue) tracks outbound messages:')}</p>
        <div className="space-y-1">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Queued:</span> {hl('Messages waiting to be sent')}</div>
          <div>• <span style={{fontWeight: 500, color: '#f87171'}}>Failed:</span> {hl('Messages that failed — retry or investigate')}</div>
        </div>
      </div>
    ),
  },
  {
    id: 'pending-actions',
    title: 'Pending actions',
    group: '⚙️ Operations',
    keywords: ['pending', 'action', 'click', 'navigate', 'overdue', 'tasks', 'follow', 'urgency', 'owner', 'team', 'guest', 'deferred', 'category', 'badge'],
    content: 'Pending actions appear in the info panel and the Actions tab. Each action has an owner (team or guest), a category, and an urgency badge. Urgency levels: MED (yellow), HIGH (orange), CRIT (red). Time indicators show OVERDUE, DUE SOON, or hours remaining. Deferred follow-ups have scheduled due dates. Actions can be marked Done, Dismissed, Edited, or consulted via Ask Friday.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Pending actions appear in the info panel and the dedicated Actions tab:')}</p>
        <div className="space-y-1.5 mt-1">
          <div><span style={{fontWeight: 500, color: '#e2e8f0'}}>Urgency badges:</span></div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>MED</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(249,115,22,0.15)', color: '#f97316'}}>HIGH</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>CRIT</span>
          </div>
          <div><span style={{fontWeight: 500, color: '#e2e8f0'}}>Time indicators:</span></div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>OVERDUE</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>DUE SOON</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>3h</span>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Owner:</span> {hl('team (your responsibility) or awaiting guest (waiting on guest response)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Deferred:</span> {hl('follow-ups with scheduled due dates — appear when due')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Actions:</span> {hl('Done, Dismiss, Edit, or Ask Friday for help')}</div>
        </div>
        <p className="leading-relaxed mt-2">{hl('Review pending actions at the start of each shift. Sort by urgency to prioritize.')}</p>
      </div>
    ),
  },
  {
    id: 'bug-reports',
    title: 'Bug reports',
    group: '⚙️ Operations',
    keywords: ['bug', 'report', 'issue', 'feedback', 'status', 'edit', 'simplified'],
    content: 'Report issues using the bug button. Bug reports have statuses: New, In Progress, Fixed, Closed. A screenshot is auto-captured. Include what happened and what you expected.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p className="leading-relaxed">{hl('Report issues using the 🐛 bug button (floating on the left side):')}</p>
        <div className="space-y-1">
          <div>• {hl('A screenshot is auto-captured when you open the form')}</div>
          <div>• {hl('Statuses: New → In Progress → Fixed → Closed')}</div>
          <div>• {hl('Set severity: low, medium, high, or critical')}</div>
          <div>• {hl('View all reports via ☰ menu → Bug Reports')}</div>
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
    content: 'Open via the menu. Active Rules to view, edit, pause, or revoke rules. Auto Learnings for AI-detected rules. Metrics for bulk analysis.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Open:</span> {hl('☰ menu → Knowledge & Rules')}</div>
        <div className="space-y-1.5 mt-2">
          {[
            ['Active Rules', 'View, edit, pause, or revoke existing rules. Search, filter by scope/property/creator'],
            ['Auto Learnings', 'AI-detected teaching candidates for review'],
            ['Metrics', 'Teaching performance metrics and analysis'],
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
// EssentialCard — featured card for Tier 1
// ---------------------------------------------------------------------------
function EssentialCard({ icon, title, brief, forceOpen, children }: {
  icon: string
  title: string
  brief: string
  forceOpen?: boolean
  children: React.ReactNode
}) {
  const [userOpen, setUserOpen] = useState(false)
  const isOpen = forceOpen || userOpen
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isOpen ? 'rgba(99,149,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isOpen ? 'rgba(99,149,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <button
        onClick={() => setUserOpen(o => !o)}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</div>
          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{brief}</div>
        </div>
        <span className="text-xs flex-shrink-0 mt-1" style={{ color: '#64748b' }}>{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-0" style={{ marginLeft: '2rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const matches = useCallback((entry: { title: string; content: string; keywords: string[] }, q: string) => {
    const lower = q.toLowerCase()
    return (
      entry.title.toLowerCase().includes(lower) ||
      entry.content.toLowerCase().includes(lower) ||
      entry.keywords.some(k => k.toLowerCase().includes(lower))
    )
  }, [])

  const filteredEssentials = useMemo(() => {
    if (!search.trim()) return ESSENTIALS_DATA
    return ESSENTIALS_DATA.filter(e => matches(e, search.trim()))
  }, [search, matches])

  const filteredAdvanced = useMemo(() => {
    if (!search.trim()) return HELP_DATA
    return HELP_DATA.filter(e => matches(e, search.trim()))
  }, [search, matches])

  const hl = useCallback(
    (text: string) => highlightText(text, search.trim()),
    [search],
  )

  if (!isOpen) return null

  const isSearching = search.trim().length > 0
  const showAdvancedSection = showAdvanced || isSearching

  // Group advanced entries for rendering
  const grouped: { group: string; entries: HelpEntry[] }[] = []
  let lastGroup = ''
  for (const entry of filteredAdvanced) {
    if (entry.group !== lastGroup) {
      grouped.push({ group: entry.group, entries: [entry] })
      lastGroup = entry.group
    } else {
      grouped[grouped.length - 1].entries.push(entry)
    }
  }
  const orderedGroups = GROUP_ORDER.map(g => grouped.find(gr => gr.group === g)).filter(Boolean) as typeof grouped

  const totalResults = filteredEssentials.length + filteredAdvanced.length

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
              <div className="text-xs" style={{ color: '#64748b' }}>v5.10 — Sprint 5.2 audited</div>
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
          {/* No results */}
          {isSearching && totalResults === 0 && (
            <div className="text-center py-8">
              <div className="text-sm" style={{ color: '#64748b' }}>No results for &ldquo;{search}&rdquo;</div>
              <button onClick={() => setSearch('')} className="text-xs mt-2 underline" style={{ color: '#6395ff' }}>Clear search</button>
            </div>
          )}

          {/* ── Tier 1: Featured Essentials ─────────────────────────────── */}
          {filteredEssentials.length > 0 && (
            <div>
              {!isSearching && (
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
                  Essentials
                </div>
              )}
              <div className="space-y-2">
                {filteredEssentials.map(entry => (
                  <EssentialCard
                    key={entry.id}
                    icon={entry.icon}
                    title={entry.title}
                    brief={entry.brief}
                    forceOpen={isSearching}
                  >
                    {entry.render(hl)}
                  </EssentialCard>
                ))}
              </div>
            </div>
          )}

          {/* ── Tier 2: Advanced Topics ─────────────────────────────────── */}
          {!isSearching && filteredAdvanced.length > 0 && (
            <div>
              <button
                onClick={() => setShowAdvanced(o => !o)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs"
                style={{
                  background: showAdvanced ? 'rgba(99,149,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${showAdvanced ? 'rgba(99,149,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  color: '#94a3b8',
                }}
              >
                <span>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{showAdvanced ? 'Hide' : 'Show'} Advanced Topics</span>
                  <span className="ml-2" style={{ color: '#64748b' }}>({HELP_DATA.length} entries)</span>
                </span>
                <span style={{ color: '#64748b' }}>{showAdvanced ? '▲' : '▼'}</span>
              </button>
            </div>
          )}

          {showAdvancedSection && filteredAdvanced.length > 0 && (
            <div className="space-y-6">
              {isSearching && filteredAdvanced.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Advanced</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
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
            </div>
          )}

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
