'use client'

import { useState, useTransition } from 'react'
import { setup2FA, verify2FAWithSecret, disable2FA } from '@/domains/auth/actions'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { toast } from '@/shared/ui/Toast'
import { cn } from '@/shared/lib/utils'

interface Props {
  user: { name: string | null; email: string }
  has2FA: boolean
}

type SetupStep = 'idle' | 'scanning' | 'done'
type DisableStep = 'idle' | 'confirming'

export function ProfileManager({ user, has2FA }: Props) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(has2FA)
  const [setupStep, setSetupStep] = useState<SetupStep>('idle')
  const [disableStep, setDisableStep] = useState<DisableStep>('idle')

  const [qrCode, setQrCode] = useState('')
  const [pendingSecret, setPendingSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const [isPending, startTransition] = useTransition()

  function handleStartSetup() {
    startTransition(async () => {
      const result = await setup2FA()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setQrCode(result.data.qrCodeDataUrl)
      setPendingSecret(result.data.secret)
      setSetupStep('scanning')
    })
  }

  function handleVerify() {
    if (verifyCode.length !== 6) return
    startTransition(async () => {
      const result = await verify2FAWithSecret(pendingSecret, verifyCode)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setTwoFAEnabled(true)
      setSetupStep('done')
      setVerifyCode('')
      setPendingSecret('')
      setQrCode('')
      toast.success('2FA activado correctamente')
    })
  }

  function handleDisable() {
    if (disableCode.length !== 6) return
    startTransition(async () => {
      const result = await disable2FA(disableCode)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setTwoFAEnabled(false)
      setDisableStep('idle')
      setDisableCode('')
      setSetupStep('idle')
      toast.success('2FA desactivado')
    })
  }

  function handleCancelDisable() {
    setDisableStep('idle')
    setDisableCode('')
  }

  function handleCancelSetup() {
    setSetupStep('idle')
    setVerifyCode('')
    setPendingSecret('')
    setQrCode('')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Mi perfil</h1>
        <p className="text-sm text-text-secondary mt-1">
          Información de tu cuenta de administrador
        </p>
      </div>

      {/* Info de la cuenta */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Cuenta
        </h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-text-secondary">Nombre</dt>
            <dd className="text-sm text-text-primary mt-0.5">{user.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Correo</dt>
            <dd className="text-sm text-text-primary mt-0.5">{user.email}</dd>
          </div>
        </dl>
      </section>

      {/* 2FA */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Autenticación de dos factores
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {twoFAEnabled
                ? 'Tu cuenta está protegida con 2FA.'
                : 'Agrega una capa extra de seguridad con una app autenticadora.'}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
              twoFAEnabled
                ? 'bg-success/15 text-success'
                : 'bg-white/6 text-text-secondary',
            )}
          >
            {twoFAEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* ── Estado: sin 2FA, sin flujo activo ── */}
        {!twoFAEnabled && setupStep === 'idle' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStartSetup}
            isLoading={isPending}
          >
            Activar autenticación de dos factores
          </Button>
        )}

        {/* ── Estado: escaneando QR ── */}
        {!twoFAEnabled && setupStep === 'scanning' && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary">
              Escanea este código QR con tu app autenticadora (Google Authenticator, Authy, 1Password, etc.)
            </p>

            {qrCode && (
              <div className="inline-block bg-white p-3 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="Código QR para 2FA" width={180} height={180} />
              </div>
            )}

            <details className="group">
              <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary select-none">
                No puedo escanear — ingresar clave manualmente
              </summary>
              <code className="block mt-2 p-3 bg-surface rounded-lg font-mono text-xs break-all select-all text-text-primary border border-border">
                {pendingSecret}
              </code>
            </details>

            <div className="space-y-2">
              <p className="text-sm text-text-primary font-medium">
                Ingresa el código de 6 dígitos para confirmar:
              </p>
              <div className="flex gap-3 items-end flex-wrap">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="w-36 font-mono text-center tracking-[0.3em] text-lg"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleVerify}
                  isLoading={isPending}
                  disabled={verifyCode.length !== 6}
                >
                  Verificar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelSetup}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Estado: 2FA activo, sin flujo de desactivación ── */}
        {twoFAEnabled && disableStep === 'idle' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisableStep('confirming')}
            className="text-error hover:text-error hover:bg-error/8"
          >
            Desactivar 2FA
          </Button>
        )}

        {/* ── Estado: confirmando desactivación ── */}
        {twoFAEnabled && disableStep === 'confirming' && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Ingresa tu código actual de 6 dígitos para confirmar la desactivación:
            </p>
            <div className="flex gap-3 items-end flex-wrap">
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="w-36 font-mono text-center tracking-[0.3em] text-lg"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisable}
                isLoading={isPending}
                disabled={disableCode.length !== 6}
              >
                Confirmar desactivación
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelDisable}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
