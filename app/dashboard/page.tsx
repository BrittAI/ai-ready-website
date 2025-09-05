'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/shadcn/button'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heat-120"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-heat-4 to-heat-20">
      <nav className="bg-white shadow-sm border-b border-heat-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="title-h3 text-heat-200">AI Ready Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="body-medium text-gray-700">
                Welcome, {session.user.name || session.user.email}
              </span>
              {session.user.role === 'admin' && (
                <Button
                  onClick={() => router.push('/admin')}
                  variant="secondary"
                  className="border-heat-120 text-heat-120 hover:bg-heat-20"
                >
                  Admin Panel
                </Button>
              )}
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="secondary"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-16 shadow-sm p-8 border border-heat-20">
          <div className="mb-6">
            <h2 className="title-h3 text-heat-200 mb-2">Your Account</h2>
            <p className="body-large text-gray-600">
              Manage your AI readiness analysis reports and account settings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-heat-20 to-heat-40 rounded-12 p-6 border border-heat-60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="title-h4 text-heat-200">Recent Reports</h3>
                <svg className="w-6 h-6 text-heat-120" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="body-medium text-heat-140">
                View and manage your AI readiness analysis reports
              </p>
              <Button 
                onClick={() => router.push('/reports')}
                className="mt-4 w-full bg-heat-120 hover:bg-heat-140 text-white rounded-8"
              >
                View Reports
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-12 p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="title-h4 text-blue-800">New Analysis</h3>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="body-medium text-blue-700">
                Start a new AI readiness analysis for a website
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-8"
              >
                Start Analysis
              </Button>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-12 p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="title-h4 text-green-800">Account Info</h3>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="space-y-2 body-small text-green-700">
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Role:</strong> {session.user.role}</p>
                <p><strong>Name:</strong> {session.user.name || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}