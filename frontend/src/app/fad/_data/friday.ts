// @demo:data — Friday-the-AI cards + prompts — GET /api/friday/*
// Tag: PROD-DATA-13 — see frontend/DEMO_CRUFT.md

export interface FridayStep {
  type: 'tool';
  name: string;
  args: string;
  ms: number;
}

export type FridayCard =
  | { type: 'action'; urgency: 'red' | 'amber' | 'neutral' | 'accent'; module: string; title: string; body: string; cta: string }
  | {
      type: 'tourist-tax-breakdown';
      period: string;
      rows: { label: string; value: number; negative?: boolean }[];
      total: { label: string; value: number };
      footer: string;
    }
  | {
      type: 'owner-pl';
      owner: string;
      gross: number;
      fees: number;
      net: number;
      months: { m: string; v: number; partial?: boolean }[];
    }
  | {
      type: 'checkins';
      rows: { day: string; date: string; guest: string; prop: string; flag?: string }[];
    }
  | {
      type: 'draft-reply';
      channel: string;
      guest: string;
      body: string;
      honors: string[];
    }
  | { type: 'bars'; rows: { label: string; pct: number; count: number }[] };

export interface FridayReply {
  text: string;
  cards: FridayCard[];
  followups: string[];
}

export interface FridayScript {
  match: (q: string) => boolean;
  steps: FridayStep[];
  reply: FridayReply;
}

export const FRIDAY_SCRIPTS: FridayScript[] = [];

export const DEFAULT_REPLY: { steps: FridayStep[]; reply: FridayReply } = {
  steps: [{ type: 'tool', name: 'search.modules', args: 'scanning all', ms: 300 }],
  reply: {
    text: 'This demo ships with scripted responses — try one of the suggestions below to see Friday tool-call through Inbox, Finance, Calendar or Intelligence.',
    cards: [],
    followups: [
      'What needs my attention today?',
      'How much tourist tax do we owe?',
      "Who's checking in this week?",
    ],
  },
};

export function pickScript(q: string) {
  return FRIDAY_SCRIPTS.find((s) => s.match(q)) || DEFAULT_REPLY;
}

export const FRIDAY_PROMPTS_HOME: Array<{ cat: string; prompts: string[] }> = [];
