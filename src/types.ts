export interface UserProfile {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  identity: string;
  tagline: string;
  bio: string;
  distance: string;
  photos: string[];
  height: string;
  bodyType: string;
  body_type?: string;
  ethnicity: string;
  lookingFor: string[];
  looking_for?: string[];
  interests: string[];
  lastActive: string;
  last_active?: number;
  lat: number;
  lng: number;
  verified: boolean;
  online: boolean;
  distance_km?: number;
  location_sharing?: boolean;
}
