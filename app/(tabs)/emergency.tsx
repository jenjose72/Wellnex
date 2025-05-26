import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function EmergencyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Emergency Services</Text>
          <Text style={styles.headerSubtitle}>Quick access to emergency contacts</Text>
        </View>

        <TouchableOpacity style={styles.emergencyButton}>
          <IconSymbol size={24} name="phone.fill" color="#fff" />
          <Text style={styles.emergencyButtonText}>Call Emergency (911)</Text>
        </TouchableOpacity>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Local Hospital</Text>
              <Text style={styles.contactNumber}>123-456-7890</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <IconSymbol size={20} name="phone.fill" color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Primary Doctor</Text>
              <Text style={styles.contactNumber}>098-765-4321</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <IconSymbol size={20} name="phone.fill" color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>First Aid Tips</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CPR Instructions</Text>
            <Text style={styles.cardText}>Basic steps for CPR will appear here...</Text>
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
  emergencyButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  contactCard: {
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});