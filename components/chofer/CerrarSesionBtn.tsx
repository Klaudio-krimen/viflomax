'use client'

import { signOut } from 'next-auth/react'

export function CerrarSesionBtn() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-outfit text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors min-h-[44px]"
      aria-label="Cerrar sesión"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span className="hidden sm:inline">Salir</span>
    </button>
  )
}
