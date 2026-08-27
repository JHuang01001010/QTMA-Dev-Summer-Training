import { Platform } from 'react-native';
import { Stack } from 'expo-router';

// Suppress console errors from testing on web
// react-native-chart-kit, react-native-svg, try to make the chart interactable but web doesn't understand react native's touch interaction system
if (Platform.OS === 'web') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // React logs a format string and its substitutions as separate arguments, e.g.
    // ("Invalid DOM property `%s`. Did you mean `%s`?", "transform-origin", "transformOrigin").
    // Checking args[0] alone never matches, so join everything before testing.
    const message = args.map((arg) => String(arg)).join(' ');
    if (
      message.includes('Unknown event handler property') ||
      message.includes('transform-origin')
    ) {
      return;
    }
    originalError(...args);
  };
}

// Default stack navigator
export default function RootLayout() {
  return (
    // Screens that don't set their own background inherit this, keeping every
    // screen white instead of the navigator's default grey
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
      {/* Without explicit titles the header falls back to the route filename ("index", "log") */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="log" options={{ title: 'Log Usage' }} />
      <Stack.Screen name="goals" options={{ title: 'Set Daily Goal' }} />
    </Stack>
  );
}
