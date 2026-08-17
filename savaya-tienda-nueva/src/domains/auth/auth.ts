// ---------------------------------------------------------------------------
// Auth.js full configuration — includes DB adapter and credentials provider.
// Do NOT import this file in Edge runtime code (middleware.ts).
// ---------------------------------------------------------------------------

import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { verify as totpVerify } from 'otplib'
import { eq } from 'drizzle-orm'

import { authConfig } from '@/domains/auth/auth.config'
import { db } from '@/shared/lib/db'
import { users, accounts, twoFactorSecrets } from '@/domains/auth/schema'
import {
  userRoles,
  rolePermissions,
  permissions as permissionsTable,
  roles,
} from '@/domains/roles-permissions/schema'
import { LoginSchema } from '@/domains/auth/validators'
import type { PermissionSlug } from '@/domains/roles-permissions/permissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchUserRolesAndPermissions(userId: string): Promise<{
  roles: string[]
  permissions: PermissionSlug[]
}> {
  const userRoleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  const roleNames = userRoleRows.map((r) => r.roleName as string)

  if (roleNames.length === 0) {
    return { roles: roleNames, permissions: [] }
  }

  const permRows = await db
    .selectDistinct({
      resource: permissionsTable.resource,
      action: permissionsTable.action,
    })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissionsTable, eq(rolePermissions.permissionId, permissionsTable.id))
    .where(eq(userRoles.userId, userId))

  const permissions = permRows.map(
    (p) => `${p.resource}:${p.action}` as PermissionSlug,
  )

  return { roles: roleNames, permissions }
}

// ---------------------------------------------------------------------------
// NextAuth instance
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours for admin sessions
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        totpCode: { label: 'Código 2FA', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, totpCode } = parsed.data

        // 1. Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) return null

        // 2. Find the hashed password from the accounts table
        // For credentials provider, Auth.js stores the hash in accounts.password
        // We use a direct column on users via a joined query.
        // Since the schema does not include a password column on users (Auth.js standard),
        // we look at the accounts table for type='credentials'.
        const [account] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, user.id))
          .limit(1)

        // The password hash is stored as access_token for credentials accounts
        // (Auth.js DrizzleAdapter convention for credentials provider)
        const passwordHash = account?.access_token ?? null

        if (!passwordHash) return null

        // 3. Verify password
        const passwordValid = await bcrypt.compare(password, passwordHash)
        if (!passwordValid) return null

        // 4. Check 2FA if enabled
        const [tfaSecret] = await db
          .select()
          .from(twoFactorSecrets)
          .where(eq(twoFactorSecrets.userId, user.id))
          .limit(1)

        if (tfaSecret) {
          if (!totpCode) {
            // Signal to the client that 2FA is required
            // Auth.js does not have a built-in "needs 2FA" state for credentials,
            // so we return null with a special error that the client can detect.
            // The login action wraps this and returns a specific error code.
            return null
          }

          const totpResult = await totpVerify({
            token: totpCode,
            secret: tfaSecret.secret,
          })

          if (!totpResult.valid) return null
        }

        // 5. Return the user object — Auth.js will build the JWT from this
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      // On first sign in, `user` is populated — enrich the token with roles/permissions
      if (user?.id) {
        token.userId = user.id

        const { roles: userRoleNames, permissions } =
          await fetchUserRolesAndPermissions(user.id)

        token.roles = userRoleNames
        token.permissions = permissions
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        // Type-extend the session user with roles and permissions
        const extendedUser = session.user as typeof session.user & {
          roles: string[]
          permissions: PermissionSlug[]
          reauthAt?: number
        }
        extendedUser.roles = (token.roles as string[]) ?? []
        extendedUser.permissions = (token.permissions as PermissionSlug[]) ?? []
        if (token.reauthAt) {
          extendedUser.reauthAt = token.reauthAt as number
        }
      }
      return session
    },
  },
})
