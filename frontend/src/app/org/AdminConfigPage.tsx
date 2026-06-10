import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { fetchTenantConfig, saveTenantConfig } from "../../lib/api"
import { TenantShell } from "../../components/TenantShell"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import type { RubricDimension, TenantConfig, TestCase } from "../../types/index"
import { fallbackTenantConfig } from "../../hooks/useTenantConfig"

function SectionDivider() {
  return <div className="my-6 border-t border-white/[0.06]" />
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-zinc-400">
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  mono,
}: {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  id?: string
  mono?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/10",
        mono ? "font-mono" : "",
      ].join(" ")}
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  mono?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={[
        "w-full resize-y rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm leading-6 text-zinc-100 outline-none transition-all duration-200 focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/10",
        mono ? "font-mono text-xs" : "",
      ].join(" ")}
    />
  )
}

const LANGUAGE_OPTIONS = ["javascript", "typescript", "python", "java"] as const

export default function AdminConfigPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const navigate = useNavigate()

  const [config, setConfig] = useState<TenantConfig>(() => fallbackTenantConfig(orgSlug))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!orgSlug) return
    fetchTenantConfig(orgSlug)
      .then(setConfig)
      .catch(() => setConfig(fallbackTenantConfig(orgSlug)))
      .finally(() => setLoading(false))
  }, [orgSlug])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  const update = useCallback(
    <K extends keyof TenantConfig>(section: K, partial: Partial<TenantConfig[K]>) => {
      setConfig((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...partial },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!orgSlug || saving) return
    setSaving(true)
    try {
      await saveTenantConfig(orgSlug, config)
      setToast({ type: "success", text: "Config saved" })
    } catch {
      setToast({ type: "error", text: "Failed to save config" })
    } finally {
      setSaving(false)
    }
  }, [orgSlug, config, saving])

  // Rubric helpers
  const addDimension = () => {
    setConfig((prev) => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        dimensions: [
          ...prev.rubric.dimensions,
          { name: "", weight: 0.2, description: "" },
        ],
      },
    }))
  }

  const removeDimension = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        dimensions: prev.rubric.dimensions.filter((_, i) => i !== index),
      },
    }))
  }

  const updateDimension = (index: number, partial: Partial<RubricDimension>) => {
    setConfig((prev) => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        dimensions: prev.rubric.dimensions.map((d, i) =>
          i === index ? { ...d, ...partial } : d
        ),
      },
    }))
  }

  // Test case helpers
  const addTestCase = () => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        testCases: [
          ...prev.exam.testCases,
          { input: "", expectedOutput: "", hidden: false },
        ],
      },
    }))
  }

  const removeTestCase = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        testCases: prev.exam.testCases.filter((_, i) => i !== index),
      },
    }))
  }

  const updateTestCase = (index: number, partial: Partial<TestCase>) => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        testCases: prev.exam.testCases.map((tc, i) =>
          i === index ? { ...tc, ...partial } : tc
        ),
      },
    }))
  }

  // Knowledge base URL helpers
  const addUrl = () => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        knowledgeBaseUrls: [...prev.exam.knowledgeBaseUrls, ""],
      },
    }))
  }

  const removeUrl = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        knowledgeBaseUrls: prev.exam.knowledgeBaseUrls.filter((_, i) => i !== index),
      },
    }))
  }

  const updateUrl = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        knowledgeBaseUrls: prev.exam.knowledgeBaseUrls.map((u, i) =>
          i === index ? value : u
        ),
      },
    }))
  }

  if (loading) {
    return (
      <TenantShell orgSlug={orgSlug ?? "demo"}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
        </div>
      </TenantShell>
    )
  }

  return (
    <TenantShell orgSlug={orgSlug ?? "demo"}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(`/${orgSlug}/admin`)}>
              <ArrowLeft size={15} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                Exam Configuration
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">{config.branding.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={15} />
            {saving ? "Saving…" : "Save Config"}
          </Button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={[
              "mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200",
              toast.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                : "border-red-500/20 bg-red-500/[0.06] text-red-200",
            ].join(" ")}
          >
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* Section 1: Exam Details */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={config.exam.title}
                  onChange={(v) => update("exam", { title: v })}
                  placeholder="e.g. Production Sort Assessment"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={config.exam.description ?? ""}
                  onChange={(v) => update("exam", { description: v })}
                  placeholder="Brief description for students"
                />
              </div>
              <div>
                <Label>Problem Statement</Label>
                <Textarea
                  value={config.exam.problemStatement}
                  onChange={(v) => update("exam", { problemStatement: v })}
                  placeholder="The problem statement shown to students"
                  mono
                  rows={4}
                />
              </div>
              <div>
                <Label>Starter Code</Label>
                <Textarea
                  value={config.exam.starterCode}
                  onChange={(v) => update("exam", { starterCode: v })}
                  placeholder="// starter code..."
                  mono
                  rows={8}
                />
              </div>
              <div>
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={config.exam.timeLimitSeconds}
                  onChange={(v) => update("exam", { timeLimitSeconds: parseInt(v) || 600 })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Curveball */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Curveball</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="curveballAt">Curveball Timing (seconds after start)</Label>
                <Input
                  id="curveballAt"
                  type="number"
                  value={config.exam.curveballAtSeconds}
                  onChange={(v) => update("exam", { curveballAtSeconds: parseInt(v) || 120 })}
                />
              </div>
              <div>
                <Label>Curveball Message</Label>
                <Textarea
                  value={config.exam.curveballMessage ?? ""}
                  onChange={(v) => update("exam", { curveballMessage: v })}
                  placeholder="The constraint change message..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Languages */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Allowed Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <label
                    key={lang}
                    className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={config.exam.allowedLanguages.includes(lang)}
                      onChange={(e) => {
                        const current = config.exam.allowedLanguages
                        const next = e.target.checked
                          ? [...current, lang]
                          : current.filter((l) => l !== lang)
                        update("exam", { allowedLanguages: next })
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-indigo-500 accent-indigo-500"
                    />
                    <span className="capitalize">{lang}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Agent Persona */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Agent Persona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="personaName">Name</Label>
                  <Input
                    id="personaName"
                    value={config.agent.personaName}
                    onChange={(v) => update("agent", { personaName: v })}
                    placeholder="Alex Chen"
                  />
                </div>
                <div>
                  <Label htmlFor="personaRole">Role</Label>
                  <Input
                    id="personaRole"
                    value={config.agent.personaRole}
                    onChange={(v) => update("agent", { personaRole: v })}
                    placeholder="Senior Engineer"
                  />
                </div>
              </div>
              <div>
                <Label>System Prompt Additions</Label>
                <Textarea
                  value={config.agent.systemPromptAdditions ?? ""}
                  onChange={(v) => update("agent", { systemPromptAdditions: v })}
                  placeholder="Additional instructions for the AI persona..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Rubric */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Rubric Dimensions</CardTitle>
                <Button variant="ghost" onClick={addDimension}>
                  <Plus size={14} />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.rubric.dimensions.map((dim, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={dim.name}
                            onChange={(v) => updateDimension(i, { name: v })}
                            placeholder="Dimension name"
                          />
                        </div>
                        <div>
                          <Label>Weight (0–1)</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={dim.weight}
                              onChange={(e) =>
                                updateDimension(i, {
                                  weight: parseFloat(e.target.value),
                                })
                              }
                              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-indigo-500"
                            />
                            <span className="font-mono text-xs text-zinc-400 w-8 text-right">
                              {dim.weight.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={dim.description}
                          onChange={(v) => updateDimension(i, { description: v })}
                          placeholder="What this dimension measures"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeDimension(i)}
                      className="mt-5 text-zinc-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 6: Test Cases */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Test Cases</CardTitle>
                <Button variant="ghost" onClick={addTestCase}>
                  <Plus size={14} />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.exam.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Input</Label>
                          <Input
                            value={typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input)}
                            onChange={(v) => {
                              try { updateTestCase(i, { input: JSON.parse(v) }) }
                              catch { updateTestCase(i, { input: v }) }
                            }}
                            placeholder="Input value or JSON"
                            mono
                          />
                        </div>
                        <div>
                          <Label>Expected Output</Label>
                          <Input
                            value={
                              typeof tc.expectedOutput === "string"
                                ? tc.expectedOutput
                                : JSON.stringify(tc.expectedOutput)
                            }
                            onChange={(v) => {
                              try { updateTestCase(i, { expectedOutput: JSON.parse(v) }) }
                              catch { updateTestCase(i, { expectedOutput: v }) }
                            }}
                            placeholder="Expected output or JSON"
                            mono
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.hidden ?? false}
                          onChange={(e) => updateTestCase(i, { hidden: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-zinc-900 accent-indigo-500"
                        />
                        Hidden (not shown to student)
                      </label>
                    </div>
                    <button
                      onClick={() => removeTestCase(i)}
                      className="mt-5 text-zinc-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 7: Knowledge Base */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Knowledge Base URLs</CardTitle>
                <Button variant="ghost" onClick={addUrl}>
                  <Plus size={14} />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.exam.knowledgeBaseUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(v) => updateUrl(i, v)}
                    placeholder="https://docs.example.com/..."
                  />
                  <button
                    onClick={() => removeUrl(i)}
                    className="text-zinc-600 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {config.exam.knowledgeBaseUrls.length === 0 && (
                <p className="text-xs text-zinc-600">No URLs added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Section 8: Branding */}
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => update("branding", { primaryColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                    />
                    <span className="font-mono text-xs text-zinc-400">
                      {config.branding.primaryColor}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={config.branding.logoUrl ?? ""}
                    onChange={(v) => update("branding", { logoUrl: v })}
                    placeholder="https://example.com/logo.svg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom save */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save size={15} />
            {saving ? "Saving…" : "Save Config"}
          </Button>
        </div>
      </div>
    </TenantShell>
  )
}
