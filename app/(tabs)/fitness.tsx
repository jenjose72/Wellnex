import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function FitnessScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Fitness</Text>
          <Text style={styles.headerSubtitle}>Track your physical activities</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <IconSymbol size={24} name="figure.walk" color="#007bff" />
            <Text style={styles.summaryValue}>7,243</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>

          <View style={styles.summaryCard}>
            <IconSymbol size={24} name="flame.fill" color="#dc3545" />
            <Text style={styles.summaryValue}>320</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>

          <View style={styles.summaryCard}>
            <IconSymbol size={24} name="arrow.up.right.circle.fill" color="#28a745" />
            <Text style={styles.summaryValue}>32</Text>
            <Text style={styles.summaryLabel}>Minutes</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startWorkoutButton}>
          <IconSymbol size={20} name="play.fill" color="#fff" />
          <Text style={styles.startWorkoutText}>Start Workout</Text>
        </TouchableOpacity>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          
          <View style={styles.activityCard}>
            <IconSymbol size={24} name="figure.run" color="#333" />
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>Morning Run</Text>
              <Text style={styles.activityStats}>5.2 km • 32 min • 320 cal</Text>
            </View>
            <Text style={styles.activityTime}>8:30 AM</Text>
          </View>
          
          <View style={styles.activityCard}>
            <IconSymbol size={24} name="figure.walk" color="#333" />
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>Evening Walk</Text>
              <Text style={styles.activityStats}>2.5 km • 30 min • 150 cal</Text>
            </View>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Weekly Goal</Text>
          <View style={styles.card}>
            <View style={styles.goalProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '65%' }]} />
              </View>
              <Text style={styles.goalText}>65% Complete</Text>
            </View>
          </View>
        </View>
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
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  startWorkoutButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  startWorkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityDetails: {
    flex: 1,
    marginLeft: 16,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#999',
  },
  goalProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  goalText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '600',
  },
});