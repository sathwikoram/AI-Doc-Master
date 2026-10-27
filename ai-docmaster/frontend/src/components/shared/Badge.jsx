import { cn } from '../../lib/utils'
import {
  CASE_STATUS_COLORS, CASE_STATUS_LABELS,
  PRIORITY_COLORS, HEARING_STATUS_COLORS, APPOINTMENT_STATUS_COLORS,
} from '../../lib/utils'

export function CaseStatusBadge({ status }) {
  return (
    <span className={cn(CASE_STATUS_COLORS[status] || 'badge-slate')}>
      {CASE_STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className={cn(PRIORITY_COLORS[priority] || 'badge-slate', 'capitalize')}>
      {priority}
    </span>
  )
}

export function HearingStatusBadge({ status }) {
  return (
    <span className={cn(HEARING_STATUS_COLORS[status] || 'badge-slate', 'capitalize')}>
      {status}
    </span>
  )
}

export function AppointmentStatusBadge({ status }) {
  return (
    <span className={cn(APPOINTMENT_STATUS_COLORS[status] || 'badge-slate', 'capitalize')}>
      {status}
    </span>
  )
}

export function RoleBadge({ role }) {
  const map = { citizen: 'badge-blue', advocate: 'badge-green', admin: 'badge-red' }
  return <span className={cn(map[role] || 'badge-slate', 'capitalize')}>{role}</span>
}
