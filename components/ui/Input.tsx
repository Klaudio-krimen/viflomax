import React from 'react'

type InputProps = {
  label?: string
  error?: string
  helperText?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export function Input({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  const ringClasses = error
    ? 'ring-1 ring-red-500 focus:ring-red-500'
    : 'ring-1 ring-gray-300 focus:ring-viflomax-azul'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="font-medium text-sm text-gray-700 font-outfit"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={[
          'w-full rounded-lg px-3 py-2 text-sm font-outfit text-gray-900',
          'bg-white outline-none transition-shadow',
          'placeholder:text-gray-400',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          ringClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
            ? `${inputId}-helper`
            : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600 font-outfit" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-sm text-gray-500 font-outfit">
          {helperText}
        </p>
      )}
    </div>
  )
}
