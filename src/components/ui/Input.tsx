import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wide mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-11 rounded-xl border bg-gray-50 dark:bg-dark-hover',
              'border-gray-200 dark:border-dark-border',
              'text-gray-900 dark:text-dark-text',
              'placeholder:text-gray-400 dark:placeholder:text-dark-muted',
              'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent',
              'text-sm px-4 transition-all duration-150',
              icon && 'pl-10',
              error && 'border-red-400 focus:ring-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
