import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function formatDate(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatRelative(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'hh:mm a')}`
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'hh:mm a')}`
  return formatDistanceToNow(d, { addSuffix: true })
}

// ── Status helpers ────────────────────────────────────────────────────────────
export const CASE_STATUS_COLORS = {
  pending:            'badge-slate',
  ai_analyzed:        'badge-blue',
  lawyer_assigned:    'badge-blue',
  accepted:           'badge-green',
  in_progress:        'badge-blue',
  hearing_scheduled:  'badge-amber',
  adjourned:          'badge-amber',
  closed_won:         'badge-green',
  closed_lost:        'badge-red',
  closed_settled:     'badge-green',
  rejected:           'badge-red',
}

export const CASE_STATUS_LABELS = {
  pending:            'Pending',
  ai_analyzed:        'AI Analyzed',
  lawyer_assigned:    'Lawyer Assigned',
  accepted:           'Accepted',
  in_progress:        'In Progress',
  hearing_scheduled:  'Hearing Scheduled',
  adjourned:          'Adjourned',
  closed_won:         'Closed – Won',
  closed_lost:        'Closed – Lost',
  closed_settled:     'Settled',
  rejected:           'Rejected',
}

export const PRIORITY_COLORS = {
  low:    'badge-slate',
  medium: 'badge-blue',
  high:   'badge-amber',
  urgent: 'badge-red',
}

export const HEARING_STATUS_COLORS = {
  scheduled:  'badge-blue',
  completed:  'badge-green',
  adjourned:  'badge-amber',
  cancelled:  'badge-red',
}

export const APPOINTMENT_STATUS_COLORS = {
  requested:  'badge-blue',
  confirmed:  'badge-green',
  cancelled:  'badge-red',
  completed:  'badge-green',
  no_show:    'badge-slate',
}

// ── Category icon map ─────────────────────────────────────────────────────────
export const CATEGORY_ICONS = {
  'Criminal':               '⚖️',
  'Property Dispute':       '🏠',
  'Family Law':             '👨‍👩‍👧',
  'Labour & Employment':    '💼',
  'Consumer Dispute':       '🛒',
  'Civil':                  '📋',
  'Constitutional/Public Law': '🏛️',
  'Cyber Crime':            '💻',
}

// ── File helpers ──────────────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function getFileIcon(type = '') {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼️'
  if (type.includes('word') || type.includes('docx')) return '📝'
  return '📎'
}

// ── Error extraction ──────────────────────────────────────────────────────────
export function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}
