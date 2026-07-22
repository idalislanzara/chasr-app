import { createContext, useContext, useReducer, type ReactNode } from 'react';

interface AppState {
  blockedProfiles: string[];
  liveLocation: { lat: number; lng: number; accuracy: number } | null;
  locationSharing: boolean;
}

type AppAction =
  | { type: 'BLOCK'; profileId: string }
  | { type: 'SET_LIVE_LOCATION'; lat: number; lng: number; accuracy: number }
  | { type: 'TOGGLE_LOCATION_SHARING' }
  | { type: 'STOP_LOCATION_SHARING' };

const initialState: AppState = {
  blockedProfiles: [],
  liveLocation: null,
  locationSharing: true,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'BLOCK':
      return { ...state, blockedProfiles: [...state.blockedProfiles, action.profileId] };
    case 'SET_LIVE_LOCATION':
      return { ...state, liveLocation: { lat: action.lat, lng: action.lng, accuracy: action.accuracy } };
    case 'TOGGLE_LOCATION_SHARING':
      return { ...state, locationSharing: !state.locationSharing };
    case 'STOP_LOCATION_SHARING':
      return { ...state, locationSharing: false, liveLocation: null };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
