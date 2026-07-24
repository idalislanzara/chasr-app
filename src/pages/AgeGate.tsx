import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    setError('');
    if (!month || !day || !year) {
      setError('Please enter your full date of birth');
      return;
    }
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      setError('You must be at least 18 years old to use Chasr');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service');
      return;
    }
    onConfirm();
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <h1 className="auth-logo">chasr</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            <Shield size={20} style={{ color: 'var(--accent)' }} />
            <p className="auth-subtitle">Age Verification Required</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Chasr is an adults-only platform. You must be <strong>18 years or older</strong> to create an account.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ flex: 1, padding: '12px 8px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
          >
            <option value="">Month</option>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={day}
            onChange={e => setDay(e.target.value)}
            style={{ flex: 1, padding: '12px 8px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            style={{ flex: 1.5, padding: '12px 8px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14 }}
          >
            <option value="">Year</option>
            {Array.from({ length: 80 }, (_, i) => <option key={i} value={2008 - i}>{2008 - i}</option>)}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            I confirm I am at least 18 years old and agree to the <strong style={{ color: 'var(--accent)' }}>Terms of Service</strong> and <strong style={{ color: 'var(--accent)' }}>Privacy Policy</strong>. I understand this app contains adult content.
          </span>
        </label>

        {error && (
          <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <button className="btn-primary auth-submit" onClick={handleSubmit}>
          I Am 18+ — Enter Chasr
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          By entering, you agree that you are of legal age in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
