'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'user', // Default role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      
      // Auto sign in after successful registration
      setTimeout(async () => {
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        })
        router.push('/dashboard')
      }, 2000)

    } catch (error: any) {
      setError(error.message || 'An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-heat-4 to-heat-20 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-16 shadow-xl p-8 border border-heat-20 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="title-h3 text-heat-200 mb-2">Account Created!</h1>
            <p className="body-large text-gray-600 mb-4">
              Your account has been created successfully. You're being signed in...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-heat-120"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-heat-4 to-heat-20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-16 shadow-xl p-8 border border-heat-20">
          <div className="text-center mb-8">
            <h1 className="title-h2 text-heat-200 mb-2">Create Account</h1>
            <p className="body-large text-gray-600">Join us to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="label-medium text-heat-160">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="h-12 rounded-12 border-heat-40 focus:border-heat-120 focus:ring-2 focus:ring-heat-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="label-medium text-heat-160">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-12 rounded-12 border-heat-40 focus:border-heat-120 focus:ring-2 focus:ring-heat-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-medium text-heat-160">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
                className="h-12 rounded-12 border-heat-40 focus:border-heat-120 focus:ring-2 focus:ring-heat-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="label-medium text-heat-160">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="h-12 rounded-12 border-heat-40 focus:border-heat-120 focus:ring-2 focus:ring-heat-40"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-12 body-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-heat-120 to-heat-140 hover:from-heat-140 hover:to-heat-160 text-white font-medium rounded-12 transition-all duration-200"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="body-medium text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-heat-140 hover:text-heat-160 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}