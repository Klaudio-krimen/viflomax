import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default async function Icon() {
  const logoUrl = `${process.env.NEXTAUTH_URL ?? 'https://viflomax.vercel.app'}/logo.jpeg`

  return new ImageResponse(
    <div
      style={{
        background: '#ffffff',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} width={32} height={32} style={{ objectFit: 'contain' }} alt="" />
    </div>,
    { ...size }
  )
}
