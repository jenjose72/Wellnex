import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Contact = {
  id: string;
  name: string;
  phone_number: string;
  relation: string;
};

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firstAidItems, setFirstAidItems] = useState<any[]>([]);
  const [isFirstAidLoading, setIsFirstAidLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchFirstAidItems();
    } else {
      setIsLoading(false);
      setIsFirstAidLoading(false);
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(2);
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFirstAidItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('first_aid_guide')
        .select('*')
        .order('title', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      
      // Parse steps which are stored as a string in the database
      const parsedData = data.map(item => ({
        ...item,
        steps: JSON.parse(item.steps)
      }));
      
      setFirstAidItems(parsedData || []);
    } catch (error) {
      console.error('Error fetching first aid items:', error);
    } finally {
      setIsFirstAidLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleSOS = () => {
    router.push('/emergency/sos');
  };

  const getRelationColor = (relation: string) => {
    switch(relation) {
      case 'emergency': return '#ff3b30';
      case 'hospital': return '#0084ff';
      case 'doctor': return '#34c759';
      default: return '#ff9500';
    }
  };

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
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0084ff" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol size={24} name="person.crop.circle.badge.plus" color="#c5d5e6" />
              <Text style={styles.emptyText}>No emergency contacts found</Text>
              <Link href="/emergency/contacts" asChild>
                <TouchableOpacity style={styles.addContactButton}>
                  <Text style={styles.addContactText}>Add Contacts</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={[styles.contactIndicator, { backgroundColor: getRelationColor(contact.relation) }]} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.phone_number}</Text>
                  <View style={[styles.contactBadge, { backgroundColor: `${getRelationColor(contact.relation)}15` }]}>
                    <Text style={[styles.contactBadgeText, { color: getRelationColor(contact.relation) }]}>
                      {contact.relation}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(contact.phone_number)}
                >
                  <IconSymbol size={20} name="phone.fill" color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )}
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
          
          {isFirstAidLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0084ff" />
              <Text style={styles.loadingText}>Loading first aid tips...</Text>
            </View>
          ) : firstAidItems.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CPR Instructions</Text>
              <Text style={styles.cardText}>1. Check for responsiveness and call for help</Text>
              <Text style={styles.cardText}>2. Place the person on their back</Text>
              <Text style={styles.cardText}>3. Start chest compressions (30x)</Text>
              <Text style={styles.cardText}>4. Give two rescue breaths</Text>
              <Text style={styles.cardText}>5. Continue CPR until help arrives</Text>
            </View>
          ) : (
            firstAidItems.map(item => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.steps.map((step: string, index: number) => (
                  <Text key={index} style={styles.cardText}>{index + 1}. {step}</Text>
                ))}
              </View>
            ))
          )}
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
  contactIndicator: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  contactBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  addContactButton: {
    backgroundColor: '#0084ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addContactText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});