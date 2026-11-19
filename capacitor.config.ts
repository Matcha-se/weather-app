import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weatherapp.app',
  appName: 'weather-app',
  webDir: 'www',
  // The app calls the local REST API over http://<laptop-ip>:3000.
  // Capacitor defaults to https://localhost on Android, which would block
  // that request as mixed content.
  server: {
    androidScheme: 'http',
  },
};

export default config;
