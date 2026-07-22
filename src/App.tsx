import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider } from './authStore';
import { ToastProvider } from './components/Toast';
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

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppProvider>
          <ErrorBoundary>
            <BrowserRouter>
            <Routes>
              {/* Auth routes — no shell */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — with app shell */}
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
  );
}
