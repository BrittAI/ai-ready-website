import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { createUser, getUserByEmail } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const userId = nanoid()
    await createUser({
      id: userId,
      email,
      name: name || null,
      passwordHash,
      role: role || 'user' // Default to 'user', only allow 'admin' for specific cases
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'User created successfully',
        user: { id: userId, email, name: name || null, role: role || 'user' }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}