'use client'

import React, { useState } from 'react'

type PasswordInputProps = {
  label?: string
  error?: string
  helperText?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

function IconOjo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconOjoTachado() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a13.4 13.4 0 0 1-3.1 3.9M6.6 6.6C3.4 8.6 1.5 12 1.5 12s4 7.5 10.5 7.5a10.5 10.5 0 0 0 5.4-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function PasswordInput({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  const ringClasses = error
    ? 'ring-1 ring-red-500 focus:ring-red-500'
    : 'ring-1 ring-gray-300 focus:ring-viflomax-azul'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="font-medium text-sm text-gray-700 font-outfit">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          required={required}
          type={visible ? 'text' : 'password'}
          className={[
            'w-full rounded-lg px-3 py-2 pr-10 text-sm font-outfit text-gray-900',
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
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
        >
          {visible ? <IconOjoTachado /> : <IconOjo />}
        </button>
      </div>
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
