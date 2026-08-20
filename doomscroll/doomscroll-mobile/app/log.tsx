import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createLog } from '../lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  // Default platform selector to platforms[0]
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  // Default blank minutes string for passing to TextInput
  const [minutes, setMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLog = async () => {
    setError(null);

    // Check if minutes is valid
    const mins = Number(minutes);
    if (!mins || mins <= 0 || mins > 1440){
      setError('Please enter a valid number of minutes');
      return;
    }

    // Check if missing session ID
    if (!sessionId) {
      setError('Missing session ID');
      return;
    }

    // Get todays date
    const today = new Date();
    const yyyy = today.getFullYear();
    // 0-indexed month, pad if single digit
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const logged_date = `${yyyy}-${mm}-${dd}`;

    setLoading(true);

    try {
      await createLog({
        // Convert back to number to store in DB, expects number
        guest_session_id: Number(sessionId),
        platform_name: platform,
        minutes_spent: mins,
        logged_date,
      });

      // Tell user log is saved, redirect to dashboard
      Alert.alert('Success', 'Log saved', [
        {
          text: 'OK',
          onPress: () => router.replace('/dashboard'),
        },
      ]);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Usage</Text>

      <Text style={styles.label}>Platform</Text>
      <View style={styles.pickerContainer}>
        {/* Dropdown of platforms*/}
        <Picker
          selectedValue={platform}
          onValueChange={setPlatform}
          style={styles.picker}
        >
          {PLATFORMS.map((p) => (
            <Picker.Item key={p} label={p} value={p} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Minutes spent</Text>
      <TextInput
        style={styles.input}
        // On-screen keyboard restricted to numeric one
        keyboardType="numeric"
        value={minutes}
        onChangeText={setMinutes}
        // Light coloured text as hint
        placeholder="E.g. 30"
      />

      {error && <Text style={styles.error}>Error: {error}</Text>}

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      <View style={styles.buttons}>
        <Button title="Save" onPress={handleLog} disabled={loading} />
        <Button
          title="Cancel"
          onPress={() => router.back()}
          color="#999"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 24 },
  label: { fontSize: 14, opacity: 0.8, marginTop: 12, marginBottom: 4 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
  },
  error: { color: 'red', marginTop: 12 },
  buttons: { marginTop: 24, gap: 12 },
});