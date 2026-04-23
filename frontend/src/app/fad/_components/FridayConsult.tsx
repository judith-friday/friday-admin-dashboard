'use client';

import { useEffect, useRef, useState } from 'react';
import { useFridayChat, FridayMessage } from './FridayDrawer';
import { IconClose, IconSend, IconSparkle } from './icons';

interface Props {
  threadScope: string;
  autoPrompt?: string;
  onClose: () => void;
}

export function FridayConsult({ threadScope, autoPrompt, onClose }: Props) {
  const { msgs, submit } = useFridayChat(`Thread · ${threadScope}`);
  const [input, setInput] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!started.current && autoPrompt) {
      started.current = true;
      submit(autoPrompt);
    }
  }, [autoPrompt, submit]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      submit(input.trim());
      setInput('');
    }
  };

  return (
    <div className="friday-consult">
      <div className="friday-consult-header">
        <IconSparkle size={12} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>Friday Consult</span>
        <span className="chip" style={{ marginLeft: 6, fontSize: 10 }}>
          scope · this thread
        </span>
        <button
          className="fad-util-btn"
          onClick={onClose}
          style={{ marginLeft: 'auto', width: 24, height: 24 }}
          title="Close"
        >
          <IconClose size={12} />
        </button>
      </div>
      <div className="friday-consult-body">
        {msgs.map((m, i) => (
          <FridayMessage key={i} m={m} onNavigate={() => {}} onFollowup={submit} />
        ))}
      </div>
      <form className="friday-consult-input" onSubmit={onSubmit}>
        <input
          placeholder="Ask Friday about this thread…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn primary sm">
          <IconSend size={12} />
        </button>
      </form>
    </div>
  );
}
