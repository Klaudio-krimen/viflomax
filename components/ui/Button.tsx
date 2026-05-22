import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /**
   * Muestra un mensaje debajo del botón cuando está deshabilitado (no loading).
   * Cumple el principio: "Nunca deshabilitado sin mostrar el motivo."
   */
  disabledReason?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-viflomax-verde hover:bg-viflomax-verde-claro text-white',
  secondary: 'bg-viflomax-azul hover:bg-viflomax-azul-oscuro text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  disabledReason,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const showReason = isDisabled && !loading && disabledReason

  return (
    <div className="w-full">
      <button
        disabled={isDisabled}
        aria-describedby={showReason ? 'btn-disabled-reason' : undefined}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg font-outfit font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-viflomax-azul',
          isDisabled && !loading ? 'opacity-50 cursor-not-allowed' : '',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>

      {showReason && (
        <p
          id="btn-disabled-reason"
          role="status"
          className="mt-1.5 text-xs font-outfit text-amber-700 flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {disabledReason}
        </p>
      )}
    </div>
  )
}
