import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Calendar, Clock, Video, Phone, MapPin, X } from 'lucide-react'
import { appointmentsApi } from '../../lib/api'
import { AppointmentStatusBadge } from '../../components/shared/Badge'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { formatDateTime, getErrorMessage } from '../../lib/utils'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const MODE_ICONS = { in_person: MapPin, video: Video, phone: Phone }

export default function Appointments() {
  const queryClient = useQueryClient()
  const [cancelId, setCancelId] = useState(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn:  () => appointmentsApi.list().then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
      toast.success('Appointment cancelled')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <FullPageLoader />

  const upcoming = appointments.filter(a => ['requested','confirmed'].includes(a.status))
  const past     = appointments.filter(a => !['requested','confirmed'].includes(a.status))

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Appointments"
        subtitle="Manage your scheduled meetings with advocates"
        action={
          <Link to="/citizen/find-lawyer" className="btn-primary btn-sm gap-1.5">
            <Calendar size={14} /> Book New
          </Link>
        }
      />

      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          description="Find a lawyer and book your first consultation."
          action={<Link to="/citizen/find-lawyer" className="btn-primary btn-sm">Find a Lawyer</Link>}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    onCancel={() => setCancelId(a.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Past ({past.length})</h2>
              <div className="space-y-3 opacity-70">
                {past.map(a => (
                  <AppointmentCard key={a.id} appt={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelMutation.mutate(cancelId)}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This cannot be undone."
        danger
      />
    </div>
  )
}

function AppointmentCard({ appt, onCancel }) {
  const ModeIcon = MODE_ICONS[appt.mode] || MapPin
  return (
    <div className="card-sm flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Calendar size={20} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Appointment with Advocate
            </p>
            <p className="text-xs text-primary-600 font-medium mt-0.5">
              {formatDateTime(appt.scheduled_at)}
            </p>
          </div>
          <AppointmentStatusBadge status={appt.status} />
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ModeIcon size={12} />
            {appt.mode === 'in_person' ? 'In Person' : appt.mode === 'video' ? 'Video Call' : 'Phone Call'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {appt.duration_minutes} min
          </span>
        </div>

        {appt.citizen_notes && (
          <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded-lg p-2">{appt.citizen_notes}</p>
        )}

        {appt.meet_link && (
          <a href={appt.meet_link} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-600 hover:underline font-medium">
            <Video size={12} /> Join Meeting
          </a>
        )}
      </div>

      {onCancel && ['requested','confirmed'].includes(appt.status) && (
        <button onClick={onCancel} className="btn-icon text-slate-400 hover:text-danger-500 hover:bg-danger-50 flex-shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
