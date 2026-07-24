import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider } from './authStore';
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
import Register from './pages/Register';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

function AgeGateWrapper({ children }: { children: React.ReactNode }) {
  const [ageVerified, setAgeVerified] = useState(() => {
    return localStorage.getItem('chasr_age_verified') === 'true';
  });

  const handleConfirm = () => {
    localStorage.setItem('chasr_age_verified', 'true');
    setAgeVerified(true);
  };

  if (!ageVerified) {
    return <AgeGate onConfirm={handleConfirm} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AgeGateWrapper>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <ErrorBoundary>
              <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/*"
                  element={
                    <AuthGuard>
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
      </AuthProvider>
    </AgeGateWrapper>
  );
}
