'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { savePopupConfig, togglePopupActive } from '@/app/dashboard/popup/actions'
import type { PopupConfig } from '@/lib/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  is_active: z.boolean(),
  title: z.string().max(80, 'Máx. 80 caracteres'),
  subtitle: z.string().max(120, 'Máx. 120 caracteres'),
  body: z.string().max(300, 'Máx. 300 caracteres'),
  image_url: z.string(),
  cta_text: z.string().max(40, 'Máx. 40 caracteres'),
  cta_href: z.string(),
  discount_code: z.string().max(20, 'Máx. 20 caracteres'),
  delay_seconds: z.number().min(0).max(30),
})

type FormValues = z.infer<typeof schema>

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full border border-gray-light rounded px-3 py-2.5 text-sm font-body focus:border-black focus:outline-none transition-colors'
const LABEL = 'block text-sm font-heading font-semibold text-black mb-1.5'
const ERROR = 'text-xs text-sale font-body mt-1'

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  config: PopupConfig | null
}

export default function PopupForm({ config }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isToggling, startToggle] = useTransition()
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_active: config?.is_active ?? false,
      title: config?.title ?? '',
      subtitle: config?.subtitle ?? '',
      body: config?.body ?? '',
      image_url: config?.image_url ?? '',
      cta_text: config?.cta_text ?? '',
      cta_href: config?.cta_href ?? '',
      discount_code: config?.discount_code ?? '',
      delay_seconds: config?.delay_seconds ?? 3,
    },
  })

  const isActive = watch('is_active')
  const imageUrl = watch('image_url')
  const discountCode = watch('discount_code')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json() as { url?: string; error?: string }
      if (json.url) setValue('image_url', json.url, { shouldValidate: true })
    } finally {
      setUploading(false)
    }
  }

  function handleToggle() {
    startToggle(async () => {
      await togglePopupActive(!isActive)
      setValue('is_active', !isActive)
    })
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    setSaved(false)
    startTransition(async () => {
      const result = await savePopupConfig(values)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-heading font-bold text-black">Popup promocional</h1>
        <div className="flex items-center gap-3">
          {/* Quick toggle */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex items-center gap-2 text-sm font-heading font-semibold px-4 py-2.5 rounded border-2 transition-colors ${
              isActive
                ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100'
                : 'border-gray-light text-gray-text hover:border-gray-text'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-600 animate-pulse' : 'bg-gray-text'}`} />
            {isActive ? 'Activo' : 'Inactivo'}
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saved ? '✓ Guardado' : isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-sale font-body">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Imagen */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Imagen del popup</h2>
            <input type="hidden" {...register('image_url')} />

            {imageUrl ? (
              <div className="relative rounded overflow-hidden aspect-[16/9] bg-gray-bg mb-3">
                <Image src={imageUrl} alt="Preview popup" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setValue('image_url', '')}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-light rounded aspect-[16/9] flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors bg-gray-bg/50"
              >
                {uploading ? (
                  <span className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="text-gray-text mb-2" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-sm text-gray-text font-body">Haz clic para subir imagen</p>
                    <p className="text-[11px] text-gray-text font-body mt-1">JPG, PNG · Máx. 5 MB</p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {!imageUrl && (
              <div className="mt-3">
                <label className={LABEL}>O ingresa una URL de imagen</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className={INPUT}
                  onChange={(e) => setValue('image_url', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Texto */}
          <div className="bg-white rounded border border-gray-light p-5 space-y-4">
            <h2 className="text-sm font-heading font-semibold text-black mb-1">Contenido</h2>

            <div>
              <label className={LABEL}>Título *</label>
              <input {...register('title')} className={INPUT} placeholder="¡Bienvenido! 10% OFF en tu primera compra" />
              {errors.title && <p className={ERROR}>{errors.title.message}</p>}
            </div>

            <div>
              <label className={LABEL}>Subtítulo <span className="font-body font-normal text-gray-text">(opcional)</span></label>
              <input {...register('subtitle')} className={INPUT} placeholder="Usa el código al finalizar tu compra" />
              {errors.subtitle && <p className={ERROR}>{errors.subtitle.message}</p>}
            </div>

            <div>
              <label className={LABEL}>Descripción <span className="font-body font-normal text-gray-text">(opcional)</span></label>
              <textarea
                {...register('body')}
                rows={3}
                className={INPUT}
                placeholder="Válido en tu primera compra. No aplica con otras promociones..."
              />
              {errors.body && <p className={ERROR}>{errors.body.message}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Estado */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Estado</h2>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('is_active')}
                className="mt-0.5 w-4 h-4 rounded accent-black cursor-pointer"
              />
              <div>
                <p className="text-sm font-body font-medium text-black group-hover:text-accent transition-colors">
                  Popup activo
                </p>
                <p className="text-[11px] text-gray-text font-body">
                  Se mostrará a los visitantes de la tienda
                </p>
              </div>
            </label>
          </div>

          {/* CTA */}
          <div className="bg-white rounded border border-gray-light p-5 space-y-4">
            <h2 className="text-sm font-heading font-semibold text-black">Botón de acción</h2>
            <div>
              <label className={LABEL}>Texto del botón</label>
              <input {...register('cta_text')} className={INPUT} placeholder="Ver colección" />
              {errors.cta_text && <p className={ERROR}>{errors.cta_text.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Enlace del botón</label>
              <input {...register('cta_href')} className={INPUT} placeholder="/nuevas-colecciones" />
            </div>
          </div>

          {/* Código de descuento */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">
              Código de descuento{' '}
              <span className="font-body font-normal text-gray-text">(opcional)</span>
            </h2>
            <input
              {...register('discount_code', {
                onChange: (e) => { e.target.value = e.target.value.toUpperCase() },
              })}
              className={`${INPUT} font-heading font-bold tracking-widest uppercase`}
              placeholder="BIENVENIDO10"
              maxLength={20}
            />
            {discountCode && (
              <p className="text-[11px] text-gray-text font-body mt-1.5">
                El cliente podrá copiarlo con un clic
              </p>
            )}
          </div>

          {/* Delay */}
          <div className="bg-white rounded border border-gray-light p-5">
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Retraso al mostrar</h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={30}
                {...register('delay_seconds', { valueAsNumber: true })}
                className={`${INPUT} w-24`}
              />
              <span className="text-sm text-gray-text font-body">segundos</span>
            </div>
            <p className="text-[11px] text-gray-text font-body mt-1.5">
              0 = aparece de inmediato. Recomendado: 3–5 s.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom save */}
      <div className="mt-6 flex items-center justify-end gap-3 py-4 border-t border-gray-light">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-6 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {saved ? '✓ Guardado' : isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
