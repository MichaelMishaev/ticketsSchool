import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V9C20.4477 9 20 9.44772 20 10C20 10.5523 20.4477 11 21 11V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V11C3.55228 11 4 10.5523 4 10C4 9.44772 3.55228 9 3 9V7Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="white"
          />
          <line x1="10" y1="8" x2="10" y2="16" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="8" x2="14" y2="16" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
