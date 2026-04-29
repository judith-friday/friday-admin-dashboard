'use client';

import { useEffect, useState } from 'react';
import { IconAI, IconCheck, IconClose, IconTool } from './icons';

interface Props {
  currentModuleLabel?: string;
}

export function BugReportFab({ currentModuleLabel }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="bug-fab"
        title="Report a bug"
        onClick={() => setOpen(true)}
        aria-label="Report a bug"
      >
        <IconTool size={18} />
      </button>
      {open && (
        <BugReportModal
          currentModuleLabel={currentModuleLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

interface FridaySpec {
  title: string;
  steps: string[];
  expected: string;
  actual: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

function BugReportModal({
  currentModuleLabel,
  onClose,
}: {
  currentModuleLabel?: string;
  onClose: () => void;
}) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rephrasing, setRephrasing] = useState(false);
  const [spec, setSpec] = useState<FridaySpec | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const el = document.querySelector('.fad-app') as HTMLElement | null;
        if (!el) {
          setCapturing(false);
          return;
        }
        const canvas = await html2canvas(el, {
          backgroundColor: null,
          scale: 0.5,
          logging: false,
          useCORS: true,
        });
        if (!cancelled) {
          setScreenshot(canvas.toDataURL('image/jpeg', 0.7));
          setCapturing(false);
        }
      } catch {
        if (!cancelled) setCapturing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rephrase = () => {
    if (!description.trim()) return;
    setRephrasing(true);
    setSpec(null);
    setTimeout(() => {
      setSpec(fakeRephrase(description, title, currentModuleLabel));
      setRephrasing(false);
    }, 900);
  };

  const submit = () => {
    setSubmitted(true);
    setTimeout(onClose, 1400);
  };

  if (submitted) {
    return (
      <div className="fad-modal-overlay" onClick={onClose}>
        <div className="fad-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
          <div className="fad-modal-body" style={{ textAlign: 'center', padding: 40 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: 'var(--color-bg-success)',
                color: 'var(--color-text-success)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IconCheck size={24} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Bug filed</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              Friday logged to Settings → Bug reports
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fad-modal-overlay" onClick={onClose}>
      <div className="fad-modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="fad-modal-head">
          <IconTool size={16} />
          <div className="fad-modal-title">Report a bug</div>
          {currentModuleLabel && (
            <span className="chip" style={{ marginLeft: 8 }}>
              on {currentModuleLabel}
            </span>
          )}
          <button className="fad-util-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <IconClose />
          </button>
        </div>
        <div className="fad-modal-body">
          <div className="bug-screenshot-frame">
            {capturing && (
              <div
                style={{
                  height: 200,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Capturing screenshot…
              </div>
            )}
            {!capturing && !screenshot && (
              <div
                style={{
                  height: 200,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Screenshot unavailable · proceed without
              </div>
            )}
            {screenshot && (
              <>
                <span className="bug-screenshot-meta">{currentModuleLabel || 'current view'}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshot} alt="Page screenshot" />
              </>
            )}
          </div>
          <div className="fad-field">
            <label>Short title (optional)</label>
            <input
              placeholder="e.g. Calendar popover clips on mobile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="fad-field">
            <label>What happened?</label>
            <textarea
              rows={4}
              placeholder="Describe the issue in your own words — steps, what you expected, what happened instead. Friday will rephrase into a structured spec."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn ghost sm"
              onClick={rephrase}
              disabled={!description.trim() || rephrasing}
              style={{ opacity: !description.trim() || rephrasing ? 0.5 : 1 }}
            >
              <IconAI size={12} /> {rephrasing ? 'Rephrasing…' : 'Rephrase with Friday'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              Friday structures your report into Steps · Expected · Actual · Severity before filing.
            </span>
          </div>
          {spec && <FridaySpecCard spec={spec} />}
        </div>
        <div className="fad-modal-foot">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={submit}
            disabled={!description.trim()}
            style={{ opacity: !description.trim() ? 0.5 : 1 }}
          >
            {spec ? 'File bug with spec' : 'Submit as-is'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FridaySpecCard({ spec }: { spec: FridaySpec }) {
  return (
    <div className="bug-spec">
      <div className="bug-spec-head">
        <IconAI size={10} /> Friday structured this
      </div>
      <div className="bug-spec-field">
        <b>Title:</b> {spec.title}
      </div>
      <div className="bug-spec-field">
        <b>Steps to reproduce:</b>
        <ol style={{ margin: '4px 0 0 18px', padding: 0 }}>
          {spec.steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div className="bug-spec-field">
        <b>Expected:</b> {spec.expected}
      </div>
      <div className="bug-spec-field">
        <b>Actual:</b> {spec.actual}
      </div>
      <div className="bug-spec-field">
        <b>Severity:</b>{' '}
        <span
          className={
            'chip ' +
            (spec.severity === 'Critical' || spec.severity === 'High' ? 'warn' : 'info')
          }
        >
          {spec.severity}
        </span>
      </div>
    </div>
  );
}

function fakeRephrase(description: string, title: string, scope?: string): FridaySpec {
  const lc = description.toLowerCase();
  const inferSeverity = (): FridaySpec['severity'] => {
    if (/(crash|broken|lost data|can't|cannot|fails|error)/i.test(description)) return 'High';
    if (/(wrong|slow|unclear|missing)/i.test(description)) return 'Medium';
    return 'Low';
  };
  const sentences = description
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const steps = sentences.slice(0, 3).map((s, i) => {
    if (i === 0) return `Open ${scope || 'the affected view'}`;
    return s;
  });
  while (steps.length < 3) steps.push('Observe the behavior');
  const expected = /(should|expected|wanted)/i.test(description)
    ? sentences.find((s) => /(should|expected|wanted)/i.test(s)) ||
      'Feature should work as documented'
    : 'The action should complete without error, matching documented behavior.';
  const actual = /(but|instead|however|actually)/i.test(description)
    ? sentences.find((s) => /(but|instead|however|actually)/i.test(s)) ||
      description.slice(0, 100)
    : description.slice(0, 100);
  const derived = title?.trim() || (lc.includes('click') ? 'Click action fails' : 'Unexpected behavior');
  return {
    title: scope ? `[${scope}] ${derived}` : derived,
    steps,
    expected,
    actual,
    severity: inferSeverity(),
  };
}
