// ---------------------------------------------------------------------------
// Shared types used across server actions
// ---------------------------------------------------------------------------

/**
 * Standard return type for all server actions.
 * Discriminated union: check `success` before accessing `data` or `error`.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
