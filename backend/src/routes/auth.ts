import { Router, Request, Response } from "express"
import { validate, LoginSchema, RegisterSchema, InviteTokenSchema } from "../middleware/validation.js"
import { hashPassword, comparePassword, generateToken } from "../middleware/authMiddleware.js"
import { hasDatabase, dbQuery } from "../lib/db.js"

const router = Router()

/**
 * POST /api/auth/register
 */
router.post("/register", validate(RegisterSchema), async (req: Request, res: Response) => {
  const { email, password, orgSlug, orgName } = req.body

  if (!hasDatabase()) {
    return res.status(501).json({ error: "Database not configured" })
  }

  try {
    // Check if org exists, else create
    let orgResult = await dbQuery<{ id: string }>("SELECT id FROM orgs WHERE slug = $1", [orgSlug])
    let orgId: string

    if (orgResult.rows.length === 0) {
      const insertOrg = await dbQuery<{ id: string }>(
        "INSERT INTO orgs (slug, name) VALUES ($1, $2) RETURNING id",
        [orgSlug, orgName]
      )
      orgId = insertOrg.rows[0].id
    } else {
      orgId = orgResult.rows[0].id
    }

    // Check if user exists
    const userResult = await dbQuery("SELECT id FROM org_users WHERE auth_user_id = $1", [email])
    if (userResult.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashed = await hashPassword(password)
    const insertUser = await dbQuery<{ id: string }>(
      "INSERT INTO org_users (org_id, auth_user_id, password_hash, email, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING id",
      [orgId, email, hashed, email]
    )

    const token = await generateToken({
      userId: insertUser.rows[0].id,
      orgId,
      role: "admin",
    })

    res.json({ token, orgSlug })
  } catch (err: any) {
    console.error("[Auth] Registration failed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

/**
 * POST /api/auth/login
 */
router.post("/login", validate(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!hasDatabase()) {
    return res.status(501).json({ error: "Database not configured" })
  }

  try {
    const userResult = await dbQuery<{ id: string; org_id: string; password_hash: string; role: string; slug: string }>(
      `SELECT u.id, u.org_id, u.password_hash, u.role, o.slug 
       FROM org_users u 
       JOIN orgs o ON u.org_id = o.id 
       WHERE u.email = $1`,
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = userResult.rows[0]
    const match = await comparePassword(password, user.password_hash)

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = await generateToken({
      userId: user.id,
      orgId: user.org_id,
      role: user.role as any,
    })

    res.json({ token, orgSlug: user.slug })
  } catch (err: any) {
    console.error("[Auth] Login failed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

/**
 * POST /api/auth/student/verify
 */
router.post("/student/verify", validate(InviteTokenSchema), async (req: Request, res: Response) => {
  const { token } = req.body

  if (!hasDatabase()) {
    return res.status(501).json({ error: "Database not configured" })
  }

  try {
    const studentResult = await dbQuery<{ id: string; org_id: string; name: string }>(
      "SELECT id, org_id, name FROM students WHERE invite_token = $1",
      [token]
    )

    if (studentResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid invite token" })
    }

    const student = studentResult.rows[0]
    const jwtToken = await generateToken({
      userId: student.id,
      orgId: student.org_id,
      role: "student",
    })

    res.json({ token: jwtToken, student: { name: student.name } })
  } catch (err: any) {
    console.error("[Auth] Student verification failed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
