// Sign-in page using Clerk

import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 w-full max-w-md">
        <Link
          to="/"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center"
        >
          ← Back to home
        </Link>
      </div>
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        routing="path"
        path="/sign-in"
      />
    </div>
  )
}
