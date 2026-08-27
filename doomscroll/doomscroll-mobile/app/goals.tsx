import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoal, saveGoal } from '../lib/api';
import { formatDuration } from '../lib/format';

export default function Goals() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [currentLimit, setCurrentLimit] = useState<number | null>(null);
  // For loading session ID
  const [loading, setLoading] = useState(true);
  // For saving goal limit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On screen focus, fetch session ID and goal, calculate goal hours and minutes 
  useFocusEffect(
    useCallback(() => { // outer function sync for useFocusEffect 
      (async () => { // inner function async for await
        const id = await AsyncStorage.getItem('session_id');
        setSessionId(id);
        if (id) {
          try {
            const goal = await getGoal(id);
            if (goal) {
              setCurrentLimit(goal.daily_limit_minutes);
              setHours(String(Math.floor(goal.daily_limit_minutes / 60)));
              setMins(String(goal.daily_limit_minutes % 60));
            }
          } catch (e) {
            console.warn('Failed to load goal', e);
          }
        }
        setLoading(false);
      })();
    }, []) // No need to rebuild, no props change
  );

  // Validate goal input of hours, minutes, then create/update goal.
  // Every failure path sets `error`, which is rendered inline below. Alert is a
  // no-op stub on react-native-web, so pop-ups made these rejections invisible.
  const handleSave = async () => {
    // Clear previous errors
    setError(null);

    // Convert string into numbers, blank = 0
    const h = hours === '' ? 0 : Number(hours);
    const m = mins === '' ? 0 : Number(mins);
    // Catch invalid, negative, realistically impossible inputs
    if (Number.isNaN(h) || Number.isNaN(m)) {
      setError('Please enter valid numbers');
      return;
    }
    if (h < 0 || h > 24) {
      setError('Hours must be between 0 and 24');
      return;
    }
    if (m < 0 || m > 59) {
      setError('Minutes must be between 0 and 59');
      return;
    }

    // Recalculate as minutes as we store any log as minutes in backend, not hours + minutes
    const totalMinutes = h * 60 + m;
    if (totalMinutes > 1440) {
      setError('Daily goal cannot exceed 24 hours');
      return;
    }

    if (!sessionId) {
      setError('Missing session ID');
      return;
    }

    setSaving(true);

    // Input validated, try to create/update goal
    try {
      // Database wants ID as number
      const goal = await saveGoal({ guest_session_id: Number(sessionId), daily_limit_minutes: totalMinutes });
      setCurrentLimit(goal.daily_limit_minutes);
      // Back to the dashboard, where the goal shows up as the progress bar and the
      // dashed line on the chart, which is the confirmation that it saved
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/dashboard');
      }
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.message || 'Could not save your goal. Try again.';
      setError(message);
      // Only re-enable the button on failure; on success we have navigated away
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Goal Limit Setter */}
      <Text style={styles.title}>Set daily goal</Text>
      <Text style={styles.subtitle}>
        Total time across all platforms you want to stay under each day.
      </Text>
      
      {currentLimit !== null && (
        <Text style={styles.current}>Current goal: {formatDuration(currentLimit)}/day</Text>
      )}

      <View style={styles.durationRow}>
        <TextInput style={styles.durationInput} keyboardType="number-pad" value={hours} onChangeText={setHours} placeholder="0" maxLength={2}/>
        <Text style={styles.durationUnit}>h</Text>
        <TextInput style={styles.durationInput} keyboardType="number-pad" value={mins} onChangeText={setMins} placeholder="0" maxLength={2}/>
        <Text style={styles.durationUnit}>min</Text>
      </View>

      {/* Display error if it exists */}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {/* Save and Cancel Buttons, prevent double-tap creating multiple createLog requests */}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save goal'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#555', marginBottom: 8 },
  current: { color: '#2563eb', fontWeight: '600', marginBottom: 8 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16, width: 64, textAlign: 'center' },
  durationUnit: { fontSize: 15, color: '#555'},
  error: { color: 'red', marginTop: 4 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { borderWidth: 1, borderColor: '#999', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#999', fontWeight: '600' },
});
