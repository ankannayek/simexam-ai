import { useEffect, useState } from "react"
import LandingPage from "./app/page"
import ExamPage from "./app/exam/page"
import ResultsPage from "./app/results/page"

function getPath() {
  return window.location.pathname || "/"
}

export default function App() {
  const [path, setPath] = useState(getPath())

  useEffect(() => {
    const onPopState = () => setPath(getPath())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  if (path === "/exam") return <ExamPage />
  if (path === "/results") return <ResultsPage />
  return <LandingPage />
}
