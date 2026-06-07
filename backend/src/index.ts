import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import chatRouter from "./routes/chat.js"
import evaluateRouter from "./routes/evaluate.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}))

app.use(express.json({ limit: "2mb" }))

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.0-flash",
    mode: "DEMO (single student, live Gemini)",
    production_note: "CAG bank, intent classifier, and async eval queue are scaffolded in src/agents/intentClassifier.ts and src/lib/examStateManager.ts",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/chat", chatRouter)
app.use("/api/evaluate", evaluateRouter)

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Global Error]", err?.message)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       SimExam.ai Backend — DEMO mode     ║
║  Model: gemini-2.0-flash (free tier)     ║
║  Architecture: CAG-ready (scaffolded)    ║
╠══════════════════════════════════════════╣
║  POST /api/chat     → SSE stream         ║
║  POST /api/evaluate → JSON scores        ║
║  GET  /health       → status             ║
╚══════════════════════════════════════════╝
  Server running on http://localhost:${PORT}
  `)
})

export default app
