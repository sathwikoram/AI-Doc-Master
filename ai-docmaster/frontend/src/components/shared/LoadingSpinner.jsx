import { cn } from '../../lib/utils'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin',
        sizes[size]
      )} />
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 mt-3">Loading…</p>
      </div>
    </div>
  )
}
