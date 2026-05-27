import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { AuthScreen } from './components/AuthScreen';
import { IronDataProvider } from './context/IronDataContext';
import Home from './pages/Home';
import Log from './pages/Log';
import History from './pages/History';
import PRs from './pages/PRs';
import Goals from './pages/Goals';
import Plan from './pages/Plan';
import Nutrition from './pages/Nutrition';
import Profile from './pages/Profile';

function LoadingShell() {
  return (
    <div className="min-h-full grid place-items-center">
      <div className="eyebrow text-[var(--ink-mute)]">Loading Iron…</div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingShell />;
  if (!user) return <AuthScreen />;

  return (
    <IronDataProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/history" element={<History />} />
          <Route path="/prs" element={<PRs />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </IronDataProvider>
  );
}
