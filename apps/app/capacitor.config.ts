import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.robotique92.contestmanager',
  appName: 'Contest Manager',
  webDir: 'www',
  // The API is usually reached over plain http on a local network during competitions.
  server: { androidScheme: 'http', cleartext: true },
};

export default config;
