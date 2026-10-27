import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email'),
  phone:     z.string().optional(),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirm:   z.string(),
  role:      z.enum(['citizen', 'advocate']),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

export default function RegisterPage() {
  const navigate    = useNavigate()
  const { login }   = useAuthStore()
  const [params]    = useSearchParams()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: params.get('role') === 'advocate' ? 'advocate' : 'citizen' },
  })

  const role = watch('role')

  const mutation = useMutation({
    mutationFn: ({ confirm, ...rest }) => authApi.register(rest).then(r => r.data),
    onSuccess: (data) => {
      login(data)
      toast.success(`Account created! Welcome, ${data.full_name}!`)
      navigate(`/${data.role}`, { replace: true })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-3">
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI DocMaster</h1>
          <p className="text-white/60 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Register</h2>

          {/* Role toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-5">
            {['citizen', 'advocate'].map((r) => (
              <label
                key={r}
                className={`flex-1 text-center py-2.5 text-sm font-medium cursor-pointer transition-colors
                  ${role === r ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <input {...register('role')} type="radio" value={r} className="sr-only" />
                {r === 'citizen' ? 'I need legal help' : 'I am an Advocate'}
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('full_name')} type="text" placeholder="Your full name" className={`input ${errors.full_name ? 'input-error' : ''}`} />
              {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input {...register('confirm')} type="password" placeholder="Re-enter password" className={`input ${errors.confirm ? 'input-error' : ''}`} />
              {errors.confirm && <p className="error-text">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full btn-lg mt-2">
              {mutation.isPending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
