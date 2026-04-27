'use client';

import type { ReactNode } from 'react';

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

export function ModuleHeader({ title, subtitle, tabs, activeTab, onTabChange, actions }: Props) {
  return (
    <div className="fad-module-header">
      <div className="fad-module-header-main">
        <h1 className="fad-module-title">{title}</h1>
        {subtitle && <div className="fad-module-subtitle">{subtitle}</div>}
        {tabs && (
          <div className="fad-tabs">
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
        )}
      </div>
      {actions && <div className="fad-module-actions">{actions}</div>}
    </div>
  );
}

