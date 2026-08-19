import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { createGuestSession } from '../lib/api';

export default function Index() {
  // Hold session data with guest token and session ID
  const [sessionInfo, setSessionInfo] = useState<{ guest_token: string; session_id: number } | null>(null);
  // Tracking request progress, default none in progress
  const [loading, setLoading] = useState(false);
  // Holds error message from API call
  const [error, setError] = useState<string | null>(null);

  // Create guest session
  const handleCreateSession = async () => {
    // Loading request, no errors yet
    setLoading(true);
    setError(null);

    try {
      // Call backend API to create guest session
      const data = await createGuestSession();
      setSessionInfo(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return ( // UI 
    <View style={styles.container}>
      {/* App title*/}
      <Text style={styles.title}>Doomscroll Tracker</Text>

      {/* Button on press creates session, disabled when request happening*/}
      <Button title="Create Guest Session" onPress={handleCreateSession} disabled={loading} />

      {/* Show spinner when request still loading*/}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      {/* Show erorr if there is one*/}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {/* Show session data once created*/}
      {sessionInfo && (
        <View style={styles.info}>
          <Text style={styles.label}>Session ID:</Text>
          <Text style={styles.value}>{sessionInfo.session_id}</Text>

          <Text style={styles.label}>Guest Token:</Text>
          <Text style={styles.value}>{sessionInfo.guest_token}</Text>
        </View>
      )}
    </View>
  );
}

// Styles for UI
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 24 },
  info: { marginTop: 24, alignItems: 'flex-start', width: '100%' },
  label: { fontSize: 14, opacity: 0.8, marginTop: 8 },
  value: { fontSize: 16, fontWeight: '500' },
  error: { color: 'red', marginTop: 12 },
});