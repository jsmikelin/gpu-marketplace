interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: string
  color?: string
}

export function StatCard({ label, value, sub, icon, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
