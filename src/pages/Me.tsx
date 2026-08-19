import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, ShieldCheck, MapPin, Radio, RadioOff, LogOut, Trash2,
  Edit3, ChevronRight, Loader2, X, Check, Crown, Gift, Volume2, VolumeX
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../authStore';
import { api } from '../api';
import { playMessageSound, soundEnabled, setSoundEnabled } from '../audio';

const IDENTITY_OPTIONS = ['Trans Woman', 'Trans Man', 'Non-Binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Cross Dresser', 'Questioning', 'Other'];
const SURGERY_OPTIONS = ['Pre-op', 'Post-op', 'Non-op', 'Prefer not to say'];
const SEXUALITY_OPTIONS = ['Straight', 'Gay', 'Bisexual', 'Queer', 'Curious', 'Pansexual', 'Asexual', 'Prefer not to say'];
const PRONOUNS_OPTIONS = ['she/her', 'he/him', 'they/them', 'ze/zir', 'she/they', 'he/they', 'any pronouns', 'other'];
const LOOKING_FOR_OPTIONS = ['Dates', 'Friends', 'Chat', 'Right Now', 'Relationship', 'Networking'];
const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Curvy', 'Petite', 'Muscular', 'Full-figured', 'Prefer not to say'];

export default function Me() {
  const { state, dispatch } = useApp();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [favCount, setFavCount] = useState(0);
  const [premium, setPremium] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [soundOn, setSoundOnState] = useState(soundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [name, setName] = useState('');
  const [age, setAge] = useState(18);
  const [pronouns, setPronouns] = useState('');
  const [identity, setIdentity] = useState('');
  const [surgeryStatus, setSurgeryStatus] = useState('');
  const [sexuality, setSexuality] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  useEffect(() => {
    api.getFavorites().then(d => setFavCount(d.favorites?.length || 0)).catch(() => {});
    api.getPremium().then(d => {
      setPremium(!!d.premium);
      setInviteCode(d.invite_code || '');
      setInviteUrl(d.invite_url || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && editing) {
      setName(user.name || '');
      setAge(user.age || 18);
      setPronouns(user.pronouns || '');
      setIdentity(user.identity || '');
      setSurgeryStatus(user.surgery_status || '');
      setSexuality(user.sexuality || '');
      setTagline(user.tagline || '');
      setBio(user.bio || '');
      setHeight(user.height || '');
      setBodyType(user.body_type || '');
      setLookingFor(user.looking_for || []);
    }
  }, [user, editing]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently? Your profile, photos, matches and chats will be removed. This cannot be undone.')) return;
    try {
      await api.deleteAccount();
      logout();
      navigate('/login', { replace: true });
    } catch {
      alert('Could not delete account right now. Please try again.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const result = await api.uploadPhotos(Array.from(files));
      if (result.photos) {
        await updateProfile({ photos: result.photos } as any);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const makeMain = async (i: number) => {
    if (i === 0) return;
    setUploading(true);
    try {
      const result = await api.setMainPhoto(i);
      if (result.photos) await updateProfile({ photos: result.photos } as any);
    } catch (err) {
      console.error('Reorder failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (i: number) => {
    setUploading(true);
    try {
      const result = await api.deletePhoto(i);
      if (result.photos) await updateProfile({ photos: result.photos } as any);
    } catch (err) {
      console.error('Remove failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (age < 18 || age > 99) {
      alert('Please enter a valid age between 18 and 99');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name,
        age,
        pronouns,
        identity,
        surgery_status: surgeryStatus,
        sexuality,
        tagline,
        bio,
        height,
        body_type: bodyType,
        looking_for: lookingFor,
      } as any);
      setEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleLookingFor = (opt: string) => {
    setLookingFor(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  if (!user) return null;

  const { logout } = useAuth();

  if (editing) {
    return (
      <div className="page me-page" style={{ paddingBottom: 100 }}>
        <header className="me-header" style={{ marginBottom: 20 }}>
          <button className="btn-back-edit" onClick={() => setEditing(false)}>
            <X size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</h1>
          <button className="btn-save-edit" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <><Check size={16} /> Save</>}
          </button>
        </header>

        <div className="edit-section">
          <label>Photos</label>
          {user.photos.length > 0 && (
            <div className="photo-strip">
              {user.photos.map((url, i) => (
                <div key={url} className={`photo-thumb ${i === 0 ? 'main' : ''}`}>
                  <img src={url} alt={`Photo ${i + 1}`} onClick={() => makeMain(i)} />
                  {i === 0 && <span className="photo-main-badge">Main</span>}
                  <button type="button" className="photo-remove" onClick={() => removePhoto(i)} title="Remove photo">×</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="spin" /> : <><Camera size={16} /> Add photos</>}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Up to 9 photos. Tap one to make it your main photo.</p>
        </div>

        <div className="edit-section">
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="edit-input" placeholder="Your display name" />
        </div>

        <div className="edit-section">
          <label>Age</label>
          <input type="number" min={18} max={99} value={age || ''} placeholder="Your age" onChange={e => setAge(e.target.value === '' ? 0 : Number(e.target.value))} className="edit-input" />
        </div>

        <div className="edit-section">
          <label>Pronouns</label>
          <div className="edit-chips">
            {PRONOUNS_OPTIONS.map(opt => (
              <button key={opt} className={`filter-chip ${pronouns === opt ? 'active' : ''}`} onClick={() => setPronouns(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>Identity</label>
          <div className="edit-chips">
            {IDENTITY_OPTIONS.map(opt => (
              <button key={opt} className={`filter-chip ${identity === opt ? 'active' : ''}`} onClick={() => setIdentity(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>Surgical status (optional)</label>
          <div className="edit-chips">
            {SURGERY_OPTIONS.map(opt => (
              <button key={opt} className={`filter-chip ${surgeryStatus === opt ? 'active' : ''}`} onClick={() => setSurgeryStatus(surgeryStatus === opt ? '' : opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>Sexuality (optional)</label>
          <div className="edit-chips">
            {SEXUALITY_OPTIONS.map(opt => (
              <button key={opt} className={`filter-chip ${sexuality === opt ? 'active' : ''}`} onClick={() => setSexuality(sexuality === opt ? '' : opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>Tagline</label>
          <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="edit-input" placeholder="A short catchphrase" maxLength={60} />
        </div>

        <div className="edit-section">
          <label>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className="edit-textarea" placeholder="Tell people about yourself..." rows={4} maxLength={500} />
        </div>

        <div className="edit-section">
          <label>Height</label>
          <input type="text" value={height} onChange={e => setHeight(e.target.value)} className="edit-input" placeholder="5'7&quot;" />
        </div>

        <div className="edit-section">
          <label>Body Type</label>
          <div className="edit-chips">
            {BODY_TYPES.map(opt => (
              <button key={opt} className={`filter-chip ${bodyType === opt ? 'active' : ''}`} onClick={() => setBodyType(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>Looking For</label>
          <div className="edit-chips">
            {LOOKING_FOR_OPTIONS.map(opt => (
              <button key={opt} className={`filter-chip ${lookingFor.includes(opt) ? 'active' : ''}`} onClick={() => toggleLookingFor(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page me-page">
      <header className="me-header">
        <div className="me-avatar-frame" onClick={() => fileInputRef.current?.click()}>
          <img src={user.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'You')}&background=e040fb&color=fff&size=400&bold=true&format=svg`} alt="Profile" className="me-avatar" />
          <div className="btn-camera">
            {uploading ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
        </div>
        <h1>{user.name}, {user.age}</h1>
        <p className="me-pronouns">{user.pronouns} · {user.identity}</p>
        {user.verified && <span className="me-verified"><ShieldCheck size={14} /> Verified</span>}
      </header>

      <div className="me-premium-row">
        {premium ? (
          <span className="me-premium-badge active"><Crown size={14} /> Chasr+ Active</span>
        ) : (
          <span className="me-premium-badge" onClick={() => navigate('/store')}><Crown size={14} /> Go Chasr+</span>
        )}
        <span className="me-favorites-link" onClick={() => navigate('/favorites')}>Likes <ChevronRight size={14} /></span>
      </div>

      <div className="me-section invite-section">
        <h3><Gift size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Invite friends — get Chasr+ free</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
          You and your friend each get 7 days of Chasr+ when they join with your code.
        </p>
        <div className="invite-code-row">
          <code className="invite-code">{inviteCode || '••••••••'}</code>
          <button
            className="btn-primary"
            style={{ padding: '10px 14px', fontSize: 13, flexShrink: 0 }}
            onClick={async () => {
              if (!inviteUrl) return;
              try {
                if (navigator.share) { await navigator.share({ title: 'Join me on Chasr Dating 💜', url: inviteUrl }); }
                else { await navigator.clipboard.writeText(inviteUrl); alert('Invite link copied!'); }
              } catch {}
            }}
          >Share</button>
        </div>
      </div>

      <button className="btn-edit-profile" onClick={() => setEditing(true)}>
        <Edit3 size={16} />
        <span>Edit Profile</span>
        <ChevronRight size={16} />
      </button>

      <div className="me-stats-row">
        <div className="me-stat" onClick={() => navigate('/favorites')}>
          <span className="me-stat-num">{favCount}</span>
          <span>Favorites</span>
        </div>
      </div>

      <div className="me-section">
        <h3><MapPin size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Location Sharing</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {state.locationSharing ? 'Your location is shared. People nearby can find you.' : 'Location sharing is off.'}
        </p>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_LOCATION_SHARING' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderRadius: 'var(--radius-sm)', width: '100%',
            background: state.locationSharing ? 'var(--green-bg)' : 'var(--bg-card)',
            border: `1px solid ${state.locationSharing ? 'var(--green)' : 'rgba(255,255,255,0.06)'}`,
            color: state.locationSharing ? 'var(--green)' : 'var(--text-secondary)',
            fontWeight: 500, fontSize: 14, cursor: 'pointer',
          }}
        >
          {state.locationSharing ? <Radio size={16} /> : <RadioOff size={16} />}
          {state.locationSharing ? 'Location ON' : 'Location OFF'}
        </button>
      </div>

      <div className="me-section">
        <h3>Chasr Sounds</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          The signature Chasr ping plays when a new message or match arrives.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundEnabled(next);
              setSoundOnState(next);
              if (next) playMessageSound();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: soundOn ? 'var(--accent-bg, rgba(224,64,251,0.12))' : 'var(--bg-card)',
              border: `1px solid ${soundOn ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
              color: soundOn ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundOn ? 'Sounds ON' : 'Sounds OFF'}
          </button>
          <button
            onClick={() => playMessageSound()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}
          >
            Test
          </button>
        </div>
      </div>

      <div className="me-section">
        <h3>About You</h3>
        <p className="me-bio">{user.bio || 'No bio yet'}</p>
      </div>

      {user.interests && user.interests.length > 0 && (
        <div className="me-section">
          <h3>Your Interests</h3>
          <div className="tag-list">
            {user.interests.map((i: string) => <span key={i} className="tag tag-interest">{i}</span>)}
          </div>
        </div>
      )}

      <button className="btn-logout" onClick={handleLogout}>
        <LogOut size={18} />
        Log Out
      </button>

      <button className="btn-danger" onClick={handleDeleteAccount}>
        <Trash2 size={18} />
        Delete Account
      </button>

      <footer className="me-footer">
        <p>Chasr Dating v2.1 · Made with love for the trans community</p>
        <p className="me-email">{user.email}</p>
      </footer>
    </div>
  );
}
