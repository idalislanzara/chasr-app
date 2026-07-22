import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<(UserProfile & { isMatch?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites().then(data => {
      setFavorites(data.favorites || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);


  if (loading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} /></div>;
  }

  return (
    <div className="page favorites-page">
      <header className="page-header">
        <Heart size={24} style={{ color: 'var(--accent)' }} />
        <h1>Favorites & Matches</h1>
      </header>
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
    </div>
  );
}
