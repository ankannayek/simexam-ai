"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { navigateTo } from "../../lib/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { loginUser, registerUser, verifyStudentToken } from "../../lib/auth"

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login")
  
  // Admin fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [orgName, setOrgName] = useState("")
  
  // Student field
  const [inviteToken, setInviteToken] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (tab === "login") {
        const user = await loginUser(email, password)
        navigateTo(`/${user.orgSlug}/admin`)
      } else {
        const user = await registerUser(email, password, orgSlug, orgName)
        navigateTo(`/${user.orgSlug}/admin`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await verifyStudentToken(inviteToken)
      navigateTo("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 font-sans text-zinc-100">
      {/* Gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,131,255,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.07),transparent_20%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.5),transparent_35%)]" />

      <div className="absolute left-6 top-6 z-10">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            navigateTo("/")
          }}
          className="flex items-center text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to home
        </a>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Welcome to SimExam</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to your account</p>
        </div>

        <Card className="border-white/10 bg-surface-raised/80 backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex gap-4 border-b border-white/5 pb-4">
              <button
                className={`text-sm font-semibold transition-colors ${tab === "login" ? "text-accent" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => { setTab("login"); setError("") }}
              >
                Sign In
              </button>
              <button
                className={`text-sm font-semibold transition-colors ${tab === "register" ? "text-accent" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => { setTab("register"); setError("") }}
              >
                Create Account
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleAdminSubmit}>
              {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
              
              <div className="space-y-3">
                {tab === "register" && (
                  <>
                    <input
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm outline-none focus:border-accent/70"
                      placeholder="Organization Name"
                    />
                    <input
                      required
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm outline-none focus:border-accent/70"
                      placeholder="Organization Slug (e.g., acme-corp)"
                    />
                  </>
                )}
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm outline-none focus:border-accent/70"
                  placeholder="Email address"
                />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm outline-none focus:border-accent/70"
                  placeholder="Password"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Please wait..." : (tab === "login" ? "Sign in" : "Create account")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-raised px-2 text-zinc-500">Student Access</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleStudentSubmit}>
              <input
                required
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm outline-none focus:border-accent/70"
                placeholder="Enter invite token"
              />
              <Button type="submit" variant="outline" className="w-full h-11" disabled={loading}>
                Access Assessment <ArrowRight size={16} />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
