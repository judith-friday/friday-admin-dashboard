'use client';

import { useState, type ReactNode } from 'react';
import type { Action, Resource } from '../_data/permissions';
import { ROLE_LABEL } from '../_data/permissions';
import { useCanAccess, usePermissions } from './usePermissions';
import type { TaskUser } from '../_data/tasks';

interface GateProps {
  /** Single resource OR list — list grants access if ANY resource is granted (OR semantics). */
  resource: Resource | Resource[];
  action?: Action;
  /** When the gate's scope is 'self', pass the resource owner's user id. */
  ownerId?: string;
  /** Custom rendering when access is denied. Default: minimal "no access" panel. */
  fallback?: ReactNode;
  /** Render nothing on denial (no fallback panel). */
  silent?: boolean;
  children: ReactNode;
}

/**
 * Declarative wrapper. Renders children only when the current role has the
 * requested permission. Surfaces NOT wrapped stay open — see brief §10.
 */
export function PermissionGate({
  resource,
  action = 'read',
  ownerId,
  fallback,
  silent,
  children,
}: GateProps) {
  const { role, scopeOf, canForSelf } = usePermissions();
  const resources = Array.isArray(resource) ? resource : [resource];
  // Module-level gates: any non-'none' scope is enough to render. Sub-tab and
  // row-level filtering inside the module handles 'self' vs 'team' restrictions.
  const granted = ownerId
    ? resources.some((r) => canForSelf(r, action, ownerId))
    : resources.some((r) => scopeOf(r, action) !== 'none');

  if (granted) return <>{children}</>;
  if (silent) return null;
  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="fad-module-body" style={{ padding: 32 }}>
      <div
        style={{
          maxWidth: 460,
          margin: '40px auto',
          padding: 24,
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 12,
          background: 'var(--color-background-secondary)',
        }}
      >
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>No access to this view</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Your role ({ROLE_LABEL[role]}) doesn't have {action} permission on this resource.
          Talk to a Director if you need access.
        </div>
      </div>
    </div>
  );
}

// ───────────────── RoleSwitcher (dev affordance) ─────────────────

// @demo:auth + @demo:ui — Tag: PROD-AUTH-3 / PROD-UI-4 — see frontend/DEMO_CRUFT.md
// Remove this entire RoleSwitcher component when real auth lands.
// Real auth resolves role from JWT — users can't pick. The ROLES table
// below + the dropdown below + the "View as · dev preview" UI all go.
const ROLES: Array<{ id: TaskUser['role']; label: string; example: string }> = [
  { id: 'director', label: 'Director', example: 'Ishant' },
  { id: 'commercial_marketing', label: 'Commercial & Marketing', example: 'Mathias' },
  { id: 'ops_manager', label: 'Ops Manager', example: 'Franny' },
  { id: 'field', label: 'Field', example: 'Bryan' },
];

/**
 * Small inline dropdown for switching the acting role. Renders in the Header.
 * Gated to real-role=director so non-directors using FAD for real never see it.
 * Persists choice to localStorage. Phase 2 replaces this with real auth.
 */
export function RoleSwitcher() {
  // PREVIEW: hidden in demo-removed-preview
  return null;
}

/** Convenience shortcut for non-render places (e.g. event handlers). */
export function useGate(resource: Resource, action: Action = 'read'): boolean {
  return useCanAccess(resource, action);
}
