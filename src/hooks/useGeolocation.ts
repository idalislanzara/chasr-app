import { useState, useEffect, useRef, useCallback } from 'react';

interface GeoState {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseGeolocationReturn {
  position: GeoState | null;
  error: GeolocationPositionError | null;
  watching: boolean;
  started: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  requestPermission: () => void;
  permissionState: PermissionState | 'unsupported' | 'prompt';
}

export default function useGeolocation(options?: {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoState | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [watching, setWatching] = useState(false);
  const [started, setStarted] = useState(false);
  const [permissionState, setPermissionState] = useState<
    PermissionState | 'unsupported' | 'prompt'
  >('prompt');
  const watchIdRef = useRef<number | null>(null);

  const geoOptions: PositionOptions = {
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
    maximumAge: options?.maximumAge ?? 5000,
    timeout: options?.timeout ?? 15000,
  };

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    });
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err);
    if (err.code === err.PERMISSION_DENIED) {
      setPermissionState('denied');
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return;
    }

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);

    // Start continuous watching
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
    watchIdRef.current = id;
    setWatching(true);
    setStarted(true);
  }, [handleSuccess, handleError, geoOptions]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }, []);

  const requestPermission = useCallback(async () => {
    // Check if Permissions API is available
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(result.state);
        result.addEventListener('change', () => {
          setPermissionState(result.state);
        });
      } catch {
        setPermissionState('prompt');
      }
    } else {
      setPermissionState('prompt');
    }
    startTracking();
  }, [startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    watching,
    started,
    startTracking,
    stopTracking,
    requestPermission,
    permissionState,
  };
}

// Utility: calculate distance between two lat/lng points (Haversine formula)
export function getDistanceFromLatLng(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance nicely
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Convert km to miles
export function kmToMiles(km: number): number {
  return km * 0.621371;
}
