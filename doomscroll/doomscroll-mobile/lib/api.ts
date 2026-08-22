import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// True - running in android emulator, manually flip if not testing android
const ANDROID = true;
const BASE_URL = ANDROID
  ? 'http://10.0.2.2:3000/api' // Android emulator then host machine
  : 'http://localhost:3000/api'; // browser on same machine

// Defining defaults for requests, reduces writing full URLs
export const api = axios.create({
  // All requests from /api will have BASE_URL prefix, BASE_URL + "/goals" = http://10.0.2.2:3000/api/goals for example
  baseURL: BASE_URL,
  // Tells backend request body will always be JSON
  headers: {
    'Content-Type': 'application/json',
  },
});

// POST request to insert new guest session row
export async function createGuestSession() {
  // No request body as session created server-side
  const res = await api.post('/guest-sessions');
  // Type assertion of shape for compile-time typos, not actual check
  return res.data as { guest_token: string; session_id: number };
}

// Tell TS each log should be in this format/shape
export type UsageLog = {
  id: number;
  platform_name: string;
  minutes_spent: number;
  logged_date: string;
  created_at: string;
};

// POST request /api/logs
export async function createLog(payload: 
  // Session ID as number (from API call) or string (from AsyncStorage)
  {guest_session_id: number | string; platform_name: string; minutes_spent: number; logged_date: string;}
  ) {
  // Send payload as request body of POST request
  const res = await api.post('/logs', payload);
  // Type assertion 
  return res.data as UsageLog;
}

// GET request /api/logs
export async function getLogs(guest_session_id: number | string) {
  // Get logs based on session ID
  const res = await api.get('/logs', {
    params: { guest_session_id },
  });
  // Type assertion as array, possible multiple usage logs for one user
  return res.data as UsageLog[];
}

// Tell TS each goal should be in this shape
export type Goal = {
  id: number;
  guest_session_id: number;
  daily_limit_minutes: number;
  created_at: string;
  updated_at: string;
};

// GET request /api/goals, will get Goal if set or null if not set
export async function getGoal(guest_session_id: number | string): Promise<Goal | null> {
  // Get goals based on session ID
  const res = await api.get('/goals', {
    params: { guest_session_id },
  });
  // Null happens if no goal is set
  return res.data as Goal | null;
}

// POST request /api/goals
export async function saveGoal(payload: {guest_session_id: number | string; daily_limit_minutes: number;}) {
  // Send payload as request body of POST request
  const res = await api.post('/goals', payload);
  // Type assertion
  return res.data as Goal;
}