import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';

export default function Nearby() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await api.getNearby(lat, lng, 50);
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Nearby fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchNearby(40.7306, -73.9866);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => { setPermissionDenied(true); fetchNearby(40.7306, -73.9866); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchNearby]);

  const sortedProfiles = [...profiles].sort((a, b) => {
    const distA = a.distance_km ?? 999;
    const distB = b.distance_km ?? 999;
    return distA - distB;
  });

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Finding people near you...</p>
      </div>
    );
  }

  return (
    <div className="page nearby-page">
      <header className="browse-header">
        <h1 className="logo">Nearby</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <MapPin size={14} />
          <span>{profiles.length} people around</span>
        </div>
      </header>
      {permissionDenied && (
        <div className="auth-error" style={{ marginBottom: 12 }}>
          Location access denied. Showing default area. Enable location in browser settings for real distances.
        </div>
      )}
      <div className="profile-grid">
        {sortedProfiles.map((profile) => (
          <div key={profile.id} className="profile-card" onClick={() => navigate(`/profile/${profile.id}`)}>
            <div className="card-image">
              <img
                src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`}
                alt={profile.name}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`; }}
              />
              {profile.online && <span className="online-dot" />}
            </div>
            <div className="card-info">
              <div className="card-name-row">
                <span className="card-name">{profile.name}, {profile.age}</span>
              </div>
              <span className="card-identity">{profile.identity}</span>
              <div className="card-meta">
                <Navigation size={12} />
                <span>{profile.distance_km && profile.distance_km > 0 ? profile.distance_km.toFixed(1) + " km" : profile.distance || "Nearby"}</span>
              </div>
              <p className="card-tagline">{profile.tagline}</p>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">&#128205;</span>
            <h3>No one nearby</h3>
            <p>Try expanding your search radius!</p>
          </div>
        )}
      </div>
    </div>
  );
}
