import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-dark-card',
        'border border-gray-100 dark:border-dark-border',
        'rounded-2xl',
        hover && 'cursor-pointer hover:shadow-md hover:border-teal-100 dark:hover:border-dark-hover transition-all duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
