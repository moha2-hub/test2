'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const cookieStore = cookies()

  // Clear cookies (invalidate session)
  cookieStore.set('userId', '', { path: '/', expires: new Date(0) })
  cookieStore.set('userRole', '', { path: '/', expires: new Date(0) })

  // Optionally clear other session-related cookies
  // cookieStore.set('token', '', { path: '/', expires: new Date(0) })

  // Redirect to login
  redirect('/login')
}
