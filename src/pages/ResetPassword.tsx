import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Enter your email first'); return; }
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters with an uppercase letter, lowercase letter, and a number');
      return;
    }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <h1 className="auth-logo">chasr</h1>
          <p className="auth-subtitle">{token ? 'Choose a new password' : 'Reset your password'}</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--green)', marginBottom: 12 }} />
            <p style={{ marginBottom: 20 }}>Password updated! You can log in now.</p>
            <button className="btn-primary auth-submit" onClick={() => navigate('/login')}>
              Go to Log In <ArrowRight size={18} />
            </button>
          </div>
        ) : sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--green)', marginBottom: 12 }} />
            <p style={{ lineHeight: 1.5 }}>
              If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way.
              Check your inbox (and spam). The link expires in 30 minutes.
            </p>
          </div>
        ) : token ? (
          <form className="auth-form" onSubmit={submitNewPassword}>
            {error && <div className="auth-error">{error}</div>}
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type={password ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type={confirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="password-requirements">
              <ShieldCheck size={12} />
              <span>8+ characters · uppercase · lowercase · number</span>
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <Loader2 size={20} className="spin" /> : <>Update Password <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={requestReset}>
            {error && <div className="auth-error">{error}</div>}
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
              Enter the email you signed up with and we'll send you a secure link to set a new password.
            </p>
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
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <Loader2 size={20} className="spin" /> : <>Send Reset Link <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>← Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}
