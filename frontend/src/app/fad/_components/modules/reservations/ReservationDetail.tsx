'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  RESERVATION_BY_ID,
  CHANNEL_LABEL,
  STATUS_LABEL,
  PAYOUT_LABEL,
  CLEANING_ARRANGEMENT_LABEL,
  SPECIAL_REQUEST_LABEL,
  formatMoney,
  formatStayWindow,
  notesForReservation,
  activityForReservation,
  type Reservation,
  type ReservationActivity,
} from '../../../_data/reservations';
import { TASKS, TASK_USER_BY_ID, type Task } from '../../../_data/tasks';
import { useCurrentRole } from '../../usePermissions';
import { fireToast } from '../../Toaster';
import { IconClose } from '../../icons';

interface Props {
  reservationId: string;
  onClose: () => void;
}

type SubTab = 'overview' | 'booking' | 'guests' | 'operations' | 'folio' | 'accounting' | 'payments' | 'activity';

const TAB_LABEL: Record<SubTab, string> = {
  overview: 'Overview',
  booking: 'Booking details',
  guests: 'Guests',
  operations: 'Operations',
  folio: 'Folio',
  accounting: 'Accounting',
  payments: 'Payments',
  activity: 'Activity Log',
};

// Role mapping per scoping pack §6 (Admin / Manager / Contributor / Owner portal)
type FinancialAccess = 'full' | 'guest_facing' | 'none';

function financialAccessFor(role: string): FinancialAccess {
  if (role === 'director') return 'full';
  if (role === 'commercial_marketing' || role === 'ops_manager') return 'guest_facing';
  return 'none';
}

function statusToneClass(s: Reservation['status']): string {
  switch (s) {
    case 'checked_in':
    case 'confirmed':
      return 'info';
    case 'hold':
    case 'cancelled':
      return 'warn';
    default:
      return '';
  }
}

export function ReservationDetail({ reservationId, onClose }: Props) {
  const r = RESERVATION_BY_ID[reservationId];
  const role = useCurrentRole();
  const finAccess = financialAccessFor(role);
  const [tab, setTab] = useState<SubTab>('overview');

  // Reset to overview when reservation changes (e.g. cross-link clicks).
  useEffect(() => {
    setTab('overview');
  }, [reservationId]);

  // Tabs to show — scoping pack §6: Contributor sees no financial section.
  const tabs: SubTab[] = useMemo(() => {
    const base: SubTab[] = ['overview', 'booking', 'guests', 'operations'];
    if (finAccess !== 'none') base.push('folio');
    if (finAccess === 'full') base.push('accounting', 'payments');
    base.push('activity');
    return base;
  }, [finAccess]);

  if (!r) {
    return (
      <>
        <div onClick={onClose} style={overlayStyle} />
        <aside className="task-detail-pane open" style={paneStyle}>
          <div style={{ padding: 24 }}>
            <button className="fad-util-btn" onClick={onClose}>
              <IconClose size={14} />
            </button>
            <div style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Reservation not found.
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={overlayStyle} />
      <aside className="task-detail-pane open" style={paneStyle}>
        {/* Header */}
        <div className="task-detail-header" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                {r.confirmationCode} · {r.propertyCode}
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{r.guestName}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                {formatStayWindow(r)}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={'chip sm ' + statusToneClass(r.status)}>{STATUS_LABEL[r.status]}</span>
                <span className="chip sm">{CHANNEL_LABEL[r.channel]}</span>
                {r.balanceDue > 0 && (
                  <span className="chip sm warn">Balance · {formatMoney(r.balanceDue, r.currency)}</span>
                )}
                {r.extensionOf && <span className="chip sm">Extension</span>}
              </div>
            </div>
            <button className="fad-util-btn" onClick={onClose} title="Close">
              <IconClose size={14} />
            </button>
          </div>

          {/* Sub-tab nav */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              marginTop: 16,
              marginLeft: -20,
              marginRight: -20,
              paddingLeft: 20,
              paddingRight: 20,
              overflowX: 'auto',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
            }}
          >
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '8px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  fontWeight: tab === t ? 500 : 400,
                  borderBottom: tab === t ? '2px solid var(--color-brand-accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="task-detail-body">
          {tab === 'overview' && <OverviewTab r={r} />}
          {tab === 'booking' && <BookingDetailsTab r={r} />}
          {tab === 'guests' && <GuestsTab r={r} />}
          {tab === 'operations' && <OperationsTab r={r} />}
          {tab === 'folio' && <FolioTab r={r} access={finAccess} />}
          {tab === 'accounting' && <AccountingTab r={r} />}
          {tab === 'payments' && <PaymentsTab r={r} />}
          {tab === 'activity' && <ActivityTab r={r} />}
        </div>
      </aside>
    </>
  );
}

