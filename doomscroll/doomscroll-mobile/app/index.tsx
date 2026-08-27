import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGuestSession } from '../lib/api';

// Onboarding screen, shown only on first launch
export default function Onboarding() {
  const router = useRouter();
  // Track if session creation request still ongoing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Until we know whether a session already exists we render only a spinner.
  // Drawing onboarding first would flash it at returning users before we redirect.
  const [checkingSession, setCheckingSession] = useState(true);

  // On mount, look for a session saved by a previous launch
  useEffect(() => {
    (async () => {
      try {
        const existingSessionId = await AsyncStorage.getItem('session_id');
        if (existingSessionId) {
          // Returning user: onboarding is first-launch only, so skip straight to the
          // dashboard. replace() rather than push() so going back can't return here
          // and create a second session that orphans the first one's logs.
          router.replace('/dashboard');
          return;
        }
      } catch (e) {
        // If storage is unreadable, fall through and let the user start a new session
        console.warn('Failed to read stored session', e);
      }
      setCheckingSession(false);
    })();
  }, []);

  // Create guest session
  const handleGetStarted = async () => {
    // Start loading, clear previous errors
    setLoading(true);
    setError(null);

    try {
      const data = await createGuestSession();
      // Store session and guest token locally so user doesn't see this onboarding again
      await AsyncStorage.setItem('session_id', String(data.session_id));
      await AsyncStorage.setItem('guest_token', data.guest_token);
      // replace() so onboarding is dropped from history once a session exists
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to create session');
      setLoading(false);
    }
  };

  // Still deciding whether this is a first launch
  if (checkingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Doomscroll Tracker
      </Text>
      <Text style={styles.subtitle}>
        Track how much time you spend on TikTok, Instagram, YouTube, and more.
      </Text>

      {/* Create Session Button */}
      <Button title="Get Started" onPress={handleGetStarted} disabled={loading} />

      {/* Display error if it exists */}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {/* Spinner when loading */}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 16 }, 
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
  error: { color: 'red', marginTop: 12 },
});
