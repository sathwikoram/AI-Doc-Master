import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { getErrorMessage } from '../../lib/utils'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate    = useNavigate()
  const { login }   = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data) => authApi.login(data).then(r => r.data),
    onSuccess: (data) => {
      login(data)
      toast.success(`Welcome back, ${data.full_name}!`)
      navigate(`/${data.role}`, { replace: true })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-3">
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI DocMaster</h1>
          <p className="text-white/60 text-sm mt-1">Intelligent Legal Assistance Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary w-full btn-lg mt-2"
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
