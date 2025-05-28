import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function FitnessIndex() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Fitness Hub</Text>
      <Link href="/fitness/chatbot" asChild>
        <Text style={{ color: 'blue', fontSize: 18 }}>Open Fitness Assistant</Text>
      </Link>
    </View>
  );
}