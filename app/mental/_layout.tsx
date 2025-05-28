import { Stack } from 'expo-router';

export default function MentalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chatbot" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}