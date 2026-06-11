import { BACKEND_URL } from './constants'

const TOKEN_KEY = 'simexam_jwt'
const USER_KEY = 'simexam_user'

export interface AuthUser {
  userId: string
  orgId: string
  orgSlug: string
  role: 'admin' | 'viewer' | 'student'
  email: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.href = '/login'
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(err.error || 'Login failed')
  }
  const data = await res.json()
  const user: AuthUser = {
    userId: data.userId,
    orgId: data.orgId,
    orgSlug: data.orgSlug,
    role: data.role,
    email,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export async function registerUser(email: string, password: string, orgSlug: string, orgName: string): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, orgSlug, orgName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }))
    throw new Error(err.error || 'Registration failed')
  }
  const data = await res.json()
  const user: AuthUser = {
    userId: data.userId,
    orgId: data.orgId,
    orgSlug: orgSlug,
    role: 'admin',
    email,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export async function verifyStudentToken(token: string): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/auth/student/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid token' }))
    throw new Error(err.error || 'Invalid token')
  }
  const data = await res.json()
  const user: AuthUser = {
    userId: data.userId,
    orgId: data.orgId,
    orgSlug: data.orgSlug || '',
    role: 'student',
    email: '',
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}
