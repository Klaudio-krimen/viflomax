import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #4db8e8 0%, #1a6ba0 100%)',
        width: '192px',
        height: '192px',
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
          fontSize: 110,
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
          fontSize: 24,
          fontWeight: 600,
          fontFamily: 'sans-serif',
          letterSpacing: '3px',
          marginTop: '-4px',
        }}
      >
        AGUA
      </div>
    </div>,
    { width: 192, height: 192 }
  )
}
