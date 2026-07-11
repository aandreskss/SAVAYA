import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-bg flex flex-col">
      <header className="bg-white border-b border-gray-light py-4 flex items-center justify-center px-4">
        <Link href="/" aria-label="Savaya — inicio">
          <Image src="/logo.png" alt="Savaya" width={48} height={48} className="h-12 w-12 object-contain" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-gray-text border-t border-gray-light">
        © {new Date().getFullYear()} Savaya · Todos los derechos reservados
      </footer>
    </div>
  )
}
