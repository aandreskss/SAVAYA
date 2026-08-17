import { describe, it, expect } from 'vitest'
import { RegisterCustomerSchema, LoginSchema, ResetPasswordSchema } from '@/domains/auth/validators'

// ---------------------------------------------------------------------------
// RegisterCustomerSchema
// ---------------------------------------------------------------------------

describe('RegisterCustomerSchema', () => {
  it('falla si la contraseña tiene menos de 8 caracteres', () => {
    const result = RegisterCustomerSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@ejemplo.com',
      phone: '04121234567',
      password: 'abc123', // 6 chars
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordError = result.error.issues.some(
        (i) => i.path.includes('password'),
      )
      expect(passwordError).toBe(true)
    }
  })

  it('falla si el email es inválido', () => {
    const result = RegisterCustomerSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      email: 'no-es-un-email',
      phone: '04121234567',
      password: 'contraseña123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.some(
        (i) => i.path.includes('email'),
      )
      expect(emailError).toBe(true)
    }
  })

  it('pasa con datos válidos', () => {
    const result = RegisterCustomerSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@ejemplo.com',
      phone: '04121234567',
      password: 'contraseña-segura-123',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// LoginSchema
// ---------------------------------------------------------------------------

describe('LoginSchema', () => {
  it('falla si el email es inválido', () => {
    const result = LoginSchema.safeParse({
      email: 'invalido',
      password: 'cualquier-cosa',
    })
    expect(result.success).toBe(false)
  })

  it('falla si la contraseña está vacía', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@savaya.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('pasa sin totpCode (primer factor)', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@savaya.com',
      password: 'mi-contraseña',
    })
    expect(result.success).toBe(true)
  })

  it('pasa con totpCode de 6 dígitos', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@savaya.com',
      password: 'mi-contraseña',
      totpCode: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('falla si totpCode tiene longitud distinta de 6', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@savaya.com',
      password: 'mi-contraseña',
      totpCode: '12345', // 5 chars
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ResetPasswordSchema
// ---------------------------------------------------------------------------

describe('ResetPasswordSchema', () => {
  it('falla si las contraseñas no coinciden', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'token-valido-123',
      password: 'nueva-contraseña-1',
      confirmPassword: 'nueva-contraseña-2',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.some(
        (i) => i.path.includes('confirmPassword'),
      )
      expect(confirmError).toBe(true)
    }
  })

  it('falla si la contraseña tiene menos de 8 caracteres', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'token-valido-123',
      password: 'corta',
      confirmPassword: 'corta',
    })
    expect(result.success).toBe(false)
  })

  it('pasa cuando las contraseñas coinciden y son válidas', () => {
    const result = ResetPasswordSchema.safeParse({
      token: 'token-valido-123',
      password: 'nueva-contraseña-segura',
      confirmPassword: 'nueva-contraseña-segura',
    })
    expect(result.success).toBe(true)
  })
})
