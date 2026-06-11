import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  BarChart3,
  CheckCircle,
  Clock,
  Settings,
  Users,
  Eye,
  Inbox,
} from "lucide-react"
import { listOrgSessions } from "../../lib/api"
import { useTenantConfig } from "../../hooks/useTenantConfig"
import { TenantShell } from "../../components/TenantShell"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import type { SessionSummary } from "../../types/index"

function statusBadge(status: SessionSummary["status"]) {
  switch (status) {
    case "active":
      return <Badge variant="warning">Active</Badge>
    case "submitted":
      return <Badge variant="outline">Submitted</Badge>
    case "evaluated":
      return <Badge variant="success">Evaluated</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function passedBadge(passed: boolean | null | undefined) {
  if (passed === true)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
        Pass
      </span>
    )
  if (passed === false)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-300">
        Fail
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
      Pending
    </span>
  )
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export default function AdminDashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const navigate = useNavigate()
  const { config } = useTenantConfig(orgSlug)

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgSlug) return

    setLoading(true)
    listOrgSessions(orgSlug)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [orgSlug])

  const stats = useMemo(() => {
    const total = sessions.length
    const active = sessions.filter((s) => s.status === "active").length
    const evaluated = sessions.filter((s) => s.status === "evaluated")
    const passed = evaluated.filter((s) => s.passed === true).length
    const passRate = evaluated.length > 0 ? Math.round((passed / evaluated.length) * 100) : 0
    const scores = evaluated
      .map((s) => s.timeElapsedSeconds)
      .filter((v): v is number => v != null)
    const avgDuration = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    return { total, active, passRate, avgDuration }
  }, [sessions])

  return (
    <TenantShell orgSlug={orgSlug ?? "demo"}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{config.branding.name}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/${orgSlug}/admin/config`)}>
            <Settings size={15} />
            Config
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="stat-card border-white/10 bg-white/[0.035]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04]">
                <Users size={18} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500">Total Sessions</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-zinc-100">
                  {stats.total}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-white/10 bg-white/[0.035]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                <CheckCircle size={18} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500">Pass Rate</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-zinc-100">
                  {stats.passRate}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-white/10 bg-white/[0.035]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04]">
                <BarChart3 size={18} className="text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500">Avg Duration</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-zinc-100">
                  {formatDuration(stats.avgDuration)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card border-white/10 bg-white/[0.035]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.06]">
                <Clock size={18} className="text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500">Active Now</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-zinc-100">
                  {stats.active}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Inbox size={40} className="text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">No sessions yet</p>
              <p className="text-xs text-zinc-600">
                Sessions will appear here once students start their assessments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Student
                    </th>
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Started
                    </th>
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Duration
                    </th>
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Passed
                    </th>
                    <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                      onClick={() => navigate(`/${orgSlug}/admin/session/${session.id}`)}
                    >
                      <td className="px-5 py-3 font-medium text-zinc-200">
                        {session.studentId ?? "—"}
                      </td>
                      <td className="px-5 py-3">{statusBadge(session.status)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        {formatDate(session.startedAt)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        {formatDuration(session.timeElapsedSeconds)}
                      </td>
                      <td className="px-5 py-3">{passedBadge(session.passed)}</td>
                      <td className="px-5 py-3">
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/${orgSlug}/admin/session/${session.id}`)
                          }}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TenantShell>
  )
}
