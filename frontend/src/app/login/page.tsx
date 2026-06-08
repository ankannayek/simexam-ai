"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { navigateTo } from "../../lib/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export default function LoginPage() {
  const [orgSlug, setOrgSlug] = useState("demo")

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-zinc-100">
      <Card className="w-full max-w-md border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="text-2xl">Org admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              navigateTo(`/${orgSlug.trim() || "demo"}/admin`)
            }}
          >
            <input
              value={orgSlug}
              onChange={(event) => setOrgSlug(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-400/70"
              placeholder="org-slug"
            />
            <Button type="submit" className="w-full">
              Continue <ArrowRight size={15} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
