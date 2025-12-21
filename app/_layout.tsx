import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" /> {/* Splash Screen */}
        <Stack.Screen name="(auth)" /> {/* Auth Screens */}
        <Stack.Screen name="location" /> {/* Location Screen */}
        <Stack.Screen name="(tabs)" /> {/* Main Tabs */}
        <Stack.Screen name="news/[id]" /> {/* News Detail Screen */}
        {/* Add other screens as needed */}
      </Stack>
    </SafeAreaProvider>
  );
}