import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const logoUrl = new URL('/logo.png', request.url).toString()

  return new ImageResponse(
    <div
      style={{
        background: '#ffffff',
        width: '512px',
        height: '512px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} width={448} height={448} style={{ objectFit: 'contain' }} alt="Viflomax" />
    </div>,
    { width: 512, height: 512 }
  )
}
