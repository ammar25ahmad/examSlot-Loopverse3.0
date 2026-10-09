import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { homeFor, RedirectIfAuthed, RequireBranchSelected, RequireRole } from './components/routing/guards.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { StudentLayout } from './layouts/StudentLayout.jsx';
import { FullPageLoader } from './components/ui/States.jsx';

import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import SetPassword from './pages/auth/SetPassword.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import Branches from './pages/admin/Branches.jsx';
import Courses from './pages/admin/Courses.jsx';
import Students from './pages/admin/Students.jsx';
import StudentDetail from './pages/admin/StudentDetail.jsx';
import Assignments from './pages/admin/Assignments.jsx';
import ExamSlots from './pages/admin/ExamSlots.jsx';
import Requests from './pages/admin/Requests.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';

import StudentDashboard from './pages/student/Dashboard.jsx';
import SelectBranch from './pages/student/SelectBranch.jsx';
import DateSheet from './pages/student/DateSheet.jsx';
import DateSheetBuilder from './pages/student/DateSheetBuilder.jsx';
import StudentRequests from './pages/student/Requests.jsx';
import Profile from './pages/student/Profile.jsx';

import NotFound from './pages/NotFound.jsx';

function RootRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeFor(role, user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPassword /></RedirectIfAuthed>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="branches" element={<Branches />} />
        <Route path="courses" element={<Courses />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentId" element={<StudentDetail />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="exam-slots" element={<ExamSlots />} />
        <Route path="requests" element={<Requests />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route path="select-branch" element={<SelectBranch />} />
        <Route element={<RequireBranchSelected />}>
          <Route index element={<StudentDashboard />} />
          <Route path="date-sheet" element={<DateSheet />} />
          <Route path="date-sheet/build" element={<DateSheetBuilder />} />
          <Route path="requests" element={<StudentRequests />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
