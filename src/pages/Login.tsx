import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../authStore';
import { checkPasswordStrength, type PasswordStrength } from '../crypto';

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function PasswordStrengthBar({ strength }: { strength: PasswordStrength | null }) {
  if (!strength || strength.score === 0) return null;
  return (
    <div className="password-strength">
      <div className="strength-bar">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="strength-segment"
            style={{
              background: i < strength.score ? strength.color : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: strength.color }}>
        {strength.label}
      </span>
      {strength.feedback.length > 0 && (
        <div className="strength-feedback">
          {strength.feedback.map((f, i) => (
            <span key={i}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Login() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (mode === 'register' && val.length > 0) {
      setStrength(checkPasswordStrength(val));
    } else {
      setStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      const s = checkPasswordStrength(password);
      if (s.score < 2) {
        setError('Password is too weak. Add uppercase, numbers, or special characters.');
        return;
      }
      const result = await register(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        navigate('/register', { replace: true });
      }
    } else {
      if (password.length < 1) {
        setError('Please enter your password');
        return;
      }
      const result = await login(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    setError('');
    const socialEmail = `user_${provider}@chasr.app`;
    const socialPw = 'Chasr#Social2026!';

    const loginResult = await login(socialEmail, socialPw);
    if (loginResult.error === 'No account found with this email') {
      const regResult = await register(socialEmail, socialPw);
      if (regResult.error) {
        setError(regResult.error);
      } else {
        navigate('/register', { replace: true });
      }
    } else if (loginResult.error) {
      setError(loginResult.error);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <h1 className="auth-logo">chasr</h1>
          <p className="auth-subtitle">
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="social-buttons">
          <button className="btn-social" onClick={() => handleSocialLogin('apple')} disabled={loading}>
            <AppleIcon />
            <span>Apple</span>
          </button>
          <button className="btn-social" onClick={() => handleSocialLogin('google')} disabled={loading}>
            <GoogleIcon />
            <span>Google</span>
          </button>
        </div>

        <div className="auth-divider">or continue with email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Create a strong password' : 'Password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'register' && <PasswordStrengthBar strength={strength} />}

          {mode === 'register' && (
            <div className="password-requirements">
              <ShieldCheck size={12} />
              <span>8+ characters, mix of letters, numbers & symbols</span>
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <>
                {mode === 'register' ? 'Get Started' : 'Log In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                className="auth-link-bold"
                onClick={() => { setMode('login'); setError(''); setStrength(null); }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                className="auth-link-bold"
                onClick={() => { setMode('register'); setError(''); }}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
