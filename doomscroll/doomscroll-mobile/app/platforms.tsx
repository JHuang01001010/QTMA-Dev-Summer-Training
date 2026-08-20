import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { savePlatforms } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVAILABLE_PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X', 'Reddit', 'Snapchat', 'Other'];

// Onboarding platforms screen
export default function PlatformsScreen() {
  const router = useRouter();
  // Track user selected platforms 
  const [selected, setSelected] = useState<string[]>([]);
  
  // If not selected, select, and vice versa 
  const toggle = (platform: string) => {
    setSelected((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Save platforms locally and move user to dashboard
  const handleContinue = async () => {
    await savePlatforms(selected);
    router.push('/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you want to track?</Text>
      <Text style={styles.subtitle}>Select one or more platforms. You can add more later.</Text>

      {/* Grid of platforms */}
      <ScrollView contentContainerStyle={styles.grid}>
        {/* Create grid of platforms, one per preset platforms*/}
        {AVAILABLE_PLATFORMS.map((platform) => {
          {/* Check if chip in selected array*/}
          const isSelected = selected.includes(platform);
          return (
            <TouchableOpacity
              // Each platform has a key, itself
              key={platform}
              // Style depending if chip selected
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(platform)}
            >
              {/* Style text based on if selected*/}
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{platform}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Done button*/}
      <TouchableOpacity
        // User can only continue if selected at least one platform
        style={[styles.button, selected.length === 0 && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={selected.length === 0}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333', fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});