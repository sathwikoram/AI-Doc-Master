import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sparkles, ArrowLeft, FileText, MapPin, Tag } from 'lucide-react'
import { casesApi } from '../../lib/api'
import { getErrorMessage } from '../../lib/utils'
import PageHeader from '../../components/shared/PageHeader'
import { Link } from 'react-router-dom'

const schema = z.object({
  title:          z.string().min(10, 'Title must be at least 10 characters'),
  description:    z.string().min(50, 'Please describe your issue in at least 50 characters'),
  priority:       z.enum(['low','medium','high','urgent']),
  court_location: z.string().optional(),
  tags_raw:       z.string().optional(),
})

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low — Not time sensitive',   color: 'text-slate-600' },
  { value: 'medium', label: 'Medium — Needs attention',   color: 'text-blue-600' },
  { value: 'high',   label: 'High — Urgent matter',        color: 'text-amber-600' },
  { value: 'urgent', label: 'Urgent — Immediate action!',  color: 'text-red-600' },
]

export default function SubmitCase() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  })

  const desc = watch('description') || ''

  const mutation = useMutation({
    mutationFn: ({ tags_raw, ...rest }) => {
      const tags = tags_raw ? tags_raw.split(',').map(t => t.trim()).filter(Boolean) : []
      return casesApi.create({ ...rest, tags }).then(r => r.data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['citizen-cases'])
      toast.success('Case submitted! AI is analyzing your case…')
      navigate(`/citizen/cases/${data.id}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Submit New Case"
        subtitle="Describe your legal issue and our AI will analyze and guide you"
        action={
          <Link to="/citizen/cases" className="btn-secondary btn-sm gap-1">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      {/* AI notice */}
      <div className="flex gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 mb-6">
        <Sparkles size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-800">AI-Powered Analysis</p>
          <p className="text-xs text-primary-600 mt-0.5 leading-relaxed">
            After submission, our AI will automatically classify your case, suggest applicable
            laws, recommend suitable advocates, and generate a document checklist.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(mutation.mutate)} className="card space-y-5">
        {/* Title */}
        <div>
          <label className="label flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" /> Case Title
          </label>
          <input
            {...register('title')}
            placeholder="e.g., Property encroachment by neighbour on my land"
            className={`input ${errors.title ? 'input-error' : ''}`}
          />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label flex items-center justify-between">
            <span>Case Description</span>
            <span className={`text-xs ${desc.length < 50 ? 'text-danger-500' : 'text-slate-400'}`}>
              {desc.length} / 50+ chars
            </span>
          </label>
          <textarea
            {...register('description')}
            rows={7}
            placeholder="Describe your legal issue in detail. Include:
• What happened and when
• Who is involved (no personal data needed)
• What outcome you're seeking
• Any previous attempts to resolve it

The more detail you provide, the better the AI analysis."
            className={`input resize-none leading-relaxed ${errors.description ? 'input-error' : ''}`}
          />
          {errors.description && <p className="error-text">{errors.description.message}</p>}
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priority Level</label>
          <div className="grid grid-cols-2 gap-2.5">
            {PRIORITY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200
                           cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors
                           has-[:checked]:border-primary-400 has-[:checked]:bg-primary-50"
              >
                <input
                  {...register('priority')}
                  type="radio"
                  value={opt.value}
                  className="accent-primary-600"
                />
                <span className={`text-xs font-medium ${opt.color}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" /> Court Location
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            {...register('court_location')}
            placeholder="e.g., Chennai, Tamil Nadu"
            className="input"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Tag size={14} className="text-slate-400" /> Tags
            <span className="text-slate-400 font-normal">(optional — comma separated)</span>
          </label>
          <input
            {...register('tags_raw')}
            placeholder="e.g., property, land, boundary"
            className="input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Link to="/citizen/cases" className="btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary gap-2"
          >
            <Sparkles size={16} />
            {mutation.isPending ? 'Submitting…' : 'Submit & Analyze'}
          </button>
        </div>
      </form>
    </div>
  )
}
