import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, ShieldCheck,
  MapPin, Ruler, Clock, Ban, Loader2, Share2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { UserProfile } from '../types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [matchPopup, setMatchPopup] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getProfiles({}).then(data => {
      const found = data.profiles.find((p: UserProfile) => p.id === id);
      setProfile(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.getFavorites().then(data => {
      setIsFavorited(data.favorites.some((f: UserProfile) => f.id === id));
    }).catch(() => {});
  }, [id]);

  // Swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!profile?.photos || profile.photos.length < 2) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && photoIdx < profile.photos.length - 1) {
      setPhotoIdx(prev => prev + 1);
    } else if (diff < -threshold && photoIdx > 0) {
      setPhotoIdx(prev => prev - 1);
    }
  }, [photoIdx, profile]);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page empty-state">
        <h3>Profile not found</h3>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await api.unfavorite(profile.id);
        setIsFavorited(false);
      } else {
        const result = await api.favorite(profile.id);
        setIsFavorited(true);
        if (result.isMatch) setMatchPopup(true);
      }
    } catch (err) {
      console.error('Favorite failed:', err);
    }
  };

  const handleMessage = async () => {
    try {
      if (!isFavorited) await api.favorite(profile.id);
      navigate('/chat');
    } catch (err) {
      console.error('Message failed:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Check out ${profile.name} on Chasr`, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const photoCount = profile.photos?.length || 0;

  return (
    <div className="page profile-page">
      {/* Photo Gallery */}
      <div
        className="profile-photo-gallery"
        ref={photoContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="photo-track"
          style={{ transform: `translateX(-${photoIdx * 100}%)` }}
        >
          {(profile.photos?.length ? profile.photos : [
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=600&bold=true&format=svg`
          ]).map((photo, i) => (
            <div key={i} className="photo-slide">
              <img
                src={photo}
                alt={`${profile.name} photo ${i + 1}`}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=600&bold=true&format=svg`;
                }}
              />
            </div>
          ))}
        </div>

        {/* Nav arrows for desktop */}
        {photoCount > 1 && (
          <>
            {photoIdx > 0 && (
              <button className="photo-nav photo-nav-left" onClick={(e) => { e.stopPropagation(); setPhotoIdx(prev => prev - 1); }}>
                <ChevronLeft size={24} />
              </button>
            )}
            {photoIdx < photoCount - 1 && (
              <button className="photo-nav photo-nav-right" onClick={(e) => { e.stopPropagation(); setPhotoIdx(prev => prev + 1); }}>
                <ChevronRight size={24} />
              </button>
            )}
          </>
        )}

        {/* Top bar */}
        <div className="profile-hero-overlay">
          <button className="btn-icon btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <button className="btn-icon btn-share" onClick={handleShare}>
            <Share2 size={18} />
          </button>
        </div>

        {/* Photo progress bar */}
        {photoCount > 1 && (
          <div className="photo-progress-bar">
            {profile.photos.map((_: string, i: number) => (
              <div key={i} className={`photo-progress-segment ${i === photoIdx ? 'active' : ''} ${i < photoIdx ? 'done' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-name-row">
          <h1>{profile.name}, {profile.age}</h1>
          {profile.verified && <ShieldCheck size={20} className="verified-icon-lg" />}
        </div>
        <p className="profile-pronouns">{profile.pronouns}</p>
        <p className="profile-identity-tag">{profile.identity}</p>
        <p className="profile-tagline">"{profile.tagline}"</p>

        <div className="profile-stats">
          <div className="stat"><Ruler size={16} /><span>{profile.height}</span></div>
          <div className="stat"><MapPin size={16} /><span>{profile.distance || 'Nearby'}</span></div>
          <div className="stat"><Clock size={16} /><span>{profile.lastActive || 'Recently'}</span></div>
        </div>

        <div className="profile-actions">
          <button className={`btn-profile-action ${isFavorited ? 'favorited' : ''}`} onClick={handleFavorite}>
            <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
            <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
          </button>
          <button className="btn-profile-action btn-message" onClick={handleMessage}>
            <MessageCircle size={20} />
            <span>Message</span>
          </button>
        </div>

        <div className="profile-section">
          <h3>About</h3>
          <p>{profile.bio}</p>
        </div>

        <div className="profile-section">
          <h3>Basic Info</h3>
          <div className="info-grid">
            <span className="info-label">Body Type</span>
            <span className="info-value">{profile.bodyType || profile.body_type || '—'}</span>
            <span className="info-label">Ethnicity</span>
            <span className="info-value">{profile.ethnicity || '—'}</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>Looking For</h3>
          <div className="tag-list">
            {(profile.lookingFor || profile.looking_for || []).map((tag: string) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <h3>Interests</h3>
          <div className="tag-list">
            {(profile.interests || []).map((interest: string) => (
              <span key={interest} className="tag tag-interest">{interest}</span>
            ))}
          </div>
        </div>

        <button className="btn-block" onClick={async () => {
          await api.block(profile.id);
          navigate(-1);
        }}>
          <Ban size={16} />
          Block & Report
        </button>
      </div>

      {matchPopup && (
        <div className="match-overlay" onClick={() => setMatchPopup(false)}>
          <div className="match-modal" onClick={e => e.stopPropagation()}>
            <div className="match-stars">&#11088;</div>
            <h2>It's a match!</h2>
            <p>You and <strong>{profile.name}</strong> liked each other</p>
            <div className="match-avatar">
              <img src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=200&bold=true&format=svg`} alt={profile.name} />
            </div>
            <div className="match-actions">
              <button className="btn-primary" onClick={() => { setMatchPopup(false); navigate('/chat'); }}>Send Message</button>
              <button className="btn-secondary" onClick={() => setMatchPopup(false)}>Keep Browsing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
