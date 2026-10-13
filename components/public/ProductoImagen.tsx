'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * Muestra la foto del producto. Si el archivo no existe todavía,
 * cae a un placeholder de marca en vez de romper la tarjeta.
 */
export function ProductoImagen({ src, alt, sizes }: { src?: string; alt: string; sizes: string }) {
  const [falló, setFalló] = useState(false)

  if (!src || falló) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
        <svg viewBox="0 0 24 24" className="w-16 h-16 fill-viflomax-azul/25" aria-hidden="true">
          <path d="M12 2C8.13 2 5 7.36 5 12a7 7 0 0014 0c0-4.64-3.13-10-7-10z" />
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-contain"
      onError={() => setFalló(true)}
    />
  )
}
