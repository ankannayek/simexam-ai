import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import LandingPage from "./app/page"
import ExamPage from "./app/exam/page"
import ResultsPage from "./app/results/page"
import LoginPage from "./app/login/page"
import AdminDashboardPage from "./app/org/AdminDashboardPage"
import AdminConfigPage from "./app/org/AdminConfigPage"
import AdminSessionPage from "./app/org/AdminSessionPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/exam" element={<Navigate to="/demo/exam" replace />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/:orgSlug/exam" element={<ExamPage />} />
        <Route path="/:orgSlug/exam/:token" element={<ExamPage />} />
        <Route path="/:orgSlug/admin" element={<AdminDashboardPage />} />
        <Route path="/:orgSlug/admin/config" element={<AdminConfigPage />} />
        <Route path="/:orgSlug/admin/session/:sessionId" element={<AdminSessionPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
