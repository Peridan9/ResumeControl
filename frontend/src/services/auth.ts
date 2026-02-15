// Auth service: Clerk token getter for API and backend user/update calls

import { fetchAPI } from './fetch'

// User type matching backend response
export interface User {
  id: number
  email: string
  name: string
}

export interface UpdateUserRequest {
  name: string
}

/** Set by AuthContext when Clerk is loaded. Used by fetchAPI to attach Bearer token. */
let clerkTokenGetter: (() => Promise<string | null>) | null = null
export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  clerkTokenGetter = getter
}
export function getClerkToken(): Promise<string | null> {
  return clerkTokenGetter ? clerkTokenGetter() : Promise.resolve(null)
}

export const authAPI = {
  getCurrentUser: async (): Promise<User> => {
    return fetchAPI<User>('/auth/me', { method: 'GET' })
  },

  updateUser: async (data: UpdateUserRequest): Promise<User> => {
    return fetchAPI<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}
