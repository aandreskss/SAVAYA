import { cn } from '@/lib/utils'
import type { CheckoutStep } from '@/lib/types'

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'shipping', label: 'Información' },
  { id: 'method', label: 'Entrega' },
  { id: 'payment', label: 'Pago' },
]

interface CheckoutStepsProps {
  current: CheckoutStep
}

export default function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <nav className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-2',
            i <= currentIndex ? 'text-black' : 'text-gray-text'
          )}>
            <span className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2',
              i < currentIndex ? 'bg-black text-white border-black' :
              i === currentIndex ? 'border-black text-black' :
              'border-gray-light text-gray-text'
            )}>
              {i < currentIndex ? '✓' : i + 1}
            </span>
            <span className="text-sm font-medium hidden sm:block">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('w-8 h-px', i < currentIndex ? 'bg-black' : 'bg-gray-light')} />
          )}
        </div>
      ))}
    </nav>
  )
}
