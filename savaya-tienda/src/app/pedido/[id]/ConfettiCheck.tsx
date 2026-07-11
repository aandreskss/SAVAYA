'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function ConfettiCheck() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        'w-20 h-20 rounded-full bg-green-100 flex items-center justify-center',
        'transition-all duration-500',
        visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
      )}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'transition-all duration-700 delay-200',
            visible ? 'opacity-100' : 'opacity-0',
          )}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  )
}
