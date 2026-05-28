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
      return token
    },

    // Expone role en la session del cliente
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
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
