import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// True- running in android emulator
const ANDROID = true;
const BASE_URL = ANDROID
  ? 'http://10.0.2.2:3000/api' // Android emulator → host machine
  : 'http://localhost:3000/api'; // browser on same machine

// Defining defaults for requests
export const api = axios.create({
  // All requests from /api will have BASE_URL prefix
  baseURL: BASE_URL,
  // Requests will always be JSON
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createGuestSession() {
  // POST request to insert new guest session row
  const res = await api.post('/guest-sessions');
  // Expect guest token and session ID
  return res.data as { guest_token: string; session_id: number };
}

export async function savePlatforms(platforms: string[]) {
  // Store locally selected platforms as string
  await AsyncStorage.setItem('tracked_platforms', JSON.stringify(platforms));
}

export async function getSavedPlatforms(): Promise<string[]> {
  // Always will get one string or null since AsyncStorage only stores strings
  const raw = await AsyncStorage.getItem('tracked_platforms');
  // Default to empty array if data is null
  return raw ? JSON.parse(raw) : [];
}

// Each log will be in this format
export type UsageLog = {
  id: number;
  platform_name: string;
  minutes_spent: number;
  logged_date: string;
  created_at: string;
};

// session ID as number (from API call) or string (form AsyncStorage)
export async function createLog(payload: {
  guest_session_id: number | string;
  platform_name: string;
  minutes_spent: number;
  logged_date: string;
}) {
  // POST request with all the fields above
  const res = await api.post('/logs', payload);
  // Type assertion - treat data as if in this format
  return res.data as {
    id: number;
    guest_session_id: number;
    platform_name: string;
    minutes_spent: number;
    logged_date: string;
  };
}

export async function getLogs(guest_session_id: number | string) {
  // Get log based on session ID
  const res = await api.get('/logs', {
    params: { guest_session_id },
  });
  // Type assertion - treat data as if in this format
  return res.data as UsageLog[];
}