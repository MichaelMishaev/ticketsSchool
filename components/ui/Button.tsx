import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { buttonVariants, buttonSizes } from '@/lib/design-tokens'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variantClasses = buttonVariants[variant]
  const sizeClasses = buttonSizes[size]
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  )
}
