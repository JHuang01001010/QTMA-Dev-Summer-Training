import axios from 'axios';

// True- running in android emulator
const ANDROID = true;
const BASE_URL = ANDROID
  ? 'http://10.0.2.2:3000/api' // Android emulator → host machine
  : 'http://localhost:3000/api'; // browser on same machine

// Defining defaults for requests
export const api = axios.create({
  // All requests from /api will have this URL prefix
  baseURL: BASE_URL,
  // Default headers with request 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create new guest session
export async function createGuestSession() {
  // POST request to insert new guest session row
  const res = await api.post('/guest-sessions');
  // Expect guest token and session ID
  return res.data as { guest_token: string; session_id: number };
}