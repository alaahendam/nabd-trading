declare namespace NodeJS {
  /** The settings Expo inlines into the bundle. Add each `EXPO_PUBLIC_*` variable the app reads here. */
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}
