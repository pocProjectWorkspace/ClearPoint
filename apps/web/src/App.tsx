import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import SetupWizard from './pages/setup/SetupWizard'
import ReportPage from './pages/report/ReportPage'

// Assessment
import SessionDashboard from './pages/assessment/SessionDashboard'

// Output pages
import DiagnosisSummary from './pages/output/DiagnosisSummary'
import InterventionMap from './pages/output/InterventionMap'
import Roadmap306090 from './pages/output/Roadmap306090'
import BusinessCasePage from './pages/output/BusinessCase'
import ReasoningLog from './pages/output/ReasoningLog'

// Dashboard pages
import EngagementList from './pages/dashboard/EngagementList'
import EngagementDetail from './pages/dashboard/EngagementDetail'

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/" element={<Protected><EngagementList /></Protected>} />
        <Route path="/engagement/:id" element={<Protected><EngagementDetail /></Protected>} />

        {/* Setup wizard */}
        <Route path="/setup/new" element={<Protected><SetupWizard /></Protected>} />

        {/* Assessment session — all views handled inside SessionDashboard */}
        <Route path="/session/:engagementId" element={<Protected><SessionDashboard /></Protected>} />

        {/* Output & Report */}
        <Route path="/output/:engagementId/diagnosis" element={<Protected><ErrorBoundary fallbackMessage="Unable to load diagnosis."><DiagnosisSummary /></ErrorBoundary></Protected>} />
        <Route path="/output/:engagementId/intervention-map" element={<Protected><ErrorBoundary fallbackMessage="Unable to load intervention map."><InterventionMap /></ErrorBoundary></Protected>} />
        <Route path="/output/:engagementId/roadmap" element={<Protected><ErrorBoundary fallbackMessage="Unable to load roadmap."><Roadmap306090 /></ErrorBoundary></Protected>} />
        <Route path="/output/:engagementId/business-case" element={<Protected><ErrorBoundary fallbackMessage="Unable to load business case."><BusinessCasePage /></ErrorBoundary></Protected>} />
        <Route path="/output/:engagementId/reasoning" element={<Protected><ErrorBoundary fallbackMessage="Unable to load reasoning log."><ReasoningLog /></ErrorBoundary></Protected>} />

        {/* PDF report — NOT protected, uses token query param */}
        <Route path="/report/:engagementId" element={<ReportPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
