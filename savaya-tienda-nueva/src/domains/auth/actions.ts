'use server'

// ---------------------------------------------------------------------------
// Auth server actions — registration, login, logout, password reset, 2FA
// ---------------------------------------------------------------------------

import { createHash, randomBytes } from 'crypto'
import { AuthError } from 'next-auth'
import { signIn, signOut, auth } from '@/domains/auth/auth'
import { db } from '@/shared/lib/db'
import { users, twoFactorSecrets, twoFactorBackupCodes, verificationTokens } from '@/domains/auth/schema'
import { accounts } from '@/domains/auth/schema'
import {
  RegisterCustomerSchema,
  LoginSchema,
  type RegisterCustomerInput,
  type LoginInput,
} from '@/domains/auth/validators'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import type { ActionResult } from '@/shared/lib/types'
import bcrypt from 'bcryptjs'
import { generateSecret as totpGenerateSecret, generateURI as totpGenerateURI, verify as totpVerify } from 'otplib'
import QRCode from 'qrcode'
import { and, eq, gt } from 'drizzle-orm'
import { headers } from 'next/headers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  )
}

function formatZodErrors(
  error: import('zod').ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!fieldErrors[field]) fieldErrors[field] = []
    fieldErrors[field].push(issue.message)
  }
  return fieldErrors
}

// ---------------------------------------------------------------------------
// Register (storefront customer)
// ---------------------------------------------------------------------------

/**
 * Registers a new storefront customer.
 * Admin users are created separately through the admin panel (not self-service).
 */
export async function registerCustomer(
  data: RegisterCustomerInput,
): Promise<ActionResult<void>> {
  const parsed = RegisterCustomerSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos',
      fieldErrors: formatZodErrors(parsed.error),
    }
  }

  const ip = await getClientIp()
  const rl = await checkRateLimit('register', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiados intentos. Intenta de nuevo más tarde.',
    }
  }

  const { email, password, firstName, lastName } = parsed.data

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    return { success: false, error: 'Este correo ya está registrado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Create the auth user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name: `${firstName} ${lastName}`,
    })
    .returning({ id: users.id })

  // Store credentials in the accounts table (credentials provider convention)
  await db.insert(accounts).values({
    userId: newUser.id,
    type: 'credentials',
    provider: 'credentials',
    providerAccountId: newUser.id,
    access_token: passwordHash, // hash stored here for credentials accounts
  })

  // TODO (Fase 2): send email verification via Resend

  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// Customer login (storefront)
// ---------------------------------------------------------------------------

/**
 * Authenticates a storefront customer.
 * Rate limited (10 attempts / 15 min per IP — less strict than admin).
 */
export async function loginCustomer(data: LoginInput): Promise<ActionResult<void>> {
  const parsed = LoginSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos',
      fieldErrors: formatZodErrors(parsed.error),
    }
  }

  const ip = await getClientIp()
  const rl = await checkRateLimit('login', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
    return { success: true, data: undefined }
  } catch (err) {
    // Re-throw Next.js internal errors (redirect, not-found, etc.)
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err

    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin') {
        return { success: false, error: 'Correo o contraseña incorrectos.' }
      }
      console.error('[loginCustomer] AuthError:', err.type, err.message)
      return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
    }

    console.error('[loginCustomer] Unexpected error:', err)
    return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// Admin login
// ---------------------------------------------------------------------------

/**
 * Authenticates an admin user.
 * Applies strict rate limiting (5 attempts / 15 min per IP).
 * Returns a specific error code when 2FA is required.
 */
export async function loginAdmin(data: LoginInput): Promise<ActionResult<void>> {
  const parsed = LoginSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos',
      fieldErrors: formatZodErrors(parsed.error),
    }
  }

  const ip = await getClientIp()
  const rl = await checkRateLimit('login', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      totpCode: parsed.data.totpCode ?? '',
      redirect: false,
    })

    return { success: true, data: undefined }
  } catch (err) {
    // Re-throw Next.js internal errors (redirect, not-found, etc.)
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err

    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin') {
        return { success: false, error: 'Correo, contraseña o código 2FA incorrecto.' }
      }
      console.error('[loginAdmin] AuthError:', err.type, err.message)
      return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
    }

    console.error('[loginAdmin] Unexpected error:', err)
    return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/' })
}