// ───────────────── Tabs ─────────────────

function OverviewTab({ r }: { r: Reservation }) {
  const notes = notesForReservation(r.id);
  return (
    <>
      <div className="task-detail-section">
        <h5>Stay</h5>
        <Grid2>
          <Field label="Check-in"><span className="mono">{r.checkIn.replace('T', ' ').slice(0, 16)}</span></Field>
          <Field label="Check-out"><span className="mono">{r.checkOut.replace('T', ' ').slice(0, 16)}</span></Field>
          <Field label="Nights"><span className="mono">{r.nights}</span></Field>
          <Field label="Guests">
            <span className="mono">
              {r.partySize.adults}A
              {r.partySize.children ? `+${r.partySize.children}C` : ''}
              {r.partySize.infants ? `+${r.partySize.infants}I` : ''}
            </span>
          </Field>
          {r.actualArrival && <Field label="Actual arrival"><span className="mono">{r.actualArrival.replace('T', ' ').slice(0, 16)}</span></Field>}
          {r.actualDeparture && <Field label="Actual departure"><span className="mono">{r.actualDeparture.replace('T', ' ').slice(0, 16)}</span></Field>}
        </Grid2>
      </div>
      <div className="task-detail-section">
        <h5>Status flags</h5>
        <Grid2>
          <Field label="Payment"><span className="mono">{PAYOUT_LABEL[r.payoutStatus]}</span></Field>
          <Field label="Balance due">
            <span className="mono" style={{ color: r.balanceDue > 0 ? 'var(--color-text-warning)' : undefined }}>
              {r.balanceDue > 0 ? formatMoney(r.balanceDue, r.currency) : 'Paid in full'}
            </span>
          </Field>
          <Field label="Access info">
            <span className="mono" style={{ color: r.accessInfoSentAt ? undefined : 'var(--color-text-warning)' }}>
              {r.accessInfoSentAt ? `Sent ${r.accessInfoSentAt.slice(5, 16)}` : 'Not sent'}
            </span>
          </Field>
          <Field label="Driver">
            <span className="mono">{r.driverAssigneeId ? TASK_USER_BY_ID[r.driverAssigneeId]?.name || r.driverAssigneeId : '—'}</span>
          </Field>
          <Field label="Review request">
            <span className="mono">{r.reviewRequestedAt ? r.reviewRequestedAt.slice(5, 16) : '—'}</span>
          </Field>
        </Grid2>
      </div>
      {r.notes && (
        <div className="task-detail-section">
          <h5>Notes</h5>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>{r.notes}</div>
        </div>
      )}
      {notes.length > 0 && (
        <div className="task-detail-section">
          <h5>Internal notes · {notes.length}</h5>
          {notes.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '8px 0',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{n.authorName} <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>· {n.createdAt.slice(5, 16)}</span></div>
              <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}
      <div className="task-detail-section">
        <h5>Actions</h5>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <ActionBtn label="Message guest" hint="Routes to Inbox-Guest module" />
          <ActionBtn label="Modify dates/times" hint="Opens Calendar Adjust-times flow (Phase 2 write-through)" />
          <ActionBtn label="Trigger refund" hint="Routes to Finance approvals (within €200/30% cap → Finance flow; over cap → escalation chain)" />
          <ActionBtn label="Add note" hint="Phase 2: internal note thread on reservation" />
          <ActionBtn label="Link/create task" hint="Opens Operations create-task drawer pre-keyed" />
          {r.channel === 'airbnb' && <ActionBtn label="Open Airbnb resolution centre" hint="Phase 1: deep-link out to Airbnb host dashboard" />}
        </div>
      </div>
    </>
  );
}

function BookingDetailsTab({ r }: { r: Reservation }) {
  return (
    <>
      <div className="task-detail-section">
        <h5>Booking</h5>
        <Grid2>
          <Field label="Confirmation"><span className="mono">{r.confirmationCode}</span></Field>
          <Field label="Channel">{CHANNEL_LABEL[r.channel]}</Field>
          <Field label="Created"><span className="mono">{r.createdAt ? r.createdAt.slice(0, 10) : '—'}</span></Field>
          {r.extensionOf && (
            <Field label="Extension of"><span className="mono">{r.extensionOf}</span></Field>
          )}
        </Grid2>
      </div>
      <div className="task-detail-section">
        <h5>Party</h5>
        <Grid2>
          <Field label="Adults"><span className="mono">{r.partySize.adults}</span></Field>
          <Field label="Children"><span className="mono">{r.partySize.children}</span></Field>
          <Field label="Infants"><span className="mono">{r.partySize.infants ?? 0}</span></Field>
        </Grid2>
      </div>
      {r.specialRequests && (
        <div className="task-detail-section">
          <h5>Special requests</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {r.specialRequests.categories.map((c) => (
              <span key={c} className="chip sm">{SPECIAL_REQUEST_LABEL[c]}</span>
            ))}
          </div>
          {r.specialRequests.notes && (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
              {r.specialRequests.notes}
            </div>
          )}
        </div>
      )}
      {r.cleaningArrangement && (
        <div className="task-detail-section">
          <h5>Owner stay · cleaning</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip sm">{CLEANING_ARRANGEMENT_LABEL[r.cleaningArrangement]}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {r.cleaningArrangement === 'friday_cleans'
                ? 'Friday handles SRL removal + standard clean + post-clean inspect. Cleaning fee billable to owner.'
                : 'Owner cleans. Friday verifies post-stay; if substandard, reclean billable.'}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Task templates fire when Operations module redesigns (parking-lot per decisions log §7).
          </div>
        </div>
      )}
    </>
  );
}

function GuestsTab({ r }: { r: Reservation }) {
  return (
    <div className="task-detail-section">
      <StubPanel
        title="Guest profile"
        body={`Guests module ships Jul 2026 (per ownership map). Phase 1 placeholder — guest is ${r.guestName}, ${r.partySize.adults} adults${r.partySize.children ? ` + ${r.partySize.children} children` : ''}.`}
        body2="When Guests module ships: full guest profile, contact details, OTA profiles, additional reservations linked, consent + documents."
      />
    </div>
  );
}

function OperationsTab({ r }: { r: Reservation }) {
  const linked = useMemo(() => TASKS.filter((t) => t.reservationId === r.id), [r.id]);
  if (linked.length === 0) {
    return (
      <div className="task-detail-section">
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
          No tasks linked to this reservation.
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          When Operations creates check-in / cleaning / inspection tasks tied to this reservation, they'll show here.
        </div>
      </div>
    );
  }
  return (
    <div className="task-detail-section">
      <h5>Linked tasks · {linked.length}</h5>
      {linked.map((t: Task, i) => (
        <div
          key={t.id}
          style={{
            padding: '10px 0',
            borderBottom: i < linked.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</span>
            <span className="chip sm">{t.status}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            <span className="mono">{t.id}</span> · {t.department}
            {t.subdepartment && ` · ${t.subdepartment}`} · due {t.dueDate}
            {t.assigneeIds.length > 0 && ` · ${t.assigneeIds.map((id) => TASK_USER_BY_ID[id]?.name).filter(Boolean).join(', ')}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function FolioTab({ r, access }: { r: Reservation; access: FinancialAccess }) {
  if (access === 'none') return null;
  // Phase 1: derive line items from totals. Phase 2: real folio from Finance.
  const accommodationFare = Math.max(0, r.totalAmount - r.touristTax);
  const channelFeeRate = r.channel === 'direct' || r.channel === 'email' || r.channel === 'owner' ? 0 : r.channel === 'booking' ? 0.15 : 0.18;
  const channelFee = Math.round(accommodationFare * channelFeeRate);
  const ownerSplit = Math.round((accommodationFare - channelFee) * 0.7);
  const fridayMargin = (accommodationFare - channelFee) - ownerSplit;

  return (
    <>
      <div className="task-detail-section">
        <h5>Folio · guest-facing</h5>
        <Row label="Accommodation fare" value={formatMoney(accommodationFare, r.currency)} />
        <Row label="Tourist tax (MRA)" value={formatMoney(r.touristTax, r.currency)} muted />
        <Row label="Total" value={formatMoney(r.totalAmount, r.currency)} bold borderTop />
      </div>
      {access === 'full' && (
        <div className="task-detail-section">
          <h5>Owner split · admin only</h5>
          <Row label="Channel fee (est.)" value={`− ${formatMoney(channelFee, r.currency)}`} muted />
          <Row label="Net to owner (70%)" value={formatMoney(ownerSplit, r.currency)} />
          <Row label="Friday margin (30%)" value={formatMoney(fridayMargin, r.currency)} bold borderTop />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Phase 1: derived from totals. Phase 2 reads real Folio breakdown from Finance.
          </div>
        </div>
      )}
      {access === 'guest_facing' && (
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
          Manager view — guest-facing total only. Owner split + margin restricted to admin.
        </div>
      )}
    </>
  );
}

function AccountingTab({ r }: { r: Reservation }) {
  return (
    <div className="task-detail-section">
      <StubPanel
        title="Full GL view"
        body="Phase 2: Finance schema gets reservation-keyed accounting reads (Owners ledger / AP / Cash / Advanced deposit)."
        body2={`Phase 1 placeholder — ${formatMoney(r.totalAmount, r.currency)} total · payout ${PAYOUT_LABEL[r.payoutStatus]}.`}
      />
    </div>
  );
}

function PaymentsTab({ r }: { r: Reservation }) {
  return (
    <div className="task-detail-section">
      <StubPanel
        title="Payment records"
        body={
          r.balanceDue > 0
            ? `Balance due: ${formatMoney(r.balanceDue, r.currency)}. Phase 1: no payment processor connected (manual bank transfers).`
            : `Paid in full. Phase 2: real payment records when Stripe / processor wires up.`
        }
        body2="Phase 2: payment status + balance due + manual record entry surface here."
      />
    </div>
  );
}

function ActivityTab({ r }: { r: Reservation }) {
  const activity = useMemo(() => activityForReservation(r.id), [r.id]);
  if (activity.length === 0) {
    return (
      <div className="task-detail-section">
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No activity logged yet.</div>
      </div>
    );
  }
  return (
    <div className="task-detail-section">
      <h5>Activity · {activity.length}</h5>
      {activity.map((a: ReservationActivity, i) => (
        <div
          key={a.id}
          style={{
            padding: '8px 0',
            borderBottom: i < activity.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 0,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', minWidth: 90 }}>
            {a.ts.slice(5, 16)}
          </span>
          <div style={{ flex: 1, fontSize: 12 }}>
            <span style={{ color: 'var(--color-text-tertiary)', marginRight: 6 }}>{a.kind.replace(/_/g, ' ')}</span>
            <span>{a.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────── Helpers ─────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Row({ label, value, muted, bold, borderTop }: { label: string; value: string; muted?: boolean; bold?: boolean; borderTop?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '6px 0',
        borderTop: borderTop ? '0.5px solid var(--color-border-tertiary)' : 0,
        marginTop: borderTop ? 6 : 0,
      }}
    >
      <span style={{ flex: 1, fontWeight: bold ? 500 : 400, fontSize: 13 }}>{label}</span>
      <span
        className="mono"
        style={{
          fontWeight: bold ? 500 : 400,
          fontSize: 13,
          color: muted ? 'var(--color-text-tertiary)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBtn({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      className="btn ghost sm"
      onClick={() => fireToast(`${label} — ${hint}`)}
    >
      {label}
    </button>
  );
}

function StubPanel({ title, body, body2 }: { title: string; body: string; body2?: string }) {
  return (
    <div
      style={{
        padding: 16,
        border: '0.5px dashed var(--color-border-tertiary)',
        borderRadius: 6,
        background: 'var(--color-background-tertiary)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>{body}</div>
      {body2 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8, lineHeight: 1.55 }}>
          {body2}
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: '48px 0 0 0',
  background: 'rgba(15, 24, 54, 0.12)',
  zIndex: 44,
};

const paneStyle: React.CSSProperties = {
  width: 720,
  maxWidth: '100vw',
};
