'use client';

import { useEffect, useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { IconPlus } from '../icons';
import { fireToast } from '../Toaster';
import type { Reservation } from '../../_data/reservations';
import { OverviewPage } from './reservations/OverviewPage';
import { AllReservationsPage } from './reservations/AllReservationsPage';
import { InquiriesPage } from './reservations/InquiriesPage';
import { ReservationDetail } from './reservations/ReservationDetail';
import { CreateReservationDrawer } from './reservations/CreateReservationDrawer';
import { CreateTaskDrawer } from './operations/CreateTaskDrawer';

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
  const [taskFromRsv, setTaskFromRsv] = useState<Reservation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Cross-link target: ?rsv=<id> opens detail directly. Also supports the
  // legacy ?detail= query param for backwards compatibility with stub links.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('rsv') || params.get('detail');
    if (target) setOpenId(target);
  }, []);

  const handleNew = () => setCreateOpen(true);

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
      {openId && (
        <ReservationDetail
          reservationId={openId}
          onClose={() => setOpenId(null)}
          onCreateTask={(rsv) => setTaskFromRsv(rsv)}
        />
      )}
      <CreateTaskDrawer
        open={!!taskFromRsv}
        onClose={() => setTaskFromRsv(null)}
        onCreated={(t) => {
          setTaskFromRsv(null);
          fireToast(`Task created · ${t.id}`);
        }}
        prefill={
          taskFromRsv
            ? {
                title: '',
                propertyCode: taskFromRsv.propertyCode,
                reservationId: taskFromRsv.id,
                source: 'manual',
              }
            : undefined
        }
      />
      <CreateReservationDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(rsv) => {
          setCreateOpen(false);
          setOpenId(rsv.id);
        }}
      />
    </div>
  );
}
