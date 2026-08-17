export type AdminSetting = {
  id: string
  key: string
  value: string
  description: string | null
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
