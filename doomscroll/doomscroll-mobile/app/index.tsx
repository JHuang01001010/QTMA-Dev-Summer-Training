import { useState } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGuestSession } from '../lib/api';

// First screen a user sees
export default function Onboarding() {
  const router = useRouter();
  // Track if session creation request still ongoing
  const [loading, setLoading] = useState(false);
  // Hold error message if any
  const [error, setError] = useState<string | null>(null);

  // When session creation happens
  const handleGetStarted = async () => {
    // Start loading without error
    setLoading(true);
    setError(null);

    try {
      const data = await createGuestSession();
      // Store session and guest token locally
      await AsyncStorage.setItem('session_id', String(data.session_id));
      await AsyncStorage.setItem('guest_token', data.guest_token);
      // Move user to onboarding platforms once session saved
      router.push('/platforms');
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

      {/* Start creating session and disable button*/}
      <Button title="Get Started" onPress={handleGetStarted} disabled={loading} />
      {/* Spinner when loading*/}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 16 }, 
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
  error: { color: 'red', marginTop: 12 },
});