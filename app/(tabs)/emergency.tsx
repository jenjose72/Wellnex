import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmergencyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Emergency Services</Text>
          <Text style={styles.headerSubtitle}>Quick access to emergency assistance</Text>
        </View>

        <LinearGradient
          colors={['#ff3b30', '#ff5e3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sosButtonGradient}
        >
          <TouchableOpacity style={styles.sosButton}>
            <View style={styles.sosInner}>
              <IconSymbol size={32} name="phone.fill" color="#fff" />
              <Text style={styles.sosButtonText}>SOS</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.quickActionsContainer}>
          <Link href="/emergency/contacts" asChild>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <IconSymbol size={24} name="person.crop.circle.fill" color="#0084ff" />
              </View>
              <Text style={styles.quickActionText}>Emergency Contacts</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/emergency/first-aid" asChild>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <IconSymbol size={24} name="cross.case.fill" color="#0084ff" />
              </View>
              <Text style={styles.quickActionText}>First Aid Library</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/emergency/nearby" asChild>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <IconSymbol size={24} name="map.fill" color="#0084ff" />
              </View>
              <Text style={styles.quickActionText}>Nearby Clinics</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/emergency/sos" asChild>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <IconSymbol size={24} name="exclamationmark.shield.fill" color="#0084ff" />
              </View>
              <Text style={styles.quickActionText}>Emergency SOS</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Link href="/emergency/contacts" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>

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
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>First Aid Tips</Text>
            <Link href="/emergency/first-aid" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CPR Instructions</Text>
            <Text style={styles.cardText}>1. Check for responsiveness and call for help</Text>
            <Text style={styles.cardText}>2. Place the person on their back</Text>
            <Text style={styles.cardText}>3. Start chest compressions (30x)</Text>
            <Text style={styles.cardText}>4. Give two rescue breaths</Text>
            <Text style={styles.cardText}>5. Continue CPR until help arrives</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  sosButtonGradient: {
    borderRadius: 40,
    height: 80,
    marginBottom: 24,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sosButton: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f0f8ff', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0084ff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  cardText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#0084ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});