import { Button } from './Button'
import { cn } from '@/shared/lib/utils'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className="text-error"
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 14v12M24 31v2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ErrorState({
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      )}
    >
      <ErrorIcon />

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="font-display font-medium text-xl text-text-primary">
          {title}
        </h3>
        <p className="font-sans text-sm text-text-secondary">{description}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
