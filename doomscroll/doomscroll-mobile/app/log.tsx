import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createLog, getLogs } from '../lib/api';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { todayLocalDateString } from '../lib/date';

// All possible platforms, other is general encompassing won't add new type of platform
const PLATFORMS = [
  'TikTok',
  'Instagram',
  'YouTube',
  'X',
  'Reddit',
  'Snapchat',
  'Other',
];

export default function LogScreen() {
  // Navigation to URL /log will give a session ID
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  // For saving a log
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayLoggedMinutes, setTodayLoggedMinutes] = useState(0);

  // On screen focus, fetch and recalculate today's logged minutes
  useFocusEffect( 
    // Recreate function only if session ID changes for efficiency
    useCallback(() => { // outer function sync for useFocusEffect 
      (async () => { // inner function async for await
        if (!sessionId) return;
        try {
          const logs = await getLogs(sessionId);
          const today = todayLocalDateString();
          // Filter to get all of today's logs by YYYY-MM-DD comparsion, sum from 0
          const total = logs.filter((log) => log.logged_date === today).reduce((sum, log) => sum + log.minutes_spent, 0);
          setTodayLoggedMinutes(total);
        } catch (e) {
          console.warn('Failed to load today\'s existing logs', e);
        }
      })();
    }, [sessionId]) 
  );

  // Validate log input of hours, minutes, then create a log
  const handleLog = async () => {
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
    if (totalMinutes <= 0 || totalMinutes > 1440) {
      setError('Please enter a duration greater than 0');
      return;
    }

    // Check this entry against what's already logged today, not just on its own
    const projectedDailyTotal = todayLoggedMinutes + totalMinutes;
    if (projectedDailyTotal > 1440) {
      const remaining = 1440 - todayLoggedMinutes;
      setError(
        remaining > 0
          ? `That would put today's total over 24h. You have ${remaining} min left today.`
          : "You've already logged 24h today."
      );
      return;
    }

    if (!sessionId) {
      setError('Missing session ID');
      return;
    }

    const logged_date = todayLocalDateString();

    setSaving(true);

    // Input validated, now try creating a log
    try {
      // Database wants ID as number
      await createLog({ guest_session_id: Number(sessionId), platform_name: platform, minutes_spent: totalMinutes, logged_date });
      
      // Pop-up with title, body text, button(s) if needed
      Alert.alert('Success', 'Log saved', [{ text: 'OK', onPress: () => router.replace('/dashboard') }]);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Usage</Text>

      {/* Platform Selector */}
      <Text style={styles.label}>Platform</Text>
      <View style={styles.pickerContainer}>
        {/* User picks from predetermined platforms*/} 
        <Picker selectedValue={platform} onValueChange={setPlatform} style={styles.picker}>
          {/* Create Picker components for each platform, key, visible value, passed value the same */}
          {PLATFORMS.map((p) => (
            <Picker.Item key={p} label={p} value={p} />
          ))}
        </Picker>
      </View>

      {/* Logging Time */}
      <Text style={styles.label}>Time spent</Text>
      <View style={styles.durationRow}>
        <TextInput style={styles.durationInput} keyboardType="numeric" value={hours} onChangeText={setHours} placeholder="0" maxLength={2}/>
        <Text style={styles.durationUnit}>h</Text>
        <TextInput style={styles.durationInput} keyboardType="numeric" value={mins} onChangeText={setMins} placeholder="0" maxLength={2}/>
        <Text style={styles.durationUnit}>min</Text>
      </View>

      {/* Display error if it exists */}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      {/* Spinner when saving*/}
      {saving && <ActivityIndicator style={{ marginTop: 16 }} />}

      {/* Save and Cancel Buttons, prevent double-tap creating multiple createLog requests */}
      <View style={styles.buttons}>
        <Button title="Save" onPress={handleLog} disabled={saving} />
        <Button title="Cancel" onPress={() => router.back()} color="#999"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 24 },
  label: { fontSize: 14, opacity: 0.8, marginTop: 12, marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden'},
  picker: { height: 50 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16, width: 64, textAlign: 'center' },
  durationUnit: { fontSize: 15, color: '#555' },
  error: { color: 'red', marginTop: 12 },
  buttons: { marginTop: 24, gap: 12 },
});