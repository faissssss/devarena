import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/competitions/:competitionId" element={<CompetitionDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
