import { STATUS_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

export function Badge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700', className)}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
