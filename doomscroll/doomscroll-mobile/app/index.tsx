import { useState } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGuestSession } from '../lib/api';

// Onboarding screen a user sees on app open
export default function Onboarding() {
  const router = useRouter();
  // Track if session creation request still ongoing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

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