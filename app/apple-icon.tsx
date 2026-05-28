import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default async function AppleIcon() {
  // logo.png debe estar en /public/logo.png
  const logoUrl = `${process.env.NEXTAUTH_URL ?? 'https://viflomax.vercel.app'}/logo.png`

  return new ImageResponse(
    <div
      style={{
        background: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} width={160} height={160} style={{ objectFit: 'contain' }} alt="Viflomax" />
    </div>,
    { ...size }
  )
}
