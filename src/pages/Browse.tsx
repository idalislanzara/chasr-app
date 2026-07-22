import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Navigation, Loader2, Heart, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';

const IDENTITY_OPTIONS = ['All', 'Trans Woman', 'Trans Man', 'Non-Binary', 'Genderqueer', 'Genderfluid'];

export default function Browse() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [matchPopup, setMatchPopup] = useState<{ name: string; photo: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [identityFilter, setIdentityFilter] = useState('All');
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60]);
  const [holdTarget, setHoldTarget] = useState<string | null>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getFavorites().then(data => {
      setFavoritedIds(new Set((data.favorites || []).map((f: UserProfile) => f.id)));
    }).catch(() => {});
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter === 'online') params.online = 'true';
      if (searchQuery) params.search = searchQuery;
      const data = await api.getProfiles(params);
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(fetchProfiles, searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchProfiles, searchQuery]);

  const filteredProfiles = profiles.filter(p => {
    if (identityFilter !== 'All' && p.identity !== identityFilter) return false;
    if (p.age < ageRange[0] || p.age > ageRange[1]) return false;
    return true;
  }).sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return 0;
  });

  // Tap = navigate to profile, Hold = quick favorite
  const handlePointerDown = (_e: React.PointerEvent, profileId: string) => {
    holdTimerRef.current = setTimeout(() => {
      // Long press — quick favorite
      quickFavorite(profileId);
      holdTimerRef.current = null;
    }, 500);
  };

  const handlePointerUp = (_e: React.PointerEvent, profileId: string) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      // Short tap — navigate
      navigate(`/profile/${profileId}`);
    } else {
      // Was a long press — just clear
      holdTimerRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const quickFavorite = async (profileId: string) => {
    if (favoritedIds.has(profileId)) return;
    setHoldTarget(profileId);
    setTimeout(() => setHoldTarget(null), 800);

    try {
      const result = await api.favorite(profileId);
      setFavoritedIds(prev => new Set([...prev, profileId]));
      if (result.isMatch) {
        const p = profiles.find(pr => pr.id === profileId);
        if (p) setMatchPopup({ name: p.name, photo: p.photos?.[0] || '' });
      }
    } catch (err) {
      console.error('Favorite failed:', err);
    }
  };

  const handleMessage = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    try {
      if (!favoritedIds.has(profileId)) {
        await api.favorite(profileId);
        setFavoritedIds(prev => new Set([...prev, profileId]));
      }
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="page browse-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="page browse-page">
      <header className="browse-header">
        <h1 className="logo">chasr</h1>
        <div className="browse-header-actions">
          <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} />
          </button>
          <button className="btn-nearby-map" onClick={() => navigate('/nearby')}>
            <Navigation size={16} />
            <span>Map</span>
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="filter-drawer">
          <div className="filter-group">
            <label>Identity</label>
            <div className="filter-chips">
              {IDENTITY_OPTIONS.map(opt => (
                <button key={opt} className={`filter-chip ${identityFilter === opt ? 'active' : ''}`} onClick={() => setIdentityFilter(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Age: {ageRange[0]} – {ageRange[1]}</label>
            <div className="filter-range">
              <input type="range" min={18} max={60} value={ageRange[0]} onChange={e => setAgeRange([Number(e.target.value), ageRange[1]])} />
              <input type="range" min={18} max={60} value={ageRange[1]} onChange={e => setAgeRange([ageRange[0], Number(e.target.value)])} />
            </div>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`filter-chip ${filter === 'online' ? 'active' : ''}`} onClick={() => setFilter('online')}>Online</button>
            </div>
          </div>
        </div>
      )}

      <div className="browse-search">
        <input
          type="text"
          placeholder="Search by name, identity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="browse-search-input"
        />
      </div>

      {!showFilters && (
        <div className="filter-pills">
          <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({filteredProfiles.length})
          </button>
          <button className={`pill ${filter === 'online' ? 'active' : ''}`} onClick={() => setFilter('online')}>
            Online
          </button>
        </div>
      )}

      <div className="profile-grid">
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`profile-card ${holdTarget === profile.id ? 'hold-flash' : ''} `}
            onPointerDown={(e) => handlePointerDown(e, profile.id)}
            onPointerUp={(e) => handlePointerUp(e, profile.id)}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="card-image">
              <img
                src={profile.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`}
                alt={profile.name}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff&size=400&bold=true&format=svg`;
                }}
              />
              {profile.online && <span className="online-dot" />}
              {profile.verified && <span className="verified-badge-grid"><ShieldCheck size={12} /></span>}
              <div className="card-actions-overlay">
                <button
                  className={`card-action-btn tap-btn ${favoritedIds.has(profile.id) ? 'favorited' : ''}`}
                  onClick={(e) => { e.stopPropagation(); quickFavorite(profile.id); }}
                  title="Favorite"
                >
                  <Heart size={16} fill={favoritedIds.has(profile.id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  className="card-action-btn msg-btn"
                  onClick={(e) => handleMessage(e, profile.id)}
                  title="Message"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
            <div className="card-info">
              <div className="card-name-row">
                <span className="card-name">{profile.name}, {profile.age}</span>
              </div>
              <span className="card-identity">{profile.identity}</span>
              <div className="card-meta">
                <MapPin size={10} />
                <span>{profile.distance || 'Nearby'}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredProfiles.length === 0 && !loading && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <span className="empty-icon">&#128064;</span>
            <h3>No one found</h3>
            <p>Try adjusting your filters or search!</p>
          </div>
        )}
      </div>

      {matchPopup && (
        <div className="match-overlay" onClick={() => setMatchPopup(null)}>
          <div className="match-modal" onClick={e => e.stopPropagation()}>
            <div className="match-stars">&#11088;</div>
            <h2>It's a match!</h2>
            <p>You and <strong>{matchPopup.name}</strong> liked each other</p>
            <div className="match-avatar">
              <img src={matchPopup.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchPopup.name)}&background=random&color=fff&size=200&bold=true&format=svg`} alt={matchPopup.name} />
            </div>
            <div className="match-actions">
              <button className="btn-primary" onClick={() => { setMatchPopup(null); navigate('/chat'); }}>Send Message</button>
              <button className="btn-secondary" onClick={() => setMatchPopup(null)}>Keep Browsing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
