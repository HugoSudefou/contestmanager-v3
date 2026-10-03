export const environment = {
  production: true,
  // Web / PWA: served behind the same nginx as the API (see apps/app/nginx.conf).
  apiUrl: '/api',
  // APK: address of the deployed server. Can also be changed in the app settings.
  nativeApiUrl: 'https://contest.example.fr/api',
};
