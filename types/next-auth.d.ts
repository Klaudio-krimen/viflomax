import { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      // Solo se define para role === 'chofer'; refleja Chofer.activo en tiempo real
      choferActivo?: boolean
      mustChangePassword: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    // Solo se define para role === 'chofer'; refleja Chofer.activo en tiempo real
    choferActivo?: boolean
    mustChangePassword: boolean
  }
}
