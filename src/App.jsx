import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';

export const ResetContext = createContext(null);

export function useReset() {
  const ctx = useContext(ResetContext);
  return ctx;
}
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
import AuthConfirm from './components/auth/AuthConfirm';
import AuthReset from './components/auth/AuthReset';
import PaymentSuccess from './components/payment/PaymentSuccess';
import PaymentCancel from './components/payment/PaymentCancel';
import Goals from './components/Goals';
import RegisterPage from './components/RegisterPage';
import SignInPage from './components/SignInPage';
import { useAuth } from './contexts/AuthContext';
import { hasSupabase } from './lib/supabaseClient';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import WelcomeScreen from './components/WelcomeScreen';
import AdminLoginPage from './components/AdminLoginPage';

const AUTH_PUBLIC_PATHS = [
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset',
  '/sign-in',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/welcome',
  '/admin-login',
  '/payment/success',
  '/payment/cancel',
];

function AppContent() {
  const [landingDismissed, setLandingDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();

  // When Supabase is configured and there is no session, show only SignInPage (except on auth/public paths so callbacks work).
  const showSignInOnly =
    hasSupabase() &&
    !loading &&
    !session &&
    !AUTH_PUBLIC_PATHS.includes(location.pathname);

  // Lock PWA to portrait when running from home screen (manifest + Screen Orientation API when supported).
  useEffect(() => {
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.navigator.standalone === true);
    if (!isStandalone || !window.screen?.orientation?.lock) return;
    window.screen.orientation.lock('portrait').catch(() => {});
  }, []);

  const handleLandingDismiss = () => {
    setLandingDismissed(true);
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  };

  const resetApp = () => {
    setLandingDismissed(false);
    navigate('/', { replace: true });
  };

  if (showSignInOnly) {
    return <SignInPage />;
  }

  return (
    <ResetContext.Provider value={{ resetApp }}>
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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
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
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/auth/reset" element={<AuthReset />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Landing
        visible={!landingDismissed}
        onTap={handleLandingDismiss}
      />
    </ResetContext.Provider>
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
