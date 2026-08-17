export type AdminUserRole = {
  roleId: string
  roleName: string
  assignedAt: Date
}

export type AdminUser = {
  id: string
  name: string | null
  email: string
  roles: AdminUserRole[]
  createdAt: Date
}

export type AdminRole = {
  id: string
  name: string
  description: string | null
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
