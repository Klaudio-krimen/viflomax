import React, { ReactNode } from 'react'

type CardProps = {
  title?: string
  description?: string
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, description, footer, className = '', children }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-nunito font-semibold text-gray-900 text-lg">{title}</h3>
          {description && (
            <p className="font-outfit text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>
      )}
    </div>
  )
}
