import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import { FullPageLoader } from "./components/ui/Loader.jsx";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
