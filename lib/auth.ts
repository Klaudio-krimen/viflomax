import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  // JWT strategy: roles en el token, no en BD en cada request
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) return null

        const passwordOk = await bcrypt.compare(credentials.password, user.password)
        if (!passwordOk) return null

        // Chofer desactivado (desvinculado) no puede iniciar sesión
        if (user.role === 'chofer') {
          const chofer = await db.chofer.findUnique({
            where: { user_id: user.id },
            select: { activo: true },
          })
          if (chofer && !chofer.activo) return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    // Agrega role al JWT (se llama en login y en cada request)
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'publico'
        token.id = user.id
      }

      if (token.id) {
        const usuario = await db.user.findUnique({
          where: { id: token.id as string },
          select: { mustChangePassword: true },
        })
        token.mustChangePassword = usuario?.mustChangePassword ?? false
      }

      // Re-verificar en cada request si un chofer con sesión ya abierta fue
      // desactivado mientras tanto — así una desvinculación corta el acceso
      // de inmediato, no solo bloquea logins nuevos.
      if (token.role === 'chofer' && token.id) {
        const chofer = await db.chofer.findUnique({
          where: { user_id: token.id as string },
          select: { activo: true },
        })
        token.choferActivo = chofer?.activo ?? false
      }

      return token
    },

    // Expone role en la session del cliente
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
        if (token.role === 'chofer') {
          session.user.choferActivo = token.choferActivo as boolean
        }
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}

// Helper para Server Components y Server Actions
export function auth() {
  return getServerSession(authOptions)
}
