import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import LandingPage from "./app/page"
import WorkspacePage from "./app/workspace/page"
import ResultsPage from "./app/results/page"
import LoginPage from "./app/login/page"
import StudentDashboard from "./app/student/page"
import IntakePage from "./app/intake/page"
import AdminDashboardPage from "./app/org/AdminDashboardPage"
import AdminConfigPage from "./app/org/AdminConfigPage"
import AdminSessionPage from "./app/org/AdminSessionPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/:orgSlug/intake" element={<IntakePage />} />
        <Route path="/exam" element={<Navigate to="/demo/exam" replace />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/:orgSlug/exam" element={<WorkspacePage />} />
        <Route path="/:orgSlug/exam/:token" element={<WorkspacePage />} />
        <Route path="/:orgSlug/admin" element={<AdminDashboardPage />} />
        <Route path="/:orgSlug/admin/config" element={<AdminConfigPage />} />
        <Route path="/:orgSlug/admin/session/:sessionId" element={<AdminSessionPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
