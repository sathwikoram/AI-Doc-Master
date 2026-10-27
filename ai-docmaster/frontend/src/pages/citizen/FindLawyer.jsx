import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Search, MapPin, Star, Briefcase, Award,
  CheckCircle, Sparkles, Filter, Calendar,
} from 'lucide-react'
import { advocatesApi, aiApi, appointmentsApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import Modal from '../../components/shared/Modal'
import PageHeader from '../../components/shared/PageHeader'
import { getErrorMessage, formatDate } from '../../lib/utils'

export default function FindLawyer() {
  const [search,      setSearch]      = useState('')
  const [city,        setCity]        = useState('')
  const [area,        setArea]        = useState('')
  const [aiDesc,      setAiDesc]      = useState('')
  const [aiResult,    setAiResult]    = useState(null)
  const [bookAdv,     setBookAdv]     = useState(null)
  const [bookDate,    setBookDate]    = useState('')
  const [bookMode,    setBookMode]    = useState('in_person')
  const queryClient = useQueryClient()

  const { data: advocates = [], isLoading } = useQuery({
    queryKey: ['advocates', city, area],
    queryFn:  () => advocatesApi.list({ city: city || undefined, practice_area: area || undefined }).then(r => r.data),
  })

  const aiMutation = useMutation({
    mutationFn: () => aiApi.recommendLawyers({ case_description: aiDesc, location: city }).then(r => r.data),
    onSuccess:  (data) => setAiResult(data),
    onError:    (e)    => toast.error(getErrorMessage(e)),
  })

  const bookMutation = useMutation({
    mutationFn: () => appointmentsApi.book({
      advocate_id: bookAdv.id,
      scheduled_at: new Date(bookDate).toISOString(),
      mode: bookMode,
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
      setBookAdv(null)
      toast.success('Appointment booked successfully!')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtered = advocates.filter(a =>
    !search ||
    a.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.practice_areas?.join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const displayList = aiResult?.recommendations?.length
    ? aiResult.recommendations.map(r => advocates.find(a => a.id === r.advocate_id)).filter(Boolean)
    : filtered

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Find a Lawyer" subtitle="Search verified advocates or let AI recommend the best match" />

      {/* AI Recommendation Box */}
      <div className="card border-primary-100 bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-primary-800">AI Lawyer Recommendation</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Describe your case briefly and let AI find the most suitable advocate.
        </p>
        <div className="flex gap-2">
          <textarea
            value={aiDesc}
            onChange={e => setAiDesc(e.target.value)}
            placeholder="e.g., My employer terminated me without notice and has not paid 3 months salary…"
            rows={2}
            className="input flex-1 resize-none text-sm"
          />
          <button
            onClick={() => aiDesc.trim() && aiMutation.mutate()}
            disabled={!aiDesc.trim() || aiMutation.isPending}
            className="btn-primary self-stretch px-4"
          >
            {aiMutation.isPending ? '…' : 'Match'}
          </button>
        </div>
        {aiResult && (
          <p className="text-xs text-primary-600 mt-2 font-medium">
            ✓ Showing AI-matched results for: <em>{aiResult.case_category}</em>
          </p>
        )}
      </div>

      {/* Manual Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-44">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search advocates…" className="input pl-9" />
        </div>
        <div className="relative flex-1 min-w-36">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City…" className="input pl-9" />
        </div>
        <div className="relative flex-1 min-w-44">
          <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={area} onChange={e => setArea(e.target.value)} placeholder="Practice area…" className="input pl-9" />
        </div>
        {aiResult && (
          <button onClick={() => setAiResult(null)} className="btn-secondary btn-sm">Clear AI filter</button>
        )}
      </div>

      {isLoading ? <FullPageLoader /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayList.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400">
              No advocates found. Try adjusting filters.
            </div>
          ) : displayList.map(adv => (
            <AdvocateCard key={adv.id} adv={adv} onBook={() => setBookAdv(adv)} />
          ))}
        </div>
      )}

      {/* Book appointment modal */}
      <Modal open={!!bookAdv} onClose={() => setBookAdv(null)} title={`Book Appointment — ${bookAdv?.user_name}`}>
        <div className="space-y-4">
          <div>
            <label className="label">Date & Time</label>
            <input
              type="datetime-local"
              value={bookDate}
              onChange={e => setBookDate(e.target.value)}
              min={new Date().toISOString().slice(0,16)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Mode</label>
            <div className="flex gap-2">
              {['in_person','video','phone'].map(m => (
                <button
                  key={m}
                  onClick={() => setBookMode(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors
                    ${bookMode === m ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {m === 'in_person' ? 'In Person' : m === 'video' ? 'Video Call' : 'Phone Call'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setBookAdv(null)} className="btn-secondary">Cancel</button>
          <button
            onClick={() => bookDate && bookMutation.mutate()}
            disabled={!bookDate || bookMutation.isPending}
            className="btn-primary gap-1.5"
          >
            <Calendar size={15} />
            {bookMutation.isPending ? 'Booking…' : 'Book Appointment'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function AdvocateCard({ adv, onBook }) {
  return (
    <div className="card hover:shadow-elevated transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-700 flex-shrink-0">
          {adv.user_name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-800 truncate">{adv.user_name}</p>
            {adv.is_verified && <CheckCircle size={14} className="text-success-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin size={11} /> {adv.city || 'N/A'}{adv.state ? `, ${adv.state}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
          <Star size={12} fill="currentColor" /> {adv.rating?.toFixed(1) || '—'}
        </div>
      </div>

      {/* Practice areas */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(adv.practice_areas || []).slice(0,3).map(a => (
          <span key={a} className="badge-blue text-[10px]">{a}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-800">{adv.years_of_experience}y</p>
          <p className="text-[10px] text-slate-500">Exp</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-800">{adv.total_cases}</p>
          <p className="text-[10px] text-slate-500">Cases</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-800">{adv.win_rate}%</p>
          <p className="text-[10px] text-slate-500">Win Rate</p>
        </div>
      </div>

      <div className="flex gap-2">
        <span className={`flex-1 text-center py-1.5 rounded-xl text-xs font-medium ${
          adv.is_available ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {adv.is_available ? '● Available' : '○ Unavailable'}
        </span>
        <button
          onClick={onBook}
          disabled={!adv.is_available}
          className="btn-primary btn-sm flex-1"
        >
          Book
        </button>
      </div>
    </div>
  )
}
