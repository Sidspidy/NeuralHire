import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import JobsPage from './pages/jobs/JobsPage';
import JobDetailsPage from './pages/jobs/JobDetailsPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import ResumesPage from './pages/resumes/ResumesPage';
import ResumeDetailsPage from './pages/resumes/ResumeDetailsPage';
import InterviewsListPage from './pages/interviews/InterviewsListPage';
import InterviewPage from './pages/interviews/InterviewPage';
import VoiceInterviewPage from './pages/interviews/VoiceInterviewPage';
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import { RoleGuard } from './components/guards/RoleGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Jobs - Public for all authenticated users */}
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />

          {/* Job Creation/Edit - Recruiter & Admin Only */}
          <Route path="/jobs/create" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <CreateJobPage />
            </RoleGuard>
          } />
          <Route path="/jobs/:id/edit" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <CreateJobPage />
            </RoleGuard>
          } />

          {/* Resumes - Recruiter & Admin Only */}
          <Route path="/resumes" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <ResumesPage />
            </RoleGuard>
          } />
          <Route path="/resumes/:id" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <ResumeDetailsPage />
            </RoleGuard>
          } />

          {/* Interviews List - Recruiter & Admin Only */}
          <Route path="/interviews" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN', 'CANDIDATE']}>
              <InterviewsListPage />
            </RoleGuard>
          } />

          {/* Single Interview View - Recruiter & Admin Only */}
          <Route path="/interviews/:id" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN', 'CANDIDATE']}>
              <InterviewPage />
            </RoleGuard>
          } />

          {/* Voice Interview Session - Candidate Only */}
          <Route path="/interviews/:id/session" element={
            <RoleGuard allowedRoles={['CANDIDATE']}>
              <VoiceInterviewPage />
            </RoleGuard>
          } />

          {/* Payment - Recruiter & Admin Only */}
          <Route path="/payment" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <PaymentPage />
            </RoleGuard>
          } />
          <Route path="/payment/success" element={
            <RoleGuard allowedRoles={['RECRUITER', 'ADMIN']}>
              <PaymentSuccessPage />
            </RoleGuard>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

