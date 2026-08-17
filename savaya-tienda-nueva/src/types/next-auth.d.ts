import type { PermissionSlug } from '@/domains/roles-permissions/permissions'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: string[]
      permissions: PermissionSlug[]
      reauthAt?: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    roles?: string[]
    permissions?: PermissionSlug[]
    reauthAt?: number
  }
}
