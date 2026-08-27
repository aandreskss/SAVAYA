/**
 * Normalizes a Venezuelan phone number to the format expected by wa.me links:
 * digits only, starting with the country code 58.
 *
 * Handles:
 *   04244426241  →  584244426241
 *   +584244426241 →  584244426241
 *   584244426241  →  584244426241  (already correct)
 */
export function toWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '58' + digits.slice(1)
  return digits
}
