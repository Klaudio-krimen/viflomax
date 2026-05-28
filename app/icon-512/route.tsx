import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #4db8e8 0%, #1a6ba0 100%)',
        width: '512px',
        height: '512px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // No border radius — maskable icon needs content within 80% safe zone
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 300,
          fontWeight: 900,
          fontFamily: 'sans-serif',
          letterSpacing: '-12px',
          lineHeight: 1,
        }}
      >
        V
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.80)',
          fontSize: 64,
          fontWeight: 600,
          fontFamily: 'sans-serif',
          letterSpacing: '10px',
          marginTop: '-16px',
        }}
      >
        AGUA
      </div>
    </div>,
    { width: 512, height: 512 }
  )
}
