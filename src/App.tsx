import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider, useAuth } from './authStore';
import { ToastProvider } from './components/Toast';
import AgeGate from './pages/AgeGate';
import AuthGuard from './components/AuthGuard';
import BottomNav from './components/BottomNav';
import Browse from './pages/Browse';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import RightNow from './pages/RightNow';
import Chat from './pages/Chat';
import Store from './pages/Store';
import Nearby from './pages/Nearby';
import Me from './pages/Me';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import ErrorBoundary from './ErrorBoundary';
import SoundListener from './components/SoundListener';
import './index.css';
import { safeGet, safeSet } from './safeStorage';

function AgeGateWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [ageVerified, setAgeVerified] = useState(() => {
    return safeGet('chasr_age_verified') === 'true';
  });

  // While the session is being restored, wait — don't flash the age gate.
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ justifyContent: 'center' }}>
          <div className="auth-logo" style={{ fontSize: 40 }}>chasr</div>
          <div className="spinner-large" />
        </div>
      </div>
    );
  }

  // Logged-in users already proved 18+ at signup — don't re-ask.
  if (!ageVerified && !user) {
    return (
      <AgeGate onConfirm={() => {
        safeSet('chasr_age_verified', 'true');
        setAgeVerified(true);
      }} />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AgeGateWrapper>
        <ToastProvider>
          <AppProvider>
            <ErrorBoundary>
              <BrowserRouter>
              <Routes>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
                      <SoundListener />
                      <div className="app-shell">
                        <main className="main-content">
                          <Routes>
                            <Route path="/" element={<Browse />} />
                            <Route path="/nearby" element={<Nearby />} />
                            <Route path="/right-now" element={<RightNow />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/store" element={<Store />} />
                            <Route path="/profile/:id" element={<Profile />} />
                            <Route path="/favorites" element={<Favorites />} />
                            <Route path="/me" element={<Me />} />
                          </Routes>
                        </main>
                        <BottomNav />
                      </div>
                    </AuthGuard>
                  }
                />
              </Routes>
            </BrowserRouter>
            </ErrorBoundary>
          </AppProvider>
          </ToastProvider>
        </AgeGateWrapper>
      </AuthProvider>
  );
}
