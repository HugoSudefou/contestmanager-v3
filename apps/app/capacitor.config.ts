import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.robotique92.contestmanager',
  appName: 'Contest Manager',
  webDir: 'www',
  // The API is usually reached over plain http on a local network during competitions.
  // errorPath: page shown instead of a blank screen when the tablet's WebView is too old.
  server: { androidScheme: 'http', cleartext: true, errorPath: 'webview-trop-ancienne.html' },
  // Old tablets: the app is compiled for Chrome / WebView 66+ (see .browserslistrc and build.mjs).
  android: { minWebViewVersion: 66 },
};

export default config;
