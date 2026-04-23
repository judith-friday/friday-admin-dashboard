'use client';

import { useMemo } from 'react';
import { MODULES, GROUPS, type ModuleDef } from '../_data/modules';
import { iconFor, IconExpand, IconSparkle } from './icons';

interface Props {
  active: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  fridayFs?: boolean;
  onOpenFridayFs?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  active,
  onSelect,
  collapsed,
  fridayFs,
  onOpenFridayFs,
  mobileOpen,
  onMobileClose,
}: Props) {
  const byGroup = useMemo(() => {
    const m: Record<string, ModuleDef[]> = {};
    MODULES.forEach((mod) => {
      (m[mod.group] = m[mod.group] || []).push(mod);
    });
    return m;
  }, []);

  return (
    <>
      <div
        className={'fad-sidebar-backdrop' + (mobileOpen ? ' mobile-open' : '')}
        onClick={onMobileClose}
      />
      <aside
        className={
          'fad-sidebar' +
          (collapsed ? ' collapsed' : '') +
          (mobileOpen ? ' mobile-open' : '')
        }
      >
      <div className="fad-sidebar-inner">
        {onOpenFridayFs && (
          <>
            <button
              className="fad-friday-entry"
              onClick={() => {
                onOpenFridayFs();
                onMobileClose?.();
              }}
              title="Ask Friday — fullscreen"
              aria-pressed={fridayFs}
            >
              <span className="fad-nav-icon">
                <IconSparkle />
              </span>
              <span className="fad-friday-label">Ask Friday</span>
              <span className="fad-friday-expand" aria-hidden="true">
                <IconExpand size={12} />
              </span>
            </button>
            <div className="fad-friday-divider" />
          </>
        )}
        {GROUPS.map((g) => (
          <div className="fad-sidebar-group" key={g.id}>
            <div className="fad-sidebar-group-label">
              <span>{g.label}</span>
              {g.suffix && <span className="fad-sidebar-group-flag">{g.suffix}</span>}
            </div>
            {(byGroup[g.id] || []).map((mod) => {
              const IconComp = iconFor(mod.icon);
              const isActive = mod.id === active;
              return (
                <button
                  key={mod.id}
                  className={'fad-nav-item' + (isActive ? ' active' : '')}
                  onClick={() => {
                    onSelect(mod.id);
                    onMobileClose?.();
                  }}
                  title={mod.label}
                >
                  <span className="fad-nav-icon">
                    <IconComp />
                  </span>
                  <span className="fad-nav-label">{mod.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
    </>
  );
}
