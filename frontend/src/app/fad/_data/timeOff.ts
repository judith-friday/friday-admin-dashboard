// Time-off requests — feeds HR > Time-off sub-page.
// Approving a request optimistically flips the corresponding RosterDay cells
// in the affected week to availability: 'leave' with leaveType set (T5 wires this).

export type TimeOffType = 'annual' | 'sick' | 'personal';
export type TimeOffStatus = 'pending' | 'approved' | 'declined';

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string;   // YYYY-MM-DD inclusive
  type: TimeOffType;
  reason?: string;
  status: TimeOffStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export const TIME_OFF_REQUESTS: TimeOffRequest[] = [];

export const TIME_OFF_TYPE_LABEL: Record<TimeOffType, string> = {
  annual: 'Annual leave',
  sick: 'Sick leave',
  personal: 'Personal',
};

export const TIME_OFF_STATUS_LABEL: Record<TimeOffStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
};
