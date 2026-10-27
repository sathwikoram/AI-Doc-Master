import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Calendar, Clock, MapPin, Gavel, RefreshCw,
  ChevronDown, Filter, CheckCircle,
} from 'lucide-react'
import { hearingsApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import { HearingStatusBadge } from '../../components/shared/Badge'
import { formatDateTime, formatDate, getErrorMessage } from '../../lib/utils'
import { useForm } from 'react-hook-form'

const STATUS_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Adjourned', value: 'adjourned' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function AdvocateHearings() {
  const queryClient  = useQueryClient()
  const [filter, setFilter]         = useState('')
  const [outcomeHearing, setOutcome] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: hearings = [], isLoading } = useQuery({
    queryKey: ['upcoming-hearings'],
    queryFn:  () => hearingsApi.upcoming().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => hearingsApi.update(id, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-hearings'])
      setOutcome(null); reset()
      toast.success('Hearing updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const replaceMutation = useMutation({
    mutationFn: (id) => hearingsApi.replaceAdvocate(id, 'Advocate unavailable'),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-hearings'])
      toast.success('Replacement advocate assigned successfully')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <FullPageLoader />

  const filtered = hearings.filter(h => !filter || h.status === filter)

  // Group by date
  const grouped = filtered.reduce((acc, h) => {
    const key = formatDate(h.scheduled_date)
    if (!acc[key]) acc[key] = []
    acc[key].push(h)
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Hearings"
        subtitle={`${hearings.length} total hearing${hearings.length !== 1 ? 's' : ''}`}
      />

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${filter === f.value
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hearings found"
          description="Scheduled hearings will appear here."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayHearings]) => (
            <div key={date}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {date}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-3">
                {dayHearings.map(h => (
                  <HearingCard
                    key={h.id}
                    hearing={h}
                    onUpdateOutcome={() => setOutcome(h)}
                    onReplace={() => replaceMutation.mutate(h.id)}
                    replacing={replaceMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outcome Modal */}
      <Modal
        open={!!outcomeHearing}
        onClose={() => { setOutcome(null); reset() }}
        title="Update Hearing Outcome"
        size="md"
      >
        <form onSubmit={handleSubmit(data => updateMutation.mutate({ id: outcomeHearing?.id, ...data }))}
              className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select {...register('status', { required: 'Required' })} className="input">
              <option value="completed">Completed</option>
              <option value="adjourned">Adjourned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Outcome / Notes</label>
            <textarea
              {...register('outcome')}
              rows={4}
              placeholder="Describe what happened in this hearing…"
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">Next Hearing Date <span className="text-slate-400 font-normal">(if adjourned)</span></label>
            <input type="datetime-local" {...register('next_date')} className="input" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" {...register('advocate_present')} className="rounded" />
              Advocate Present
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" {...register('citizen_present')} className="rounded" />
              Client Present
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setOutcome(null); reset() }} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary gap-1.5">
              <CheckCircle size={15} />
              {updateMutation.isPending ? 'Saving…' : 'Save Outcome'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function HearingCard({ hearing: h, onUpdateOutcome, onReplace, replacing }) {
  const isUpcoming = h.status === 'scheduled'
  const isToday = new Date(h.scheduled_date).toDateString() === new Date().toDateString()

  return (
    <div className={`card-sm ${isToday && isUpcoming ? 'border-emerald-300 bg-emerald-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Time block */}
          <div className={`flex-shrink-0 w-14 text-center p-2 rounded-xl
            ${isToday && isUpcoming ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <p className={`text-xs font-bold leading-tight
              ${isToday && isUpcoming ? 'text-emerald-700' : 'text-slate-700'}`}>
              {new Date(h.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {isToday && isUpcoming && (
              <p className="text-[9px] font-bold text-emerald-600 mt-0.5">TODAY</p>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">
                {h.court_name || 'Court Hearing'}
              </p>
              <HearingStatusBadge status={h.status} />
            </div>

            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
              {h.court_room && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> Room {h.court_room}
                </span>
              )}
              {h.judge_name && (
                <span className="flex items-center gap-1">
                  <Gavel size={11} /> {h.judge_name}
                </span>
              )}
            </div>

            {h.outcome && (
              <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                {h.outcome}
              </p>
            )}

            {h.next_date && (
              <p className="text-xs text-primary-600 font-medium mt-1.5">
                Next: {formatDateTime(h.next_date)}
              </p>
            )}

            {h.replaced_advocate_id && (
              <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg mt-1.5">
                ⚠ Advocate was replaced — {h.replacement_reason}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {isUpcoming && (
            <>
              <button
                onClick={onUpdateOutcome}
                className="btn-secondary btn-sm gap-1 text-xs"
              >
                <CheckCircle size={12} /> Outcome
              </button>
              <button
                onClick={onReplace}
                disabled={replacing}
                className="btn-ghost btn-sm gap-1 text-xs text-amber-600 hover:bg-amber-50"
                title="Mark as absent and auto-assign replacement"
              >
                <RefreshCw size={12} /> Replace
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
