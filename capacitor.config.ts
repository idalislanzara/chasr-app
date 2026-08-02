import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chasr.app',
  appName: 'Chasr',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // url: 'http://localhost:5173', // uncomment for live dev on device
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0d0d12',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#d946ef',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d0d12',
    },
    Geolocation: {
      // Default high-accuracy settings
    },
    Camera: {
      // Allow both photos and camera
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Allow mixed content (for avatar API over http)
    mixedContentMode: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Allow HTTP loads for avatar images
    infoPlist: {
      NSCameraUsageDescription: 'Chasr needs camera access to take profile photos',
      NSPhotoLibraryUsageDescription: 'Chasr needs photo library access to select profile photos',
      NSLocationWhenInUseUsageDescription: 'Chasr uses your location to show people nearby',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Chasr uses your location to show people nearby',
      NSLocationAlwaysUsageDescription: 'Chasr uses your location to show people nearby',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
};

export default config;
