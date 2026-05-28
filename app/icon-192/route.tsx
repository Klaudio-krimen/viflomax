import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const logoUrl = new URL('/logo.jpeg', request.url).toString()

  return new ImageResponse(
    <div
      style={{
        background: '#ffffff',
        width: '192px',
        height: '192px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} width={168} height={168} style={{ objectFit: 'contain' }} alt="Viflomax" />
    </div>,
    { width: 192, height: 192 }
  )
}
