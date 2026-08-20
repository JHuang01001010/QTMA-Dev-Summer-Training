import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLogs} from '../lib/api';
import type { UsageLog } from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
  // session ID as type string or null, inital null
  const [sessionId, setSessionId] = useState<string | null>(null);
  // logs as type UsageLog, inital null
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh every navigation back to dashboard
  useFocusEffect(
    // Memorize function across renders (the set functions) to prevent re-execution each render
    useCallback(() => {
      (async () => {
        // GET request for session ID
        const id = await AsyncStorage.getItem('session_id');
        setSessionId(id);
        if (id) {
          try {
            // GET request for logs
            const data = await getLogs(id);
            setLogs(data);
          } catch (e) {
            console.warn('Failed to load logs', e);
          }
        }
        setLoading(false);
      })() // Run the async function;
    }, []) // Dependency array stays same, don't re-execute
  );

  // Spinner if loading
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Session: {sessionId}</Text>
      <Text>Logged entries: {logs.length}</Text>

      {/* Log creation button*/}
      <TouchableOpacity
        style={styles.button}
        // On press redirect to /log with session ID
        onPress={() => router.push({ pathname: '/log', params: { sessionId } })}
      >
        <Text style={styles.buttonText}>Log usage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600' },
});