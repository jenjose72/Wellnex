import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore adapter for Supabase auth persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://uifjlwhkxdrredqrspxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmpsd2hreGRycmVkcXJzcHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjMwNjcsImV4cCI6MjA2MzgzOTA2N30.YuxGbhsKEzPW9g7M7xmWAE5UiSHv4hZpKTIudHOG28s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Disable realtime to avoid WebSocket issues
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
});