'use client'

import { useEffect, useState, useCallback } from 'react'

// Min/max ms between butterfly appearances
const MIN_INTERVAL = 28_000
const MAX_INTERVAL = 55_000
const FLIGHT_DURATION = 7_000

function randomBetween(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

export function ButterflyEffect() {
  const [visible, setVisible] = useState(false)
  const [top, setTop] = useState(30)       // % of viewport height
  const [fromRight, setFromRight] = useState(false)

  const fly = useCallback(() => {
    setTop(randomBetween(12, 72))
    setFromRight(Math.random() > 0.5)
    setVisible(true)
    setTimeout(() => setVisible(false), FLIGHT_DURATION)
  }, [])

  useEffect(() => {
    // First appearance: random delay 10-22s after page load
    const firstDelay = randomBetween(10_000, 22_000)
    let timeout: ReturnType<typeof setTimeout>

    function schedule() {
      const interval = randomBetween(MIN_INTERVAL, MAX_INTERVAL)
      timeout = setTimeout(() => {
        fly()
        schedule()
      }, interval)
    }

    const initial = setTimeout(() => {
      fly()
      schedule()
    }, firstDelay)

    return () => {
      clearTimeout(initial)
      clearTimeout(timeout)
    }
  }, [fly])

  if (!visible) return null

  // The Savaya wings SVG — brand mark used as butterfly
  const size = 52
  const flipX = fromRight ? 'scaleX(-1)' : 'scaleX(1)'
  const startX = fromRight ? '105vw' : '-120px'

  return (
    <div
      aria-hidden="true"
      className="fixed z-[9998] pointer-events-none"
      style={{
        top: `${top}vh`,
        left: 0,
        width: '100vw',
        height: 0,
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: startX,
          animation: `butterfly-fly ${FLIGHT_DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards`,
          transform: flipX,
        }}
      >
        {/* Wings — two halves flapping at offset phases */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(201,162,39,0.5))' }}
        >
          {/* Left wing */}
          <g
            style={{
              transformOrigin: '50px 50px',
              animation: 'wing-flap 220ms ease-in-out infinite',
            }}
          >
            <path
              d="M50 20 C35 10, 10 20, 12 42 C14 60, 32 68, 50 78 C50 78, 50 78, 50 20Z"
              fill="url(#gold-l)"
              opacity="0.95"
            />
          </g>
          {/* Right wing */}
          <g
            style={{
              transformOrigin: '50px 50px',
              animation: 'wing-flap 220ms ease-in-out 110ms infinite',
            }}
          >
            <path
              d="M50 20 C65 10, 90 20, 88 42 C86 60, 68 68, 50 78 C50 78, 50 78, 50 20Z"
              fill="url(#gold-r)"
              opacity="0.95"
            />
          </g>
          <defs>
            <linearGradient id="gold-l" x1="12" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5D980" />
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#A07A10" />
            </linearGradient>
            <linearGradient id="gold-r" x1="88" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5D980" />
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#A07A10" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
