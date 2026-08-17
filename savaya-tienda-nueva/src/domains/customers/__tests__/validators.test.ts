import { describe, it, expect } from 'vitest'
import { UpdateProfileSchema, AddressSchema, ChangePasswordSchema } from '@/domains/customers/validators'

// ---------------------------------------------------------------------------
// UpdateProfileSchema
// ---------------------------------------------------------------------------

describe('UpdateProfileSchema', () => {
  it('pasa con datos mínimos válidos', () => {
    const result = UpdateProfileSchema.safeParse({ firstName: 'Ana', lastName: 'García' })
    expect(result.success).toBe(true)
  })

  it('falla si firstName tiene menos de 2 caracteres', () => {
    const result = UpdateProfileSchema.safeParse({ firstName: 'A', lastName: 'García' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('firstName'))).toBe(true)
    }
  })

  it('acepta campos opcionales vacíos como string vacío', () => {
    const result = UpdateProfileSchema.safeParse({
      firstName: 'Ana',
      lastName: 'García',
      phone: '',
      whatsapp: '',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AddressSchema
// ---------------------------------------------------------------------------

describe('AddressSchema', () => {
  const validAddress = {
    label: 'casa',
    recipientName: 'Ana García',
    state: 'Carabobo',
    city: 'Valencia',
    municipality: 'Valencia',
    address: 'Calle Sucre, edificio Los Mangos, piso 3',
    isDefault: false,
  }

  it('pasa con una dirección venezolana válida', () => {
    const result = AddressSchema.safeParse(validAddress)
    expect(result.success).toBe(true)
  })

  it('falla si address tiene menos de 5 caracteres', () => {
    const result = AddressSchema.safeParse({ ...validAddress, address: 'ab' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('address'))).toBe(true)
    }
  })

  it('falla si el estado está vacío', () => {
    const result = AddressSchema.safeParse({ ...validAddress, state: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('state'))).toBe(true)
    }
  })

  it('acepta parish y reference opcionales como vacíos', () => {
    const result = AddressSchema.safeParse({ ...validAddress, parish: '', reference: '' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// ChangePasswordSchema
// ---------------------------------------------------------------------------

describe('ChangePasswordSchema', () => {
  it('pasa cuando las contraseñas coinciden y son válidas', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'contraseña-actual',
      newPassword: 'nueva-contraseña-123',
      confirmPassword: 'nueva-contraseña-123',
    })
    expect(result.success).toBe(true)
  })

  it('falla si las contraseñas no coinciden', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'contraseña-actual',
      newPassword: 'nueva-123456',
      confirmPassword: 'diferente-789',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true)
    }
  })

  it('falla si la nueva contraseña tiene menos de 8 caracteres', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'actual',
      newPassword: 'corta',
      confirmPassword: 'corta',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('newPassword'))).toBe(true)
    }
  })

  it('falla si la contraseña actual está vacía', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'nueva-valida-123',
      confirmPassword: 'nueva-valida-123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('currentPassword'))).toBe(true)
    }
  })
})
