'use client';

import { useEffect, useRef, useState } from 'react';
import type { FridayCard, FridayStep } from '../_data/friday';
import { FRIDAY_PROMPTS_HOME, pickScript } from '../_data/friday';
import { FCard } from './FridayCards';
import { IconCheck, IconClose, IconExpand, IconSend, IconSparkle } from './icons';

interface AIMessage {
  role: 'ai';
  scope: string;
  steps: FridayStep[];
  stepsDone: number;
  ready: boolean;
  text: string;
  cards: FridayCard[];
  followups: string[];
}
type UserMessage = { role: 'user'; body: string };
type Message = UserMessage | AIMessage;

export function useFridayChat(scope: string) {
  const [msgs, setMsgs] = useState<Message[]>([]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    const script = pickScript(q);
    const user: UserMessage = { role: 'user', body: q };
    const ai: AIMessage = {
      role: 'ai',
      scope,
      steps: script.steps,
      stepsDone: 0,
      ready: false,
      text: script.reply.text,
      cards: script.reply.cards,
      followups: script.reply.followups,
    };
    setMsgs((m) => [...m, user, ai]);

    let cumulative = 0;
    script.steps.forEach((s, i) => {
      cumulative += s.ms;
      setTimeout(() => {
        setMsgs((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === 'ai') copy[copy.length - 1] = { ...last, stepsDone: i + 1 };
          return copy;
        });
      }, cumulative);
    });
    setTimeout(() => {
      setMsgs((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === 'ai') copy[copy.length - 1] = { ...last, ready: true };
        return copy;
      });
    }, cumulative + 150);
  };

  return { msgs, submit };
}

function ToolStep({ step, done }: { step: FridayStep; done: boolean }) {
  return (
    <div className={'friday-step' + (done ? ' done' : ' running')}>
      <span className="friday-step-dot" />
      <span className="friday-step-name">{step.name}</span>
      <span className="friday-step-args">{step.args}</span>
      {!done && <span className="friday-step-spinner" />}
      {done && <IconCheck size={10} />}
    </div>
  );
}

export function FridayMessage({
  m,
  onNavigate,
  onFollowup,
}: {
  m: Message;
  onNavigate: (mod: string) => void;
  onFollowup: (q: string) => void;
}) {
  if (m.role === 'user') {
    return <div className="friday-msg friday-msg-user">{m.body}</div>;
  }
  return (
    <div className="friday-msg friday-msg-ai">
      <div className="friday-msg-header">
        <span className="friday-ai-badge">
          <IconSparkle size={10} /> Friday
        </span>
        {m.scope && (
          <span className="chip" style={{ fontSize: 10 }}>
            scope · {m.scope}
          </span>
        )}
      </div>
      {m.steps.length > 0 && (
        <div className="friday-steps">
          {m.steps.map((s, i) => (
            <ToolStep key={i} step={s} done={i < m.stepsDone} />
          ))}
        </div>
      )}
      {m.ready && (
        <>
          {m.text && <div className="friday-msg-text">{m.text}</div>}
          {m.cards.map((c, i) => (
            <div key={i} style={{ marginTop: 8 }}>
              <FCard card={c} onNavigate={onNavigate} />
            </div>
          ))}
          {m.followups.length > 0 && (
            <div className="friday-followups">
              {m.followups.map((f, i) => (
                <button key={i} className="friday-followup" onClick={() => onFollowup(f)}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  scope: string;
  onNavigate: (mod: string) => void;
  onExpand?: () => void;
}

export function FridayDrawer({ open, onClose, scope, onNavigate, onExpand }: Props) {
  const { msgs, submit } = useFridayChat(scope);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      submit(input.trim());
      setInput('');
    }
  };

  const handleNavigate = (mod: string) => {
    onNavigate(mod);
    onClose();
  };

  return (
    <>
      <div className={'fad-drawer-overlay' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'fad-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="fad-drawer-header">
          <IconSparkle />
          <div className="fad-drawer-title">Ask Friday</div>
          <span className="chip" style={{ marginLeft: 8 }}>
            scope · {scope}
          </span>
          <button
            className="fad-util-btn"
            style={{ marginLeft: 'auto' }}
            title="Fullscreen"
            onClick={onExpand}
          >
            <IconExpand />
          </button>
          <button className="fad-util-btn" onClick={onClose} title="Close">
            <IconClose />
          </button>
        </div>
        <div className="fad-drawer-body friday-body">
          {msgs.length === 0 && (
            <div className="friday-empty">
              <div className="friday-empty-title">Hi Ishant — ask me anything.</div>
              <div className="friday-empty-sub">
                I&apos;ll pull from Inbox, Finance, Calendar, Operations, and the module you&apos;re
                viewing.
              </div>
              <div className="friday-prompt-grid">
                {FRIDAY_PROMPTS_HOME.slice(0, 2).map((g, i) => (
                  <div key={i}>
                    <div className="friday-prompt-cat">{g.cat}</div>
                    {g.prompts.map((p, j) => (
                      <button key={j} className="friday-prompt-btn" onClick={() => submit(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <FridayMessage key={i} m={m} onNavigate={handleNavigate} onFollowup={submit} />
          ))}
          <div ref={endRef} />
        </div>
        <form className="fad-drawer-input" onSubmit={onSubmit}>
          <input
            placeholder={`Ask about ${scope.toLowerCase()}, or anything else…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus={open}
          />
          <button type="submit" className="btn primary" title="Send">
            <IconSend size={14} />
          </button>
        </form>
      </aside>
    </>
  );
}
