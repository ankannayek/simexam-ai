import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  getToken,
  setToken,
  clearToken,
  parseToken,
  isTokenExpired,
  type JWTPayload,
} from "../lib/auth"
import { loginAdmin, registerAdmin } from "../lib/api"

interface AuthUser {
  sub: string
  email: string
  orgSlug?: string
  orgId?: string
  role?: "admin" | "student"
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ orgSlug?: string }>
  register: (email: string, password: string, orgSlug: string, orgName: string) => Promise<{ orgSlug?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function payloadToUser(payload: JWTPayload): AuthUser {
  return {
    sub: payload.sub,
    email: payload.email,
    orgSlug: payload.orgSlug,
    orgId: payload.orgId,
    role: payload.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getToken()
    if (stored && !isTokenExpired(stored)) {
      try {
        setUser(payloadToUser(parseToken(stored)))
        setTokenState(stored)
      } catch {
        clearToken()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAdmin(email, password)
    setToken(result.token)
    setTokenState(result.token)
    const payload = parseToken(result.token)
    setUser(payloadToUser(payload))
    return { orgSlug: payload.orgSlug }
  }, [])

  const register = useCallback(
    async (email: string, password: string, orgSlug: string, orgName: string) => {
      const result = await registerAdmin(email, password, orgSlug, orgName)
      setToken(result.token)
      setTokenState(result.token)
      const payload = parseToken(result.token)
      setUser(payloadToUser(payload))
      return { orgSlug: payload.orgSlug ?? orgSlug }
    },
    []
  )

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
