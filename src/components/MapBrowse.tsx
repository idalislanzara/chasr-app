import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Heart, X, Navigation, ShieldCheck, MapPin,
  Crosshair, Radio, RadioOff, Loader2, AlertTriangle,
  Eye, EyeOff,
} from 'lucide-react';
import profiles from '../data';
import { api } from '../api';
import { useApp } from '../store';
import useGeolocation, {
  getDistanceFromLatLng,
  formatDistance,
  kmToMiles,
} from '../hooks/useGeolocation';
import type { UserProfile } from '../types';
import MatchModal from './MatchModal';

const DEFAULT_CENTER: [number, number] = [40.7306, -73.9866];

// ── Marker Icons ──

function createProfileIcon(photo: string, isOnline: boolean): L.DivIcon {
  return L.divIcon({
    className: 'profile-marker-wrapper',
    html: `
      <div class="profile-marker ${isOnline ? 'online' : ''}">
        <img src="${photo}" alt="" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function createMyLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'my-location-wrapper',
    html: `
      <div class="my-location-marker">
        <div class="my-location-pulse"></div>
        <div class="my-location-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// ── Map Sub-Components ──

function RecenterButton({ onRecenter }: { onRecenter: () => void }) {
  return (
    <button className="map-recenter-btn" onClick={onRecenter} aria-label="Recenter">
      <Crosshair size={20} />
    </button>
  );
}

function ZoomControl() {
  const map = useMap();
  return (
    <div className="map-zoom-controls">
      <button className="map-zoom-btn" onClick={() => map.zoomIn()}>+</button>
      <button className="map-zoom-btn" onClick={() => map.zoomOut()}>−</button>
    </div>
  );
}

function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  useMapEvents({
    moveend: (e) => onBoundsChange(e.target.getBounds()),
  });
  return null;
}

// Re-center map when live position updates
function LivePositionSync({
  position,
  sharing,
  shouldFollow,
}: {
  position: { lat: number; lng: number } | null;
  sharing: boolean;
  shouldFollow: boolean;
}) {
  const map = useMap();
  const firstFix = useRef(true);

  useEffect(() => {
    if (position && sharing && shouldFollow) {
      if (firstFix.current) {
        map.setView([position.lat, position.lng], 14, { animate: true, duration: 1.5 });
        firstFix.current = false;
      } else {
        map.flyTo([position.lat, position.lng], map.getZoom(), { duration: 0.8 });
      }
    }
  }, [position, sharing, shouldFollow, map]);

  return null;
}

// ── Profile Preview Sheet ──

function ProfilePreview({
  profile,
  onLike,
  onPass,
  onVisit,
  isLiked,
  myPos,
}: {
  profile: UserProfile;
  onLike: () => void;
  onPass: () => void;
  onVisit: () => void;
  isLiked: boolean;
  myPos: { lat: number; lng: number } | null;
}) {
  const distKm = myPos
    ? getDistanceFromLatLng(myPos.lat, myPos.lng, profile.lat, profile.lng)
    : null;

  return (
    <div className="map-preview-sheet">
      <div className="map-preview-inner" onClick={onVisit}>
        <div className="map-preview-handle" />
        <div className="map-preview-content">
          <img src={profile.photos[0]} alt={profile.name} className="map-preview-photo" onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.name) + "&background=random&color=fff&size=400&bold=true&format=svg"; }} />
          <div className="map-preview-info">
            <div className="map-preview-name-row">
              <span className="map-preview-name">{profile.name}, {profile.age}</span>
              {profile.verified && <ShieldCheck size={14} className="verified-icon" />}
            </div>
            <span className="map-preview-identity">{profile.identity}</span>
            <p className="map-preview-tagline">{profile.tagline}</p>
            <div className="map-preview-meta">
              {distKm !== null ? (
                <>
                  <MapPin size={12} />
                  <span>{formatDistance(kmToMiles(distKm))} away</span>
                  <span className="map-preview-sep">·</span>
                </>
              ) : (
                <>
                  <MapPin size={12} />
                  <span>{profile.distance}</span>
                  <span className="map-preview-sep">·</span>
                </>
              )}
              <span>{profile.lastActive}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="map-preview-actions">
        <button className="btn-icon btn-pass" onClick={(e) => { e.stopPropagation(); onPass(); }}>
          <X size={20} />
        </button>
        <button
          className={`btn-icon ${isLiked ? 'btn-unlike' : 'btn-like'}`}
          onClick={(e) => { e.stopPropagation(); onLike(); }}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <button className="btn-icon btn-visit" onClick={onVisit}>
          <Navigation size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Location Permission Prompt ──

function LocationPrompt({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  return (
    <div className="location-prompt-overlay">
      <div className="location-prompt-card">
        <div className="location-prompt-icon">📍</div>
        <h3>Enable Live Location</h3>
        <p>
          Allow Chasr to use your device's GPS so people nearby can find you and you can see exact distances.
        </p>
        <div className="location-prompt-features">
          <div className="lp-feature">
            <Eye size={14} />
            <span>See people near your real location</span>
          </div>
          <div className="lp-feature">
            <Radio size={14} />
            <span>Get accurate distance to profiles</span>
          </div>
          <div className="lp-feature">
            <EyeOff size={14} />
            <span>You can turn it off anytime</span>
          </div>
        </div>
        <button className="btn-primary" onClick={onAllow}>
          Allow Location Access
        </button>
        <button className="btn-skip" onClick={onSkip}>
          Use Default Location
        </button>
      </div>
    </div>
  );
}

// ── Main MapBrowse Component ──

export default function MapBrowse() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [matchModal, setMatchModal] = useState<{ name: string; photo: string } | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [followGps, setFollowGps] = useState(true);
  const [showAccuracyRing, setShowAccuracyRing] = useState(true);

  const geo = useGeolocation({ enableHighAccuracy: true, maximumAge: 3000 });
  const mapRef = useRef<L.Map | null>(null);

  // Sync GPS position to store
  useEffect(() => {
    if (geo.position && state.locationSharing) {
      dispatch({
        type: 'SET_LIVE_LOCATION',
        lat: geo.position.latitude,
        lng: geo.position.longitude,
        accuracy: geo.position.accuracy,
      });
    }
  }, [geo.position, state.locationSharing, dispatch]);

  const myPos = state.liveLocation
    ? { lat: state.liveLocation.lat, lng: state.liveLocation.lng }
    : null;

  const myLatLng: [number, number] = myPos
    ? [myPos.lat, myPos.lng]
    : DEFAULT_CENTER;

  const filtered = profiles.filter(
    (p) => !state.blockedProfiles.includes(p.id) && p.id !== 'me'
  );

  const visibleProfiles = useMemo(() => {
    if (!visibleBounds) return filtered;
    return filtered.filter((p) => visibleBounds.contains(L.latLng(p.lat, p.lng)));
  }, [filtered, visibleBounds]);

  // Sort by distance when we have a real position
  const sortedProfiles = useMemo(() => {
    if (!myPos) return visibleProfiles;
    return [...visibleProfiles].sort((a, b) => {
      const distA = getDistanceFromLatLng(myPos.lat, myPos.lng, a.lat, a.lng);
      const distB = getDistanceFromLatLng(myPos.lat, myPos.lng, b.lat, b.lng);
      return distA - distB;
    });
  }, [visibleProfiles, myPos]);

  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);

  useEffect(() => {
    api.getFavorites().then(data => {
      setFavoritedIds(data.favorites?.map((f: { id: string }) => f.id) || []);
    }).catch(() => {});
  }, []);

  const handleLike = useCallback(
    (profileId: string) => {
      api.favorite(profileId).then(result => {
        setFavoritedIds(prev => [...prev, profileId]);
        if (result.isMatch) {
          const p = profiles.find((pr) => pr.id === profileId);
          if (p) setMatchModal({ name: p.name, photo: p.photos[0] });
        }
      }).catch(() => {});
    },
    []
  );

  const handlePass = useCallback(
    (_profileId: string) => {
      setSelectedProfile(null);
    },
    []
  );

  const handleAllow = useCallback(() => {
    setShowPrompt(false);
    geo.requestPermission();
  }, [geo]);

  const handleSkip = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const handleRecenter = useCallback(() => {
    if (myPos) {
      setFollowGps(true);
    }
  }, [myPos]);

  const myIcon = useMemo(() => createMyLocationIcon(), []);

  return (
    <div className="map-browse">
      {/* Location permission prompt */}
      {showPrompt && !geo.started && (
        <LocationPrompt onAllow={handleAllow} onSkip={handleSkip} />
      )}

      <MapContainer
        center={myLatLng}
        zoom={14}
        className="map-container"
        zoomControl={false}
        attributionControl={false}
        ref={(map) => { mapRef.current = map; }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapBoundsTracker onBoundsChange={setVisibleBounds} />
        <LivePositionSync
          position={myPos}
          sharing={state.locationSharing}
          shouldFollow={followGps}
        />

        {/* Accuracy ring around user */}
        {myPos && state.locationSharing && showAccuracyRing && geo.position && (
          <AccuracyCircle
            center={[myPos.lat, myPos.lng]}
            radius={geo.position.accuracy}
          />
        )}

        {/* My location marker */}
        {state.locationSharing && myPos && (
          <Marker position={myLatLng} icon={myIcon} />
        )}

        {/* Profile markers */}
        {sortedProfiles.map((profile) => (
          <Marker
            key={profile.id}
            position={[profile.lat, profile.lng]}
            icon={createProfileIcon(profile.photos[0], profile.online)}
            eventHandlers={{
              click: () => setSelectedProfile(profile),
            }}
          />
        ))}

        <RecenterButton onRecenter={handleRecenter} />
        <ZoomControl />
      </MapContainer>

      {/* Top bar: count + controls */}
      <div className="map-top-bar">
        <div className="map-count-badge">
          <span className="map-count-num">{sortedProfiles.length}</span>
          <span className="map-count-label">people nearby</span>
        </div>
      </div>

      {/* Location status bar */}
      <div className="map-location-status">
        <div className="map-status-left">
          {geo.watching && state.locationSharing ? (
            <>
              <span className="status-dot live" />
              <span className="status-text">Live Location</span>
              {geo.position && (
                <span className="status-accuracy">
                  ±{Math.round(geo.position.accuracy)}m
                </span>
              )}
            </>
          ) : !state.locationSharing ? (
            <>
              <RadioOff size={13} />
              <span className="status-text">Sharing Off</span>
            </>
          ) : geo.error ? (
            <>
              <AlertTriangle size={13} />
              <span className="status-text">
                {geo.error.code === 1 ? 'Permission denied' : 'Location error'}
              </span>
            </>
          ) : (
            <>
              <Loader2 size={13} className="spin" />
              <span className="status-text">Locating...</span>
            </>
          )}
        </div>
        <div className="map-status-right">
          <button
            className={`status-btn ${showAccuracyRing ? 'active' : ''}`}
            onClick={() => setShowAccuracyRing(!showAccuracyRing)}
            title="Accuracy ring"
          >
            <Radio size={13} />
          </button>
          <button
            className={`status-btn ${state.locationSharing ? 'active' : 'off'}`}
            onClick={() => dispatch({ type: 'TOGGLE_LOCATION_SHARING' })}
            title={state.locationSharing ? 'Hide location' : 'Share location'}
          >
            {state.locationSharing ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>

      {/* Selected profile preview */}
      {selectedProfile && (
        <ProfilePreview
          profile={selectedProfile}
          isLiked={favoritedIds.includes(selectedProfile.id)}
          myPos={myPos}
          onLike={() => handleLike(selectedProfile.id)}
          onPass={() => handlePass(selectedProfile.id)}
          onVisit={() => navigate(`/profile/${selectedProfile.id}`)}
        />
      )}

      {matchModal && (
        <MatchModal
          name={matchModal.name}
          photo={matchModal.photo}
          onClose={() => setMatchModal(null)}
        />
      )}
    </div>
  );
}

// ── Accuracy Circle ──

function AccuracyCircle({ center, radius }: { center: [number, number]; radius: number }) {
  return (
    <>
      {/* Filled area */}
      <CircleMarker center={center} radius={Math.min(radius / 10, 200)} />
    </>
  );
}

function CircleMarker({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setLatLng(center);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = L.circle(center, {
        radius,
        color: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
        interactive: false,
      }).addTo(map);
    }
  }, [center, radius, map]);

  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    };
  }, [map]);

  return null;
}
