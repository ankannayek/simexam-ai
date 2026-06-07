# SimExam.ai — AI-Refereed Practical Assessment

![FAR AWAY 2026](https://img.shields.io/badge/FAR%20AWAY%202026-Examinations%20%C3%97%20Agentic%20Systems-6366f1)
![Mode](https://img.shields.io/badge/mode-DEMO%20%2B%20CAG--ready-22c55e)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Express%20%2B%20Gemini-f59e0b)

![Demo](./demo.gif)

SimExam.ai replaces static coding tests with a dynamic, AI-refereed simulation where the only way to pass is to demonstrate the skill — not recall it.

The live demo runs locally with a free Gemini API key, while the codebase visibly scaffolds the production architecture for 1–2 lakh concurrent students using a CAG response bank, a deterministic exam state machine, and an asynchronous evaluation design.

## Three-Agent Architecture

| Agent | Trigger | LLM calls | What it does | PRODUCTION design |
|---|---:|---:|---|---|
| Simulator — Alex Chen, Senior Dev | Every student chat message | Gemini streaming in demo | Gives Socratic hints, reacts to code, acknowledges PM curveball, never reveals the solution | Intent classifier routes common turns to a CAG response bank; Gemini fires only for `NOVEL_INPUT` |
| PM — Alex, Product Manager | Timer at 120 seconds elapsed, or `Shift+D` | Zero | Injects a deterministic O(n log n) constraint update | Static autonomous event; no LLM variance, no rate-limit risk |
| Evaluator — Silent Judge | Submit or timer expiry | One structured Gemini JSON call in demo | Scores technical accuracy, adaptability, communication, and efficiency | BullMQ + Redis queue, capped concurrent Gemini workers, rule-based fallback runs immediately |

## CAG Architecture

SimExam.ai is not a chat wrapper. It treats the assessment like a bounded state machine, similar to how a soil scientist would classify a pedon by observable horizons rather than by vibes: every turn is reduced to structured evidence.

The key production structure is `ExamState`:

```ts
interface ExamState {
  bugFixed: boolean
  approach: "bubble" | "merge" | "quicksort" | "unknown"
  curveballSeen: boolean
  curveballAddressed: boolean
  hintsGiven: number
  turnsElapsed: number
  lastCodeState: CodeState
  lastIntentClass: IntentClass
}
```

`intentClassifier.ts` classifies turns into `HINT_REQUEST`, `CODE_PASTE`, `CONCEPT_QUESTION`, `CURVEBALL_ACK`, `DONE_SIGNAL`, `OFF_TOPIC`, or `NOVEL_INPUT`.

The production CAG key is:

```txt
${intentClass}:${codeState}:${curveballSeen}
```

Example: `HINT_REQUEST:BUGGY_ORIGINAL:false` returns a pre-authored Socratic hint from a KV store without touching Gemini. Only unknown or novel inputs go to the live model. For 1 lakh students, this changes the system from a raw LLM-chat workload into a predictable finite key-space workload.

## Setup

### 1. Get a Gemini API key

Create a free key from Google AI Studio: `https://aistudio.google.com`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# paste your key into backend/.env
npm install
npm run dev
```

Backend runs at `http://localhost:3001`.

Health check:

```bash
curl http://localhost:3001/health
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Demo Shortcuts

| Shortcut | Action |
|---|---|
| `Shift+D` | Fire the PM curveball immediately |
| `Ctrl+Enter` / `Cmd+Enter` | Run code in the editor |
| <code>`</code> | Toggle the live ExamState debug panel |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20+ |
| Backend language | TypeScript |
| Backend framework | Express.js |
| LLM SDK | `@google/generative-ai` |
| Model | `gemini-2.0-flash` |
| Streaming | Server-Sent Events |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + inline assessment UI styles |
| Charts | Recharts |
| Icons | lucide-react |

## What Makes This Not a Wrapper

1. **Intent classifier routes message turns.** Common assessment actions are categorized before model use, enabling production routing to deterministic CAG responses.
2. **ExamState struct replaces transcript compression.** The system carries bounded state, not an ever-growing chat log.
3. **Terminal is a deterministic state machine.** The run button pattern-matches code states and gives stable judge-friendly outputs.
4. **Curveball is a timed autonomous event.** The PM interruption happens from the exam state and timer, not from a random LLM reply.
5. **Evaluator uses structured JSON schema grading.** Results are machine-readable, consistent, and backed by a rule-based fallback if Gemini rate-limits.

## Judge Walkthrough

Open the debug panel with <code>`</code>. Start from `NOVEL_INPUT:BUGGY_ORIGINAL:false`, run the code to show the off-by-one failure, then press `Shift+D` to fire the PM constraint. When the student switches to merge sort or quicksort and runs again, the panel flips to a full key such as `HINT_REQUEST:FIXED_FAST:true`, showing how the CAG key-space would scale in production.

## Repository Layout

```txt
simexam-ai/
├── backend/   # Express + Gemini agents + CAG scaffolding
└── frontend/  # React + Vite assessment UI + state-machine demo
```

## Notes

- Backend uses `.js` import extensions because TypeScript emits ESM-compatible JavaScript.
- No `node_modules` are included in this zip.
- Add only `GEMINI_API_KEY` to run the full live demo.
