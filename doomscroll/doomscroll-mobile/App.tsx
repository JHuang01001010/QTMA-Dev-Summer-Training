import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function App() {
  return (
    // Full screen white background
    <View style={styles.container}>
      <Slot /> {/* Router output */}
      <StatusBar style="auto" /> {/* Light/Dark depends on system theme */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Entire screen white
});