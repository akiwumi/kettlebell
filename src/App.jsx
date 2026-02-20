import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Landing from './components/Landing';
import Home from './components/Home';
import Session from './components/Session';
import TimerSetup from './components/TimerSetup';
import GetReady from './components/GetReady';
import Library from './components/Library';
import ProfileGate from './components/ProfileGate';
import DataLayout from './components/DataLayout';
import DataHome from './components/DataHome';
import WorkoutLog from './components/WorkoutLog';
import WeeklyMonthlyStats from './components/WeeklyMonthlyStats';
import BodyMetrics from './components/BodyMetrics';
import PerformanceMetrics from './components/PerformanceMetrics';
import WorkoutHistory from './components/WorkoutHistory';
import Dashboard from './components/Dashboard';
import Progress from './components/Progress';
import Schedule from './components/Schedule';
import Community from './components/Community';
import RoutinePage from './components/RoutinePage';
import AIAssistant from './components/AIAssistant';
import AuthCallback from './components/auth/AuthCallback';
import PaymentSuccess from './components/payment/PaymentSuccess';
import PaymentCancel from './components/payment/PaymentCancel';
import Goals from './components/Goals';
import RegisterPage from './components/RegisterPage';
import SignInPage from './components/SignInPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';

function AppContent() {
  const [landingDismissed, setLandingDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // On full page refresh, go to home but keep auth (session is restored by AuthContext).
  useEffect(() => {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (nav?.type === 'reload' && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, []);

  const handleLandingDismiss = () => {
    setLandingDismissed(true);
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/routine" element={<RoutinePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<ProfileGate />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/data" element={<DataLayout />}>
            <Route index element={<DataHome />} />
            <Route path="workouts" element={<WorkoutLog />} />
            <Route path="history" element={<WorkoutHistory />} />
            <Route path="stats" element={<WeeklyMonthlyStats />} />
            <Route path="body" element={<BodyMetrics />} />
            <Route path="performance" element={<PerformanceMetrics />} />
          </Route>
          <Route path="/library" element={<Library />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/timer-setup" element={<TimerSetup />} />
          <Route path="/get-ready" element={<GetReady />} />
          <Route path="/session" element={<Session />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Landing
        visible={!landingDismissed}
        onTap={handleLandingDismiss}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </BrowserRouter>
  );
}
