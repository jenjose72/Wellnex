import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function FitnessLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
          presentation: 'transparentModal',
        }}
      >
        <Stack.Screen 
          name="chatbot" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});