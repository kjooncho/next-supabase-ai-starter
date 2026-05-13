import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'realUse'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--color-accent)] text-white border-transparent',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-accent)] border border-[var(--color-accent)]',
  ghost:     'bg-transparent text-[var(--text-primary)] border-transparent',
  danger:    'bg-[var(--color-surface)] text-[var(--color-error)] border border-[var(--color-error)]',
  realUse:   'bg-[var(--color-real-use)] text-white border-transparent',
}

const sizeStyles: Record<Size, string> = {
  sm: 'text-[12px] px-3 py-1.5 rounded-lg',
  md: 'text-[13px] px-4 py-2 rounded-xl',
  lg: 'text-[14px] px-5 py-2.5 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'font-medium transition-opacity active:opacity-70',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
