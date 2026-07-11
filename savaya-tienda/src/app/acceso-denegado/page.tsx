import Link from 'next/link'
import Image from 'next/image'

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-full bg-gray-bg border-2 border-gray-light flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              className="text-gray-text"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-bold mb-3">
            Ups, no tienes permiso
          </h1>
          <p className="text-gray-text mb-2">
            Esta página es exclusiva para el equipo de administración de Savaya.
          </p>
          <p className="text-gray-text text-sm mb-8">
            Si llegaste aquí por error, vuelve al inicio o revisa tus pedidos desde tu cuenta.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-8 py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
            >
              VOLVER AL INICIO
            </Link>
            <Link
              href="/cuenta/pedidos"
              className="px-8 py-3.5 border-2 border-black font-heading font-bold text-sm tracking-widest rounded hover:bg-black hover:text-white transition-colors"
            >
              MIS PEDIDOS
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
