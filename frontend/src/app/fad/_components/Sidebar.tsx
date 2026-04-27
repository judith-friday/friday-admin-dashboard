'use client';

import { useMemo } from 'react';
import { MODULES, GROUPS, type ModuleDef } from '../_data/modules';
import { iconFor, IconExpand, IconSparkle } from './icons';
import { canSeeModule, useCurrentRole } from './usePermissions';

interface Props {
  active: string;
  subPage?: string | null;
  onSelect: (id: string) => void;
  onSelectSub?: (modId: string, sub: string) => void;
  /** Map of moduleId -> set of locked subPage IDs (rendered with lock icon, still clickable). */
  lockedSubs?: Record<string, Set<string>>;
  collapsed: boolean;
  fridayFs?: boolean;
  onOpenFridayFs?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  active,
  subPage,
  onSelect,
  onSelectSub,
  lockedSubs,
  collapsed,
  fridayFs,
  onOpenFridayFs,
  mobileOpen,
  onMobileClose,
}: Props) {
  const role = useCurrentRole();
  const byGroup = useMemo(() => {
    const m: Record<string, ModuleDef[]> = {};
    MODULES.forEach((mod) => {
      if (!canSeeModule(role, mod.id)) return;
      (m[mod.group] = m[mod.group] || []).push(mod);
    });
    return m;
  }, [role]);

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
        {GROUPS.map((g, gi) => {
          const groupMods = byGroup[g.id] || [];
          if (groupMods.length === 0) return null;
          const prevTier = gi > 0 ? GROUPS[gi - 1].tier : null;
          const tierChanged = prevTier !== null && prevTier !== g.tier;
          return (
            <div
              className={'fad-sidebar-group fad-sidebar-group-' + g.tier}
              key={g.id}
            >
              {tierChanged && g.tier === 'manage' && (
                <div className="fad-sidebar-tier-label">Manage</div>
              )}
              <div className="fad-sidebar-group-label">
                <span>{g.label}</span>
              </div>
              {groupMods.map((mod) => {
                const IconComp = iconFor(mod.icon);
                const isActive = mod.id === active;
                const showSubs = isActive && !collapsed && !!mod.subPages?.length;
                return (
                  <div key={mod.id} className="fad-nav-item-wrap">
                    <button
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
                    {showSubs && (
                      <div className="fad-nav-subs">
                        {mod.subPages!.map((sp) => {
                          const isLocked = lockedSubs?.[mod.id]?.has(sp.id);
                          return (
                            <button
                              key={sp.id}
                              className={
                                'fad-nav-sub' + (subPage === sp.id ? ' active' : '') + (isLocked ? ' locked' : '')
                              }
                              onClick={() => {
                                onSelectSub?.(mod.id, sp.id);
                                onMobileClose?.();
                              }}
                              title={isLocked ? `${sp.label} · admin only` : sp.label}
                            >
                              <span className="fad-nav-sub-label">{sp.label}</span>
                              {isLocked && <span className="fad-nav-sub-lock" aria-hidden="true">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
    </>
  );
}