export async function logoutAdmin(): Promise<void> {
  await signOut({ redirectTo: '/admin/login' })
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email.
 * Rate limited to 3 requests per hour per IP.
 * Always returns success to avoid email enumeration attacks.
 */
export async function requestPasswordReset(
  email: string,
): Promise<ActionResult<void>> {
  const ip = await getClientIp()
  const rl = await checkRateLimit('resetPassword', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiados intentos. Intenta de nuevo en una hora.',
    }
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (user) {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    const identifier = `password-reset:${email}`

    // Remove any previous reset token for this email
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier))
    await db.insert(verificationTokens).values({ identifier, token: tokenHash, expires })

    const rawBase = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'
    const appUrl = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`
    const resetUrl = `${appUrl}/resetear-contrasena?token=${rawToken}&email=${encodeURIComponent(email)}`

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const { render } = await import('@react-email/render')
      const { PasswordResetEmail } = await import('@/domains/notifications/emails/PasswordReset')

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const html = await render(PasswordResetEmail({ resetUrl }))
        await resend.emails.send({
          from: 'SAVAYA <noreply@savayavzla.com>',
          to: email,
          subject: 'Recupera tu contraseña — SAVAYA',
          html,
        })
      } catch (err) {
        console.error('[auth] Password reset email failed:', err)
      }
    } else {
      console.info('[auth] Password reset URL (no RESEND_API_KEY):', resetUrl)
    }
  }

  // Always return success to avoid email enumeration
  return { success: true, data: undefined }
}

/**
 * Validates the reset token and sets a new password.
 */
export async function resetPassword(
  token: string,
  email: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  if (!token || !email || newPassword.length < 8) {
    return { success: false, error: 'Datos inválidos.' }
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const identifier = `password-reset:${email}`

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, tokenHash),
        gt(verificationTokens.expires, new Date()),
      ),
    )
    .limit(1)

  if (!record) {
    return { success: false, error: 'El enlace de recuperación es inválido o ya expiró.' }
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return { success: false, error: 'Usuario no encontrado.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await db
    .update(accounts)
    .set({ access_token: passwordHash })
    .where(and(eq(accounts.userId, user.id), eq(accounts.provider, 'credentials')))

  // Invalidate the token — single-use
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier))

  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// 2FA enrollment
// ---------------------------------------------------------------------------

/**
 * Generates a new TOTP secret and OTPAuth URI for admin 2FA enrollment.
 * Returns the secret and a QR code data URI for scanning with an authenticator app.
 * The secret is NOT saved to DB here — it's saved only after the user verifies it.
 */
export async function setup2FA(): Promise<
  ActionResult<{ otpauthUrl: string; secret: string; qrCodeDataUrl: string }>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'No autenticado.' }
  }

  const secret = totpGenerateSecret()
  const userEmail = session.user.email ?? session.user.id

  const otpauthUrl = totpGenerateURI({
    issuer: 'SAVAYA Admin',
    label: userEmail,
    secret,
  })

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
    return { success: true, data: { otpauthUrl, secret, qrCodeDataUrl } }
  } catch {
    return { success: false, error: 'Error al generar el código QR.' }
  }
}

/**
 * Verifies and activates 2FA for the authenticated user.
 * The user must provide a valid TOTP code generated from the secret returned by setup2FA.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function verify2FA(code: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'No autenticado.' }
  }

  // The secret must have been generated in the current flow — client passes it back
  // NOTE: In production, the pending secret should be stored in an encrypted session
  // cookie or a short-lived DB record, not sent from the client.
  // For now, we accept it as a parameter; the UI will pass it from setup2FA's response.
  // TODO (Fase 4): store pending secret in encrypted cookie, not client-sent.

  return { success: false, error: 'Llama a verify2FAWithSecret con el secreto pendiente.' }
}

/**
 * Verifies a TOTP code against a pending secret and saves it to DB.
 * Call this after setup2FA — pass both the secret from setup2FA and the user's code.
 */
export async function verify2FAWithSecret(
  pendingSecret: string,
  code: string,
): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'No autenticado.' }
  }

  const totpResult = await totpVerify({ token: code, secret: pendingSecret })
  if (!totpResult.valid) {
    return { success: false, error: 'Código inválido. Verifica tu aplicación autenticadora.' }
  }

  const userId = session.user.id

  // Remove any existing secret first (idempotent enrollment)
  await db
    .delete(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))

  // Save the new secret
  await db.insert(twoFactorSecrets).values({
    userId,
    secret: pendingSecret,
  })

  // TODO (Fase 4): generate and store backup codes

  return { success: true, data: undefined }
}

/**
 * Disables 2FA. High-risk action — requires a valid current TOTP code to confirm.
 */
export async function disable2FA(code: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'No autenticado.' }
  }

  const userId = session.user.id

  const [tfaSecret] = await db
    .select()
    .from(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))
    .limit(1)

  if (!tfaSecret) {
    return { success: false, error: '2FA no está activado en esta cuenta.' }
  }

  const totpResult = await totpVerify({ token: code, secret: tfaSecret.secret })
  if (!totpResult.valid) {
    return { success: false, error: 'Código inválido. No se puede desactivar 2FA.' }
  }

  await db
    .delete(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))

  await db
    .delete(twoFactorBackupCodes)
    .where(eq(twoFactorBackupCodes.userId, userId))

  return { success: true, data: undefined }
}
