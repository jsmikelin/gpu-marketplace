import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

export function formatDateTime(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export function formatMoney(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

export const STATUS_COLORS: Record<string, string> = {
  active:          'bg-green-100 text-green-800',
  pending:         'bg-yellow-100 text-yellow-800',
  suspended:       'bg-red-100 text-red-800',
  approved:        'bg-green-100 text-green-800',
  rejected:        'bg-red-100 text-red-800',
  paid:            'bg-blue-100 text-blue-800',
  processing:      'bg-purple-100 text-purple-800',
  completed:       'bg-gray-100 text-gray-700',
  cancelled:       'bg-red-100 text-red-800',
  refunded:        'bg-orange-100 text-orange-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  disputed:        'bg-red-100 text-red-800',
  draft:           'bg-gray-100 text-gray-600',
  inactive:        'bg-gray-100 text-gray-600',
  none:            'bg-gray-100 text-gray-600',
  verified:        'bg-green-100 text-green-800',
  open:            'bg-blue-100 text-blue-800',
  in_progress:     'bg-purple-100 text-purple-800',
  resolved:        'bg-green-100 text-green-800',
  closed:          'bg-gray-100 text-gray-600',
}
