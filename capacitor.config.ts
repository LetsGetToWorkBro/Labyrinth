import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vision.labyrinth.app',
  appName: 'Labyrinth BJJ',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0A0A0A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A0A0A',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    // @capacitor/preferences — used to store Supabase refresh_token for biometric login.
    // Data stored here is encrypted by the OS (iOS Keychain / Android EncryptedSharedPreferences).
    // Never use localStorage for auth tokens in a Capacitor app.
    Preferences: {
      group: 'LabyrinthAuth',
    },
    // capacitor-native-biometric — Face ID / fingerprint
    // iOS: NSFaceIDUsageDescription must be set in Info.plist.
    // Android: biometric permission declared in AndroidManifest.
    NativeBiometric: {
      // No special config needed; prompts are configured per-call in biometric-auth.ts
    },
  },
};

export default config;
