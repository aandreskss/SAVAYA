/**
 * Combines class names. Minimal implementation — no extra dependency needed.
 * Accepts strings, undefined, null, false (all falsy values are ignored).
 */
export function cn(...inputs: Array<string | undefined | null | false>): string {
  return inputs.filter(Boolean).join(' ').trim()
}
