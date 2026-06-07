export const EXAM_DURATION_SECONDS = 600
export const CURVEBALL_TRIGGER_SECONDS = 120

export const CURVEBALL_MESSAGE = `Hey team — quick update from the client. They just downgraded our server from a t3.large to a t3.micro. Memory is now a real constraint. Whatever fix you're shipping needs to run in O(n log n) time — we can't afford O(n²) anymore. Thanks for being flexible. — Alex`

export const INITIAL_CODE = `// production-sort.js
// Sorting module used in our inventory management system
// Status: BROKEN — do not deploy

function sortInventory(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {  // BUG: should be n - i - 1
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

// Test cases (expected: [1, 2, 5, 8, 9, 12])
console.log(sortInventory([8, 5, 2, 9, 1, 12]));`

export const SIMULATOR_OPENING_MESSAGE = (name: string) =>
  `Hey ${name} — welcome. I've loaded a sorting module from our inventory system. It's throwing errors in production and it's painfully slow on large datasets. Code is in the editor. Take a look, ask me anything, and show me your fix when you're ready.`

export const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) || "http://localhost:3001"

export const SESSION_KEYS = {
  STUDENT_NAME: "simexam_student_name",
  EXAM_STATE: "simexam_exam_state",
  MESSAGES: "simexam_messages",
  CODE: "simexam_code",
  TIMER: "simexam_timer_start",
  RESULTS: "simexam_results",
  EVALUATION_PAYLOAD: "simexam_evaluation_payload",
  EVALUATION_PENDING: "simexam_evaluation_pending",
} as const
