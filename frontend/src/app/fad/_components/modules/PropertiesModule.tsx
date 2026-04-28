'use client';

import { useEffect, useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { OverviewPage } from './properties/OverviewPage';
import { AllPropertiesPage } from './properties/AllPropertiesPage';
import { OnboardingPage } from './properties/OnboardingPage';
import { AiCardsPage } from './properties/AiCardsPage';
import { PropertyDetail } from './properties/PropertyDetail';
import { CreatePropertyDrawer } from './properties/CreatePropertyDrawer';
import { pendingAiSuggestions } from '../../_data/properties';
import { IconPlus } from '../icons';

interface Props {
  subPage: string;
  onChangeSubPage: (id: string) => void;
}

export function PropertiesModule({ subPage, onChangeSubPage }: Props) {
  const aiCount = pendingAiSuggestions().length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'All properties' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'ai-cards', label: aiCount > 0 ? `AI Cards · ${aiCount}` : 'AI Cards' },
  ];

  const active = tabs.find((t) => t.id === subPage)?.id ?? 'overview';
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
        actions={
          <button className="btn primary sm" onClick={() => setCreateOpen(true)}>
            <IconPlus size={12} /> New property
          </button>
        }
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {active === 'overview' && <OverviewPage onOpen={setOpenCode} />}
        {active === 'all' && <AllPropertiesPage onOpen={setOpenCode} />}
        {active === 'onboarding' && <OnboardingPage onOpen={setOpenCode} />}
        {active === 'ai-cards' && <AiCardsPage onOpen={setOpenCode} />}
      </div>
      {openCode && (
        <PropertyDetail
          propertyCode={openCode}
          onClose={() => setOpenCode(null)}
        />
      )}
      <CreatePropertyDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => {
          setCreateOpen(false);
          setOpenCode(p.code);
        }}
      />
    </div>
  );
}
