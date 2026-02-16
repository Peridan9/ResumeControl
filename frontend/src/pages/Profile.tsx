import { UserProfile } from '@clerk/clerk-react'

export default function Profile() {
  return (
    <div className="flex justify-center min-h-[calc(100vh-16rem)] py-8">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-4xl',
            card: 'shadow-none w-full',
          },
        }}
      />
    </div>
  )
}
