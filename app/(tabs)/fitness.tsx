import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useNavigation } from '@react-navigation/native';

export default function FitnessScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Fitness</Text>
        </View>

        {/* BMI Calculator Section */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BMICalculator')}
        >
          <Text style={styles.cardTitle}>BMI Calculator</Text>
          <Text style={styles.cardDescription}>
            Calculate your Body Mass Index and track your health.
          </Text>
        </TouchableOpacity>

        {/* Chatbot Redirect Section */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FitnessChatbot')}
        >
          <Text style={styles.cardTitle}>Ask Fitness Bot</Text>
          <Text style={styles.cardDescription}>
            Get workout tips, routines, and healthy habits with our AI chatbot.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  headerContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
