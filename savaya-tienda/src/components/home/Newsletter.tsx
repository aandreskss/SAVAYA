'use client'

import { useState } from 'react'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (!supabaseConfigured) {
      setEmail('')
      showToast('¡Listo! Tu 10% OFF llegará pronto a tu correo.', 'success')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    if (error) {
      if (error.code === '23505') {
        showToast('Este correo ya está suscrito.', 'info')
      } else {
        showToast('Hubo un error. Intenta de nuevo.', 'error')
      }
      setLoading(false)
      return
    }

    setEmail('')
    showToast('¡Suscrito! Tu 10% OFF llegará pronto a tu correo.', 'success')
    setLoading(false)
  }

  return (
    <>
      <section className="bg-accent py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-heading text-[10px] tracking-[0.25em] uppercase text-gold mb-4">
            Comunidad Tululú
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            Únete y ahorra desde hoy
          </h2>
          <p className="text-white/60 text-sm md:text-base mb-2 leading-relaxed">
            Suscríbete y obtén{' '}
            <span className="text-gold font-semibold">10% OFF en tu primera compra</span>
          </p>
          <p className="text-white/40 text-xs mb-8">
            Novedades, ofertas exclusivas y acceso anticipado a nuevas colecciones.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded text-black text-sm focus:outline-none placeholder:text-gray-text"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gold text-accent font-heading font-bold text-sm tracking-wide rounded hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0 whitespace-nowrap"
            >
              {loading ? 'Enviando…' : 'Suscribirme'}
            </button>
          </form>

          <p className="text-white/30 text-xs mt-5">
            Sin spam. Puedes cancelar cuando quieras.
          </p>
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}
