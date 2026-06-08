import { Router, Request, Response } from "express"
import {
  getTenantConfigBySlug,
  hasDatabase,
  listOrgSessions,
  NEON_SCHEMA_SQL,
  upsertTenantConfig,
} from "../lib/db.js"
import { cacheDel, cacheGet, cacheSet } from "../lib/cache.js"
import { TenantConfig } from "../types/index.js"

const router = Router()

router.get("/schema.sql", (_req: Request, res: Response) => {
  res.type("text/plain").send(NEON_SCHEMA_SQL.trim())
})

router.get("/:orgSlug/config", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  try {
    const cacheKey = `org:${req.params.orgSlug}:config`
    const cached = await cacheGet<TenantConfig>(cacheKey)
    if (cached) return res.json(cached)

    const config = await getTenantConfigBySlug(req.params.orgSlug)
    if (!config) return res.status(404).json({ error: "Org config not found" })
    await cacheSet(cacheKey, config, 3600)
    return res.json(config)
  } catch (err: any) {
    console.error("[Org] Config fetch failed:", err?.message)
    return res.status(500).json({ error: "Failed to load org config" })
  }
})

router.put("/:orgSlug/config", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  const config = req.body as TenantConfig
  if (!config?.branding?.name || !config?.exam?.title || !config?.exam?.starterCode) {
    return res.status(400).json({ error: "branding.name, exam.title, and exam.starterCode are required" })
  }

  try {
    const saved = await upsertTenantConfig({ ...config, orgSlug: req.params.orgSlug })
    await cacheDel(`org:${req.params.orgSlug}:config`)
    return res.json(saved)
  } catch (err: any) {
    console.error("[Org] Config upsert failed:", err?.message)
    return res.status(500).json({ error: "Failed to save org config" })
  }
})

router.get("/:orgSlug/sessions", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  try {
    return res.json(await listOrgSessions(req.params.orgSlug))
  } catch (err: any) {
    console.error("[Org] Sessions fetch failed:", err?.message)
    return res.status(500).json({ error: "Failed to load sessions" })
  }
})

export default router
