import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'teal' | 'green' | 'amber' | 'red' | 'gray' | 'purple'
  className?: string
}

export function Badge({ children, variant = 'teal', className }: BadgeProps) {
  const variants = {
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900 dark:text-teal-100',
    green: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
    red: 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100',
    gray: 'bg-gray-100 text-gray-600 dark:bg-dark-hover dark:text-dark-muted',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-100',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
