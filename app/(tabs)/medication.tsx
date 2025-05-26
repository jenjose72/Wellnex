import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MedicationScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Medication</Text>
          <Text style={styles.headerSubtitle}>Track and manage your medications</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity style={styles.addButton}>
              <IconSymbol size={20} name="plus" color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.medicationCard}>
            <View style={styles.medicationTime}>
              <Text style={styles.timeText}>8:00 AM</Text>
            </View>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationName}>Vitamin D</Text>
              <Text style={styles.medicationDosage}>1000 IU • 1 Tablet</Text>
            </View>
            <TouchableOpacity style={styles.checkButton}>
              <IconSymbol size={20} name="checkmark" color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.medicationCard}>
            <View style={styles.medicationTime}>
              <Text style={styles.timeText}>1:00 PM</Text>
            </View>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationName}>Ibuprofen</Text>
              <Text style={styles.medicationDosage}>200mg • 2 Tablets</Text>
            </View>
            <TouchableOpacity style={[styles.checkButton, styles.checkButtonPending]}>
              <IconSymbol size={20} name="circle" color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Medication List</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>Your full medication list will appear here</Text>
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
  cardContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    padding: 20,
  },
  medicationCard: {
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
  medicationTime: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkButton: {
    backgroundColor: '#28a745',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonPending: {
    backgroundColor: '#6c757d',
  },
});