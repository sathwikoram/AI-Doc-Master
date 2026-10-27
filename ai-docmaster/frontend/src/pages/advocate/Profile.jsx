import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Star, Briefcase, MapPin, Award, Phone, Camera } from 'lucide-react'
import { usersApi, advocatesApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import PageHeader from '../../components/shared/PageHeader'
import { getErrorMessage } from '../../lib/utils'

const PRACTICE_AREAS = [
  'Criminal', 'Property Dispute', 'Family Law', 'Labour & Employment',
  'Consumer Dispute', 'Civil', 'Constitutional/Public Law', 'Cyber Crime',
  'Corporate Law', 'Tax Law', 'Intellectual Property', 'Banking & Finance',
]

export default function AdvocateProfile() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me().then(r => r.data),
  })

  const { data: advocate, isLoading: advLoading } = useQuery({
    queryKey: ['advocate-me'],
    queryFn:  () => advocatesApi.me().then(r => r.data),
  })

  const { register: uReg, handleSubmit: uSubmit, reset: uReset, formState: { errors: uErr, isDirty: uDirty } } = useForm()
  const { register: aReg, handleSubmit: aSubmit, reset: aReset, control, watch, formState: { errors: aErr, isDirty: aDirty } } = useForm()

  useEffect(() => {
    if (me) uReset({ full_name: me.full_name, phone: me.phone || '', address: me.address || '' })
  }, [me, uReset])

  useEffect(() => {
    if (advocate) {
      aReset({
        qualification:        advocate.qualification || '',
        years_of_experience:  advocate.years_of_experience || 0,
        practice_areas:       advocate.practice_areas || [],
        court_location:       advocate.court_location || '',
        city:                 advocate.city || '',
        state:                advocate.state || '',
        profile_bio:          advocate.profile_bio || '',
        languages:            advocate.languages?.join(', ') || '',
        is_available:         advocate.is_available ?? true,
        availability_note:    advocate.availability_note || '',
      })
    }
  }, [advocate, aReset])

  const updateUserMutation = useMutation({
    mutationFn: (data) => usersApi.updateMe(data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
      updateUser({ full_name: data.full_name })
      toast.success('Personal info updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateAdvMutation = useMutation({
    mutationFn: ({ languages: lang, ...rest }) => {
      const languages = lang ? lang.split(',').map(l => l.trim()).filter(Boolean) : []
      return advocatesApi.updateMe({ ...rest, languages }).then(r => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['advocate-me'], data)
      toast.success('Professional profile updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return usersApi.uploadAvatar(form).then(r => r.data)
    },
    onSuccess: (data) => { queryClient.setQueryData(['me'], data); toast.success('Avatar updated') },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const selectedAreas = watch('practice_areas') || []

  if (meLoading || advLoading) return <FullPageLoader />

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="Advocate Profile" subtitle="Manage your professional and personal information" />

      {/* Avatar + quick stats */}
      <div className="card flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 overflow-hidden">
            {me?.profile_picture
              ? <img src={me.profile_picture} alt="avatar" className="w-full h-full object-cover" />
              : me?.full_name?.[0]?.toUpperCase()
            }
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-700">
            <Camera size={13} className="text-white" />
            <input type="file" accept="image/*" className="sr-only"
              onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])} />
          </label>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">{me?.full_name}</p>
          <p className="text-sm text-slate-500">{me?.email}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Briefcase size={12} /> {advocate?.total_cases || 0} cases</span>
            <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {advocate?.rating?.toFixed(1) || '0.0'}</span>
            <span className="flex items-center gap-1"><Award size={12} /> {advocate?.win_rate || 0}% win rate</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {advocate?.is_verified
              ? <span className="badge-green text-[10px]">✓ Verified Advocate</span>
              : <span className="badge-amber text-[10px]">⏳ Pending Verification</span>
            }
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${advocate?.is_available ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>
              {advocate?.is_available ? '● Available' : '○ Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal info form */}
      <form onSubmit={uSubmit(updateUserMutation.mutate)} className="card space-y-4">
        <h3 className="section-title">Personal Information</h3>
        <div>
          <label className="label">Full Name</label>
          <input {...uReg('full_name', { required: 'Required' })} className={`input ${uErr.full_name ? 'input-error' : ''}`} />
          {uErr.full_name && <p className="error-text">{uErr.full_name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone</label>
            <input {...uReg('phone')} placeholder="+91 98765 43210" className="input" />
          </div>
          <div>
            <label className="label">Address</label>
            <input {...uReg('address')} placeholder="Office address" className="input" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={!uDirty || updateUserMutation.isPending} className="btn-primary gap-2">
            <Save size={15} /> {updateUserMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      {/* Professional info form */}
      {advocate && (
        <form onSubmit={aSubmit(updateAdvMutation.mutate)} className="card space-y-4">
          <h3 className="section-title">Professional Information</h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500">Bar Council Number</p>
            <p className="text-sm font-medium text-slate-800">{advocate.bar_council_number}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Qualification</label>
              <input {...aReg('qualification')} placeholder="e.g., LLB, LLM" className="input" />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input {...aReg('years_of_experience', { valueAsNumber: true })} type="number" min="0" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">City</label>
              <input {...aReg('city')} placeholder="Chennai" className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input {...aReg('state')} placeholder="Tamil Nadu" className="input" />
            </div>
            <div>
              <label className="label">Court Location</label>
              <input {...aReg('court_location')} placeholder="e.g., High Court" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Practice Areas</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {PRACTICE_AREAS.map(area => (
                <label key={area}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs
                    ${selectedAreas.includes(area)
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    value={area}
                    {...aReg('practice_areas')}
                    className="accent-emerald-600"
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Profile Bio</label>
            <textarea {...aReg('profile_bio')} rows={4} placeholder="Describe your expertise, experience, and notable cases…" className="input resize-none" />
          </div>

          <div>
            <label className="label">Languages <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input {...aReg('languages')} placeholder="English, Tamil, Hindi" className="input" />
          </div>

          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...aReg('is_available')} type="checkbox" className="accent-emerald-600 w-4 h-4" />
              <span className="text-sm font-medium text-slate-700">Available for new cases</span>
            </label>
          </div>

          {!watch('is_available') && (
            <div>
              <label className="label">Unavailability Note</label>
              <input {...aReg('availability_note')} placeholder="e.g., On leave until Jan 2025" className="input" />
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={!aDirty || updateAdvMutation.isPending} className="btn-primary gap-2">
              <Save size={15} /> {updateAdvMutation.isPending ? 'Saving…' : 'Save Professional Info'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
