import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, Sparkles, Loader2, Lock } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<(UserProfile & { isMatch?: boolean })[]>([]);
  const [likes, setLikes] = useState<{ locked: boolean; count: number; profiles: (UserProfile & { isMatch?: boolean })[] }>({ locked: true, count: 0, profiles: [] });
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites().then(data => setFavorites(data.favorites || [])).catch(() => {});
    api.getLikes().then(data => setLikes(data)).catch(() => {});
    api.getPremium().then(data => setPremium(!!data.premium)).catch(() => {});
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} /></div>;
  }

  return (
    <div className="page favorites-page">
      <header className="page-header">
        <Heart size={24} style={{ color: 'var(--accent)' }} />
        <h1>Likes & Favorites</h1>
      </header>

      {/* Liked You (premium) */}
      {likes.count > 0 && (
        <section className="liked-you-section">
          <div className="store-section-header">
            <Sparkles size={16} />
            <h2>Liked You</h2>
            <span className="liked-you-count">{likes.count}</span>
          </div>
          {likes.locked ? (
            <div className="liked-you-locked" onClick={() => navigate('/store')}>
              <div className="liked-you-blur">
                {[0, 1, 2].map(i => (
                  <div key={i} className="blur-card"><span /></div>
                ))}
              </div>
              <div className="liked-you-cta">
                <Lock size={18} />
                <div>
                  <strong>{likes.count} {likes.count === 1 ? 'person' : 'people'} liked you</strong>
                  <p>Upgrade to Chasr+ to see who liked you</p>
                </div>
                <button className="btn-primary">See who</button>
              </div>
            </div>
          ) : (
            <div className="profile-grid">
              {likes.profiles.map(profile => (
                <div key={profile.id} className={`profile-card ${profile.isMatch ? 'match-card' : ''}`} onClick={() => navigate(`/profile/${profile.id}`)}>
                  <div className="card-image">
                    <img
                      src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`}
                      alt={profile.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`; }}
                    />
                    {profile.isMatch && <span className="match-badge">Match!</span>}
                  </div>
                  <div className="card-info">
                    <div className="card-name-row">
                      <span className="card-name">{profile.name}, {profile.age}</span>
                      {profile.verified && <ShieldCheck size={14} className="verified-icon" />}
                    </div>
                    <span className="card-identity">{profile.identity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {likes.count === 0 && !premium && (
        <div className="auth-error" style={{ marginBottom: 12 }}>
          <strong>Chasr+ is on!</strong> Invite a friend with your invite link and you both get 7 days free — including seeing who liked you.
        </div>
      )}

      {/* Favorites & matches */}
      <section className="favorites-section">
        <div className="store-section-header">
          <Heart size={16} />
          <h2>Your Favorites</h2>
        </div>
        {favorites.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">&#10084;&#65039;</span>
            <h3>No favorites yet</h3>
            <p>Tap the heart on a profile to save them!</p>
          </div>
        ) : (
          <div className="profile-grid">
            {favorites.map(profile => (
              <div key={profile.id} className={`profile-card ${profile.isMatch ? 'match-card' : ''}`} onClick={() => navigate(`/profile/${profile.id}`)}>
                <div className="card-image">
                  <img
                    src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`}
                    alt={profile.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`; }}
                  />
                  {profile.isMatch && <span className="match-badge">Match!</span>}
                </div>
                <div className="card-info">
                  <div className="card-name-row">
                    <span className="card-name">{profile.name}, {profile.age}</span>
                    {profile.verified && <ShieldCheck size={14} className="verified-icon" />}
                  </div>
                  <span className="card-identity">{profile.identity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
