'use client';

import { useEffect, useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { IconPlus } from '../icons';
import { fireToast } from '../Toaster';
import { OverviewPage } from './reservations/OverviewPage';
import { AllReservationsPage } from './reservations/AllReservationsPage';
import { InquiriesPage } from './reservations/InquiriesPage';
import { ReservationDetail } from './reservations/ReservationDetail';

interface Props {
  subPage: string;
  onChangeSubPage: (id: string) => void;
}

export function ReservationsModule({ subPage, onChangeSubPage }: Props) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'All reservations' },
    { id: 'inquiries', label: 'Inquiries' },
  ];

  const active = tabs.find((t) => t.id === subPage)?.id ?? 'overview';

  const [openId, setOpenId] = useState<string | null>(null);

  // Cross-link target: ?rsv=<id> opens detail directly. Also supports the
  // legacy ?detail= query param for backwards compatibility with stub links.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('rsv') || params.get('detail');
    if (target) setOpenId(target);
  }, []);

  const handleNew = () => {
    fireToast('Create reservation — opens the Calendar Find-availability flow (Phase 2 wiring; Calendar owns the create entry per scoping pack §8).');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <ModuleHeader
        title="Reservations"
        subtitle="Lookup, detail, inquiries · supporting surface across Finance / Operations / Inbox"
        tabs={tabs}
        activeTab={active}
        onTabChange={onChangeSubPage}
        actions={
          <button className="btn primary sm" onClick={handleNew}>
            <IconPlus size={12} /> New reservation
          </button>
        }
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {active === 'overview' && <OverviewPage onOpen={setOpenId} />}
        {active === 'all' && <AllReservationsPage onOpen={setOpenId} />}
        {active === 'inquiries' && <InquiriesPage onOpenReservation={setOpenId} />}
      </div>
      {openId && <ReservationDetail reservationId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
