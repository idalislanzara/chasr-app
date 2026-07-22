import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, Loader2 } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';

export default function RightNow() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOnline().then(data => {
      setProfiles(data.profiles || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page right-now-page">
      <header className="page-header">
        <Zap size={24} style={{ color: 'var(--accent)' }} />
        <h1>Right Now</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{profiles.length} online</span>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">&#128164;</span>
          <h3>No one online right now</h3>
          <p>Check back later!</p>
        </div>
      ) : (
        <div className="online-carousel">
          {profiles.map(profile => (
            <div key={profile.id} className="online-card" onClick={() => navigate(`/profile/${profile.id}`)}>
              <div className="online-card-img">
                <img
                  src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=200&bold=true&format=svg`}
                  alt={profile.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=200&bold=true&format=svg`;
                  }}
                />
                <span className="online-dot" />
              </div>
              <div className="online-card-info">
                <span className="online-card-name">{profile.name}, {profile.age}</span>
                <span className="online-card-identity">{profile.identity}</span>
                <div className="online-card-meta">
                  <MapPin size={10} />
                  <span>{profile.distance || 'Nearby'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
