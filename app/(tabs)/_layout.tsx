import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, initialized } = useAuth();
  const router = useRouter();

  // Check authentication status and redirect if not authenticated
  useEffect(() => {
    if (initialized && !user) {
      router.replace('/auth/login');
    }
  }, [initialized, user, router]);

  // Show nothing while checking auth status
  if (!initialized || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="emergency" color={color} />,
        }}
      />
      <Tabs.Screen
        name="medication"
        options={{
          title: 'Medication',
          tabBarIcon: ({ color }) => <Fontisto size={26} name="pills" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="fitness-sharp" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mental"
        options={{
          title: 'Mental',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="brain" color={color} />,
        }}
      />
    </Tabs>
  );
}