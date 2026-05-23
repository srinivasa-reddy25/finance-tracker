export const env = {
  api_url: (process.env.EXPO_PUBLIC_API_URL ??
    'http://localhost:8000') as string,
  firebase: {
    api_key: process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string,
    auth_domain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
    project_id: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string,
    app_id: process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string
  }
}
