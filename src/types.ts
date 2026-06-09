export type TaskCategory =
  | 'PROJECT_TRACK'
  | 'SALES_SUPPORT'
  | 'ONLINE_SUPPORT'
  | 'LICENSE_TRANSFER'
  | 'CUSTOMER_EMAIL'
  | 'OTHER';

export interface TaskEntry {
  id: string;
  date: string; // YYYY-MM-DD
  project: string; // Project Name (or General Office)
  category: TaskCategory;
  description: string;
  status: 'In Progress' | 'Completed' | 'Blocked';
  timeSpent: number; // in hours
  completedDate?: string; // YYYY-MM-DD
  engineer?: string; // Author Name
}

export interface ProjectInfo {
  name: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
  leadEngineer: string;
  description: string;
  assignedEngineers?: string[]; // Names of engineers assigned to this project
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  PROJECT_TRACK: 'Project Tracking & Execution',
  SALES_SUPPORT: 'Sales Person Requests',
  ONLINE_SUPPORT: 'Online Support',
  LICENSE_TRANSFER: 'Siemens License Transfer',
  CUSTOMER_EMAIL: 'Customer Email Support',
  OTHER: 'Other Office Tasks',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  PROJECT_TRACK: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  SALES_SUPPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  ONLINE_SUPPORT: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  LICENSE_TRANSFER: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  CUSTOMER_EMAIL: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
};

export const CATEGORY_DARK_COLORS: Record<TaskCategory, string> = {
  PROJECT_TRACK: 'border-l-4 border-emerald-500',
  SALES_SUPPORT: 'border-l-4 border-indigo-500',
  ONLINE_SUPPORT: 'border-l-4 border-cyan-500',
  LICENSE_TRANSFER: 'border-l-4 border-amber-500',
  CUSTOMER_EMAIL: 'border-l-4 border-sky-500',
  OTHER: 'border-l-4 border-slate-400',
};

export interface AppUser {
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'engineer';
  avatarInitials: string;
  designation: string;
  password?: string;
}

export const APP_USERS: AppUser[] = [
  {
    username: 'admin',
    name: 'Admin User',
    role: 'admin',
    avatarInitials: 'AD',
    designation: 'IT / Operations Admin'
  },
  {
    username: 'manager',
    name: 'David Miller',
    role: 'manager',
    avatarInitials: 'DM',
    designation: 'Lead Projects Manager'
  },
  {
    username: 'balarathu',
    name: 'Balarathu',
    role: 'engineer',
    avatarInitials: 'BL',
    designation: 'Senior Project Engineer'
  },
  {
    username: 'sarah',
    name: 'Sarah Thompson',
    role: 'engineer',
    avatarInitials: 'ST',
    designation: 'Automation Engineer'
  },
  {
    username: 'markus',
    name: 'Markus V',
    role: 'engineer',
    avatarInitials: 'MV',
    designation: 'Systems Specialist'
  }
];

export function encryptPassword(pwd: string): string {
  if (!pwd) return '';
  try {
    return 'enc_' + btoa(encodeURIComponent(pwd));
  } catch {
    return pwd;
  }
}

export function decryptPassword(stored: string | null, fallback: string): string {
  if (!stored) return fallback;
  if (stored.startsWith('enc_')) {
    try {
      return decodeURIComponent(atob(stored.substring(4)));
    } catch {
      return stored;
    }
  }
  return stored; // Backward compatibility for plain text
}

export interface QuickPreset {
  id: string;
  label: string;
  emoji: string;
  project: string;
  category: TaskCategory;
  description: string;
  timeSpent: number; // default duration in hours
}

export const INITIAL_PRESETS: QuickPreset[] = [
  {
    id: 'preset_1',
    label: 'Siemens License Transfer',
    emoji: '🔑',
    project: 'Office Work',
    category: 'LICENSE_TRANSFER',
    description: 'Processed Siemens License alignment check & ALM transfer request resolving client field query.',
    timeSpent: 1.5,
  },
  {
    id: 'preset_2',
    label: 'Reply to Sales Query',
    emoji: '💬',
    project: 'General Support',
    category: 'SALES_SUPPORT',
    description: 'Drafted technical specifications & bill of material quote response for client automation RFQ.',
    timeSpent: 2.0,
  },
  {
    id: 'preset_3',
    label: 'Tier-3 Email Support',
    emoji: '📧',
    project: 'Office Work',
    category: 'CUSTOMER_EMAIL',
    description: 'Resolved customer email queue inquiries concerning field upgrades and software versions.',
    timeSpent: 1.5,
  }
];


