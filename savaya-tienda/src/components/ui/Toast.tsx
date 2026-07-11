'use client'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
}

const styles = {
  success: 'bg-black text-white',
  error: 'bg-sale text-white',
  info: 'bg-accent text-white',
}

export default function Toast({ message, type = 'success' }: ToastProps) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded text-sm font-heading font-semibold shadow-lg ${styles[type]}`}>
      {message}
    </div>
  )
}
