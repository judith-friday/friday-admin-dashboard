export type Tier = 'live' | 'preview' | 'pitch' | 'tease';

export interface ModuleDef {
  id: string;
  label: string;
  group: string;
  tier: Tier;
  ship: string;
  icon: string;
  path: string;
  warning?: boolean;
}

export interface GroupDef {
  id: string;
  label: string;
  suffix?: string;
}

export const MODULES: ModuleDef[] = [
  { id: 'inbox', label: 'Inbox', group: 'Work', tier: 'live', ship: 'live', icon: 'IconInbox', path: '/gms/inbox' },
  { id: 'tasks', label: 'Tasks', group: 'Work', tier: 'preview', ship: '3.2', icon: 'IconTasks', path: '/gms/tasks' },
  { id: 'calendar', label: 'Calendar', group: 'Work', tier: 'live', ship: 'live', icon: 'IconCal', path: '/gms/calendar' },
  { id: 'reviews', label: 'Reviews', group: 'Work', tier: 'preview', ship: "May '26", icon: 'IconReviews', path: '/gms/reviews' },
  { id: 'properties', label: 'Properties', group: 'Portfolio', tier: 'preview', ship: "May '26", icon: 'IconProp', path: '/gms/properties' },
  { id: 'operations', label: 'Operations', group: 'Portfolio', tier: 'preview', ship: "May '26", icon: 'IconOps', path: '/gms/operations' },
  { id: 'reservations', label: 'Reservations', group: 'Portfolio', tier: 'preview', ship: "May '26", icon: 'IconBook', path: '/gms/reservations' },
  { id: 'finance', label: 'Finance', group: 'Business', tier: 'preview', warning: true, ship: "Apr '26", icon: 'IconFinance', path: '/gms/finance' },
  { id: 'legal', label: 'Legal & Admin', group: 'Business', tier: 'preview', warning: true, ship: "Apr '26", icon: 'IconLegal', path: '/gms/legal' },
  { id: 'guests', label: 'Guests', group: 'People', tier: 'pitch', ship: "Jul '26", icon: 'IconGuests', path: '/gms/guests' },
  { id: 'owners', label: 'Owners', group: 'People', tier: 'preview', ship: "May '26", icon: 'IconOwners', path: '/gms/owners' },
  { id: 'marketing', label: 'Marketing', group: 'Growth', tier: 'pitch', ship: "Aug '26", icon: 'IconMkt', path: '/gms/marketing' },
  { id: 'leads', label: 'Leads / CRM-lite', group: 'Growth', tier: 'pitch', ship: 'soon', icon: 'IconLeads', path: '/gms/leads' },
  { id: 'analytics', label: 'Analytics', group: 'Growth', tier: 'preview', ship: "Jun '26", icon: 'IconChart', path: '/gms/analytics' },
  { id: 'intelligence', label: 'Intelligence', group: 'Growth', tier: 'pitch', ship: "Aug '26", icon: 'IconIntel', path: '/gms/intelligence' },
  { id: 'syndic', label: 'Syndic', group: 'Units', tier: 'tease', ship: "Q1 '27", icon: 'IconSyndic', path: '/gms/syndic' },
  { id: 'interior', label: 'Interior', group: 'Units', tier: 'tease', ship: "Q2 '27", icon: 'IconInterior', path: '/gms/interior' },
  { id: 'agency', label: 'Agency', group: 'Units', tier: 'tease', ship: 'TBD', icon: 'IconAgency', path: '/gms/agency' },
  { id: 'training', label: 'Training', group: 'System', tier: 'preview', ship: "May '26", icon: 'IconAI', path: '/gms/training' },
  { id: 'settings', label: 'Settings', group: 'System', tier: 'live', ship: 'live', icon: 'IconSettings', path: '/gms/settings' },
];

export const GROUPS: GroupDef[] = [
  { id: 'Work', label: 'Work', suffix: 'daily' },
  { id: 'Portfolio', label: 'Portfolio' },
  { id: 'Business', label: 'Business' },
  { id: 'People', label: 'People' },
  { id: 'Growth', label: 'Growth' },
  { id: 'Units', label: 'Business Units' },
  { id: 'System', label: 'System' },
];
