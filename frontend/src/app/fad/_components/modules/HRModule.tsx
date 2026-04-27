'use client';

import { useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { useCanSee } from '../usePermissions';
import { StaffPage } from './hr/StaffPage';
import { TimeOffPage } from './hr/TimeOffPage';
import { StatsPage } from './hr/StatsPage';
import { PermissionsPage } from './hr/PermissionsPage';
import { RosterPage } from './roster/RosterPage';

interface Props {
  subPage: string;
  onChangeSubPage: (id: string) => void;
}

type SubPage = 'staff' | 'roster' | 'time-off' | 'stats' | 'permissions';

export function HRModule({ subPage, onChangeSubPage }: Props) {
  const canSeeStaff = useCanSee('hr_staff', 'read');
  const canSeeRoster = useCanSee('hr_roster', 'read');
  const canSeeTimeOff = useCanSee('hr_time_off', 'read');
  const canSeeStats = useCanSee('hr_stats', 'read');
  const canSeePermissions = useCanSee('hr_permissions', 'read');

  const tabs = [
    canSeeStaff && { id: 'staff', label: 'Staff' },
    canSeeRoster && { id: 'roster', label: 'Roster' },
    canSeeTimeOff && { id: 'time-off', label: 'Time-off' },
    canSeeStats && { id: 'stats', label: 'Stats' },
    canSeePermissions && { id: 'permissions', label: 'Permissions' },
  ].filter((t): t is { id: string; label: string } => Boolean(t));

  const active = tabs.find((t) => t.id === subPage)?.id ?? tabs[0]?.id ?? 'staff';

  const renderSub = (id: string) => {
    switch (id) {
      case 'staff':
        return canSeeStaff ? <StaffPage /> : null;
      case 'time-off':
        return canSeeTimeOff ? <TimeOffPage /> : null;
      case 'stats':
        return canSeeStats ? <StatsPage /> : null;
      case 'roster':
        return canSeeRoster ? <RosterPage /> : null;
      case 'permissions':
        return canSeePermissions ? <PermissionsPage /> : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <ModuleHeader
        title="HR"
        subtitle="Staff · roster · time-off · stats · permissions"
        tabs={tabs}
        activeTab={active}
        onTabChange={onChangeSubPage}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {renderSub(active)}
      </div>
    </div>
  );
}

