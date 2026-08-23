import { Platform } from 'react-native';
import { Stack } from 'expo-router';

// Suppress console errors from testing on web 
// react-native-chart-kit, react-native-svg, try to make the chart interactable but web doesn't understand react native's touch interaction system 
if (Platform.OS === 'web') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Unknown event handler property') ||
        args[0].includes('transform-origin'))
    ) {
      return;
    }
    originalError(...args);
  };
}

// Default stack navigator
export default function RootLayout() {
  return <Stack />;
}