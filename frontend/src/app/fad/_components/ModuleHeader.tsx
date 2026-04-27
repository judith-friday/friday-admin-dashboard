'use client';

import { useState, type ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  title: string;
  subtitle?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  actions?: ReactNode;
}

const MOBILE_OVERFLOW_THRESHOLD = 4;

export function ModuleHeader({ title, subtitle, tabs, activeTab, onTabChange, actions }: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const showOverflow = !!tabs && tabs.length > MOBILE_OVERFLOW_THRESHOLD;
  const activeTabObj = tabs?.find((t) => t.id === activeTab);

  return (
    <div className="fad-module-header">
      <div className="fad-module-header-main">
        <h1 className="fad-module-title">{title}</h1>
        {subtitle && <div className="fad-module-subtitle">{subtitle}</div>}
        {tabs && (
          <>
            <div className={'fad-tabs' + (showOverflow ? ' fad-tabs-desktop' : '')}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={'fad-tab' + (activeTab === t.id ? ' active' : '')}
                  onClick={() => onTabChange?.(t.id)}
                >
                  {t.label}
                  {t.count !== undefined && <span className="count mono">{t.count}</span>}
                </button>
              ))}
            </div>

            {showOverflow && (
              <div className="fad-tabs fad-tabs-mobile">
                {activeTabObj && (
                  <button className="fad-tab active" type="button">
                    {activeTabObj.label}
                    {activeTabObj.count !== undefined && (
                      <span className="count mono">{activeTabObj.count}</span>
                    )}
                  </button>
                )}
                <div style={{ position: 'relative' }}>
                  <button
                    className={'fad-tab' + (overflowOpen ? ' active' : '')}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowOpen(!overflowOpen);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={overflowOpen}
                  >
                    More ▾
                  </button>
                  {overflowOpen && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                        onClick={() => setOverflowOpen(false)}
                      />
                      <div
                        className="fad-dropdown"
                        style={{ minWidth: 200, padding: 4, zIndex: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                      >
                        {tabs.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            role="menuitem"
                            className="fad-dropdown-item"
                            onClick={() => {
                              onTabChange?.(t.id);
                              setOverflowOpen(false);
                            }}
                            style={
                              activeTab === t.id
                                ? { color: 'var(--color-brand-accent)', fontWeight: 500 }
                                : undefined
                            }
                          >
                            <span>{t.label}</span>
                            {t.count !== undefined && <span className="meta">{t.count}</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {actions && <div className="fad-module-actions">{actions}</div>}
    </div>
  );
}
