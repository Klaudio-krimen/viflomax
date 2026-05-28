import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #4db8e8 0%, #1a6ba0 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '40px',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 100,
          fontWeight: 900,
          fontFamily: 'sans-serif',
          letterSpacing: '-4px',
          lineHeight: 1,
        }}
      >
        V
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 22,
          fontWeight: 600,
          fontFamily: 'sans-serif',
          letterSpacing: '2px',
          marginTop: '-4px',
        }}
      >
        AGUA
      </div>
    </div>,
    { ...size }
  )
}
