const TOKEN_KEY = "simexam_jwt"

export interface JWTPayload {
  sub: string
  email: string
  orgSlug?: string
  orgId?: string
  role?: "admin" | "student"
  exp: number
  iat: number
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function parseToken(token: string): JWTPayload {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid JWT format")

  const payload = parts[1]
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
  return JSON.parse(decoded) as JWTPayload
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseToken(token)
    const nowSeconds = Math.floor(Date.now() / 1000)
    return payload.exp < nowSeconds
  } catch {
    return true
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  if (!token || isTokenExpired(token)) return {}
  return { Authorization: `Bearer ${token}` }
}
