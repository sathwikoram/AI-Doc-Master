import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { UserCircle, Save, Camera } from 'lucide-react'
import { usersApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import PageHeader from '../../components/shared/PageHeader'
import { getErrorMessage } from '../../lib/utils'
import { useEffect } from 'react'

export default function CitizenProfile() {
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me().then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm()

  useEffect(() => {
    if (me) reset({ full_name: me.full_name, phone: me.phone || '', address: me.address || '' })
  }, [me, reset])

  const updateMutation = useMutation({
    mutationFn: (data) => usersApi.updateMe(data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
      updateUser({ full_name: data.full_name })
      toast.success('Profile updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('file', file)
      return usersApi.uploadAvatar(form).then(r => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
      toast.success('Profile picture updated')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <FullPageLoader />

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      {/* Avatar */}
      <div className="card flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700 overflow-hidden">
            {me?.profile_picture
              ? <img src={me.profile_picture} alt="avatar" className="w-full h-full object-cover" />
              : me?.full_name?.[0]?.toUpperCase()
            }
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-lg flex items-center
                             justify-center cursor-pointer hover:bg-primary-700 transition-colors">
            <Camera size={13} className="text-white" />
            <input
              type="file" accept="image/*" className="sr-only"
              onChange={e => e.target.files[0] && avatarMutation.mutate(e.target.files[0])}
            />
          </label>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{me?.full_name}</p>
          <p className="text-sm text-slate-500">{me?.email}</p>
          <span className="badge-blue mt-1 capitalize">{me?.role}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(updateMutation.mutate)} className="card space-y-4">
        <h3 className="section-title">Personal Information</h3>

        <div>
          <label className="label">Full Name</label>
          <input {...register('full_name', { required: 'Required' })} className={`input ${errors.full_name ? 'input-error' : ''}`} />
          {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input {...register('phone')} placeholder="+91 98765 43210" className="input" />
        </div>

        <div>
          <label className="label">Address</label>
          <textarea {...register('address')} rows={3} placeholder="Your address…" className="input resize-none" />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Email (cannot be changed)</p>
          <p className="text-sm font-medium text-slate-700">{me?.email}</p>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={!isDirty || updateMutation.isPending} className="btn-primary gap-2">
            <Save size={15} /> {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account info */}
      <div className="card-sm">
        <p className="text-xs text-slate-500">Account Status</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${me?.is_active ? 'bg-success-500' : 'bg-danger-500'}`} />
          <span className="text-sm font-medium text-slate-700">{me?.is_active ? 'Active' : 'Deactivated'}</span>
        </div>
      </div>
    </div>
  )
}
