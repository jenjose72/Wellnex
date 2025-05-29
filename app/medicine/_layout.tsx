import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function MedicineLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{
          headerShown: false,
          headerTitle: "",
          contentStyle: { backgroundColor: '#ffffff' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="medicineConflicts" 
          options={{ 
            headerShown: false,
            presentation: 'card'
          }} 
        />
        <Stack.Screen 
          name="medicineSideEffects" 
          options={{ 
            headerShown: false,
            presentation: 'card'
          }} 
        />
      </Stack>
    </>
  );
}