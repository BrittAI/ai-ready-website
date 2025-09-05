import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'admin' | 'user'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'admin' | 'user'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: 'admin' | 'user'
  }
}