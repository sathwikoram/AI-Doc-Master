import { Link } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center mb-6">
        <Scale size={36} className="text-primary-600" />
      </div>
      <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-2">Page not found</h2>
      <p className="text-slate-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </div>
  )
}
