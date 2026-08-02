import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft,
  User, Heart, Check,
} from 'lucide-react';
import { useAuth } from '../authStore';

const PRONOUNS_OPTIONS = ['she/her', 'he/him', 'they/them', 'ze/zir', 'she/they', 'he/they', 'any pronouns', 'other'];
const IDENTITY_OPTIONS = ['Trans Woman', 'Trans Man', 'Non-Binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Questioning', 'Other'];
const LOOKING_FOR_OPTIONS = ['Dates', 'Friends', 'Chat', 'Right Now', 'Relationship', 'Networking'];
const INTERESTS_OPTIONS = [
  'Dancing', 'Music', 'Gaming', 'Cooking', 'Travel', 'Photography',
  'Art', 'Fitness', 'Yoga', 'Reading', 'Movies', 'Anime',
  'Tattoos', 'Fashion', 'Coffee', 'Hiking', 'Dogs', 'Cats',
  'Karaoke', 'Cosplay', 'Tech', 'Foodie', 'Brunch', 'Parties',
];
const HEIGHTS = ["4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"+"];
const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Curvy', 'Petite', 'Muscular', 'Full-figured', 'Prefer not to say'];
const ETHNICITIES = ['Asian', 'Black', 'Hispanic/Latina', 'Middle Eastern', 'Mixed', 'Native American', 'Pacific Islander', 'White', 'Other', 'Prefer not to say'];

const STEPS = ['account', 'basics', 'identity', 'details', 'interests', 'done'] as const;
type Step = typeof STEPS[number];

export default function Register() {
  const { user, register, completeProfile, loading } = useAuth();
  const navigate = useNavigate();

  // If user is logged in but has no name, start at basics (profile wizard)
  const [step, setStep] = useState<Step>(() => {
    if (user && !user.name) return 'basics';
    return 'account';
  });

  // Account step
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  // Profile steps
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || 18);
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [identity, setIdentity] = useState(user?.identity || '');
  const [height, setHeight] = useState(user?.height || "5'7\"");
  const [body_type, setBodyType] = useState(user?.body_type || '');
  const [ethnicity, setEthnicity] = useState(user?.ethnicity || '');
  const [looking_for, setLookingFor] = useState<string[]>(user?.looking_for || []);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [tagline, setTagline] = useState(user?.tagline || '');
  const [bio, setBio] = useState(user?.bio || '');

  // If user finishes profile and gets redirected here, go to home
  useEffect(() => {
    if (user && user.name) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx) / (STEPS.length - 1)) * 100;

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await register(email.trim(), password);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('basics');
    }
  };

  const toggleArrayItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 'basics': return name.trim().length > 0 && age >= 18;
      case 'identity': return pronouns.length > 0 && identity.length > 0;
      case 'details': return true;
      case 'interests': return looking_for.length > 0;
      default: return true;
    }
  };

  const nextStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const finishProfile = () => {
    completeProfile({
      name: name.trim(),
      age,
      pronouns,
      identity,
      tagline: tagline.trim() || `Hey, I'm ${name}! 👋`,
      bio: bio.trim() || `Just joined Chasr!`,
      photos: [],
      height,
      body_type,
      ethnicity,
      looking_for,
      interests,
    });
    navigate('/', { replace: true });
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="auth-logo" style={{ fontSize: 40 }}>chasr</div>
          <div className="spinner-large" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* ── Account Step ── */}
        {step === 'account' && (
          <>
            <div className="auth-hero">
              <h1 className="auth-logo">chasr</h1>
              <p className="auth-subtitle">Create your account</p>
            </div>

            <form className="auth-form" onSubmit={handleAccountSubmit}>
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
                  placeholder="Password (6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="input-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? <Loader2 size={20} className="spin" /> : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>

            <div className="social-buttons">
              <button className="btn-social btn-google" onClick={() => { setStep('basics'); }}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button className="btn-social btn-apple" onClick={() => { setStep('basics'); }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            <p className="auth-footer-text">
              Already have an account? <Link to="/login" className="auth-link-bold">Log in</Link>
            </p>
          </>
        )}

        {/* ── Profile Steps ── */}
        {step !== 'account' && (
          <>
            {/* Progress bar */}
            <div className="wizard-header">
              <button className="btn-icon wizard-back" onClick={prevStep} disabled={step === 'basics'}>
                <ArrowLeft size={20} />
              </button>
              <div className="wizard-progress">
                <div className="wizard-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span className="wizard-step-num">{stepIdx}/{STEPS.length - 2}</span>
            </div>

            <div className="wizard-body">
              {/* ── Step: Basics ── */}
              {step === 'basics' && (
                <div className="wizard-step">
                  <div className="wizard-icon"><User size={32} /></div>
                  <h2>What should we call you?</h2>
                  <p className="wizard-hint">This is how others will see you</p>

                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={24}
                    />
                  </div>

                  <label className="field-label">Age</label>
                  <div className="input-group">
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={age}
                      onChange={(e) => setAge(Math.max(18, parseInt(e.target.value) || 18))}
                    />
                  </div>
                </div>
              )}

              {/* ── Step: Identity ── */}
              {step === 'identity' && (
                <div className="wizard-step">
                  <div className="wizard-icon"><Heart size={32} /></div>
                  <h2>Tell us about yourself</h2>
                  <p className="wizard-hint">Help others find you</p>

                  <label className="field-label">Pronouns</label>
                  <div className="chip-grid">
                    {PRONOUNS_OPTIONS.map((p) => (
                      <button
                        key={p}
                        className={`chip ${pronouns === p ? 'active' : ''}`}
                        onClick={() => setPronouns(p)}
                      >
                        {pronouns === p && <Check size={12} />} {p}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">I identify as</label>
                  <div className="chip-grid">
                    {IDENTITY_OPTIONS.map((i) => (
                      <button
                        key={i}
                        className={`chip ${identity === i ? 'active' : ''}`}
                        onClick={() => setIdentity(i)}
                      >
                        {identity === i && <Check size={12} />} {i}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step: Details ── */}
              {step === 'details' && (
                <div className="wizard-step">
                  <h2>Physical details</h2>
                  <p className="wizard-hint">Optional but helps people find you</p>

                  <label className="field-label">Height</label>
                  <div className="chip-grid compact">
                    {HEIGHTS.map((h) => (
                      <button
                        key={h}
                        className={`chip sm ${height === h ? 'active' : ''}`}
                        onClick={() => setHeight(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Body Type</label>
                  <div className="chip-grid">
                    {BODY_TYPES.map((b) => (
                      <button
                        key={b}
                        className={`chip ${body_type === b ? 'active' : ''}`}
                        onClick={() => setBodyType(b)}
                      >
                        {body_type === b && <Check size={12} />} {b}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Ethnicity</label>
                  <div className="chip-grid">
                    {ETHNICITIES.map((e) => (
                      <button
                        key={e}
                        className={`chip ${ethnicity === e ? 'active' : ''}`}
                        onClick={() => setEthnicity(e)}
                      >
                        {ethnicity === e && <Check size={12} />} {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step: Interests ── */}
              {step === 'interests' && (
                <div className="wizard-step">
                  <h2>What are you into?</h2>
                  <p className="wizard-hint">Pick what you enjoy (at least 1)</p>

                  <label className="field-label">Looking for</label>
                  <div className="chip-grid">
                    {LOOKING_FOR_OPTIONS.map((l) => (
                      <button
                        key={l}
                        className={`chip ${looking_for.includes(l) ? 'active' : ''}`}
                        onClick={() => toggleArrayItem(looking_for, setLookingFor, l)}
                      >
                        {looking_for.includes(l) && <Check size={12} />} {l}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Interests</label>
                  <div className="chip-grid">
                    {INTERESTS_OPTIONS.map((i) => (
                      <button
                        key={i}
                        className={`chip ${interests.includes(i) ? 'active' : ''}`}
                        onClick={() => toggleArrayItem(interests, setInterests, i)}
                      >
                        {interests.includes(i) && <Check size={12} />} {i}
                      </button>
                    ))}
                  </div>

                  <label className="field-label">Tagline</label>
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="A short catchphrase (optional)"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      maxLength={60}
                    />
                  </div>

                  <label className="field-label">Bio</label>
                  <textarea
                    className="text-area"
                    placeholder="Tell people about yourself (optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={300}
                  />
                </div>
              )}

              {/* ── Step: Done ── */}
              {step === 'done' && (
                <div className="wizard-step wizard-done">
                  <div className="wizard-done-icon">🎉</div>
                  <h2>You're all set!</h2>
                  <p className="wizard-hint">
                    Welcome to Chasr, <strong>{name}</strong>!
                    <br />Your profile is ready. Let's find your people.
                  </p>

                  <button className="btn-primary auth-submit" onClick={finishProfile}>
                    Start Browsing
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            {step !== 'done' && (
              <div className="wizard-nav">
                <button
                  className="btn-primary auth-submit"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  {step === 'interests' ? 'Finish' : 'Continue'}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
