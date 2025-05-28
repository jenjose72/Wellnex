import { Stack } from 'expo-router';

export default function EmergencyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="contacts" />
      <Stack.Screen name="first-aid" />
      <Stack.Screen name="sos" />
      <Stack.Screen name="nearby" />
    </Stack>
  );
}