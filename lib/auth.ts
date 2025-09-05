import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { 
  getUserByEmail, 
  createSession, 
  getSessionByToken, 
  deleteSession,
  updateUserLastLogin 
} from './database'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await getUserByEmail(credentials.email)
          
          if (!user || !user.password_hash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)
          
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await updateUserLastLogin(user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'user' | 'admin'
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Custom database adapter functions
export const customAdapter = {
  async createSession(sessionData: { sessionToken: string; userId: string; expires: Date }) {
    const sessionId = nanoid()
    await createSession({
      id: sessionId,
      sessionToken: sessionData.sessionToken,
      userId: sessionData.userId,
      expires: sessionData.expires
    })
    return {
      id: sessionId,
      sessionToken: sessionData.sessionToken,
      userId: sessionData.userId,
      expires: sessionData.expires
    }
  },
  
  async getSessionAndUser(sessionToken: string) {
    const sessionData = await getSessionByToken(sessionToken)
    if (!sessionData) return null
    
    return {
      session: {
        sessionToken: sessionData.session_token,
        userId: sessionData.user_id,
        expires: new Date(sessionData.expires)
      },
      user: {
        id: sessionData.user_id,
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role
      }
    }
  },
  
  async updateSession(sessionData: { sessionToken: string; expires?: Date }) {
    // For JWT strategy, this might not be needed
    return null
  },
  
  async deleteSession(sessionToken: string) {
    await deleteSession(sessionToken)
  }
}