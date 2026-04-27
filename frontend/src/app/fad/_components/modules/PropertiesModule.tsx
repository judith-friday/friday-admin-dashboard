'use client';

import { useEffect, useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { OverviewPage } from './properties/OverviewPage';
import { AllPropertiesPage } from './properties/AllPropertiesPage';
import { OnboardingPage } from './properties/OnboardingPage';
import { PropertyDetail } from './properties/PropertyDetail';

interface Props {
  subPage: string;
  onChangeSubPage: (id: string) => void;
}

export function PropertiesModule({ subPage, onChangeSubPage }: Props) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'All properties' },
    { id: 'onboarding', label: 'Onboarding' },
  ];

  const active = tabs.find((t) => t.id === subPage)?.id ?? 'overview';
  const [openCode, setOpenCode] = useState<string | null>(null);

  // Cross-link target: ?p=<code> opens detail directly. Strip the param after
  // reading so closing the drawer + navigating away then back doesn't re-open
  // it on remount (Reservations bug-fix sweep pattern).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('p');
    if (target) {
      setOpenCode(target);
      params.delete('p');
      const qs = params.toString();
      const nextUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <ModuleHeader
        title="Properties"
        subtitle="Unification layer between Guesty (commercial) and Breezeway (operational) · destination for everything property-anchored"
        tabs={tabs}
        activeTab={active}
        onTabChange={onChangeSubPage}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {active === 'overview' && <OverviewPage onOpen={setOpenCode} />}
        {active === 'all' && <AllPropertiesPage onOpen={setOpenCode} />}
        {active === 'onboarding' && <OnboardingPage onOpen={setOpenCode} />}
      </div>
      {openCode && (
        <PropertyDetail
          propertyCode={openCode}
          onClose={() => setOpenCode(null)}
        />
      )}
    </div>
  );
}
