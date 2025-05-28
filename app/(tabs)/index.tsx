import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type MedicationReminder = {
  id: string;
  medicine_name: string;
  dosage: string;
  time: string;
  repeat_pattern: string;
};

type EmergencyContact = {
  id: string;
  name: string;
  phone_number: string;
  relation: string;
};

type UserProfile = {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_group?: string;
  avatar_url?: string;
  created_at?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [upcomingMedications, setUpcomingMedications] = useState<MedicationReminder[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingMeds, setIsLoadingMeds] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Extract username from email (before the @)
  const username = user?.email ? user.email.split('@')[0] : '';

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUpcomingMedications();
      fetchEmergencyContacts();
    } else {
      setIsLoadingMeds(false);
      setIsLoadingContacts(false);
      setIsLoadingProfile(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Fixed table name from "profiles" to "users_profile"
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setUserProfile(data || {
        id: user.id,
        name: '',
        blood_group: '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchUpcomingMedications = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      setUpcomingMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setIsLoadingMeds(false);
    }
  };

  const fetchEmergencyContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
        .limit(2);
      
      if (error) throw error;
      
      setEmergencyContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSOS = () => {
    router.push('/emergency/sos');
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with compact SOS */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>
                Welcome{username ? `, ${username}` : ' to Wellnex'}
              </Text>
              <Text style={styles.headerSubtitle}>Your health companion</Text>
            </View>
            {/* Compact SOS Button */}
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
              <LinearGradient
                colors={['#ff3b30', '#ff5e3a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sosButtonInner}
              >
                <IconSymbol size={20} name="phone.fill" color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#0984e3', '#0097e6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileGradient}
          >
            {isLoadingProfile ? (
              <View style={styles.profileLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingProfileText}>Loading your profile...</Text>
              </View>
            ) : (
              <>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    {userProfile?.avatar_url ? (
                      <Image 
                        source={{ uri: userProfile.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {userProfile?.name?.charAt(0) || username?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {userProfile?.name || username || 'Your Profile'}
                    </Text>
                    <Text style={styles.profileDetails}>
                      {userProfile?.age ? `${userProfile.age} years` : ''}{' '}
                      {userProfile?.gender ? `• ${userProfile.gender}` : ''}
                    </Text>
                  </View>
                  <Link href="/profile/edit" asChild>
                    <TouchableOpacity style={styles.editButton}>
                      <IconSymbol size={18} name="pencil" color="#fff" />
                    </TouchableOpacity>
                  </Link>
                </View>
                
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Blood Group</Text>
                    <Text style={styles.statValue}>
                      {userProfile?.blood_group || 'Add'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Height</Text>
                    <Text style={styles.statValue}>
                      {userProfile?.height_cm ? `${userProfile.height_cm} cm` : 'Add'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>
                      {userProfile?.weight_kg ? `${userProfile.weight_kg} kg` : 'Add'}
                    </Text>
                  </View>
                </View>
                
                {(!userProfile?.blood_group || !userProfile?.height_cm || !userProfile?.weight_kg) && (
                  <Link href="/profile/edit" asChild>
                    <TouchableOpacity style={styles.completeProfileButton}>
                      <Text style={styles.completeProfileText}>Complete your medical profile</Text>
                      <IconSymbol size={16} name="chevron.right" color="#fff" />
                    </TouchableOpacity>
                  </Link>
                )}
              </>
            )}
          </LinearGradient>
        </View>

        {/* Upcoming Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <IconSymbol size={22} name="pills.fill" color="#0084ff" />
              <Text style={styles.sectionTitle}>Upcoming Medications</Text>
            </View>
            <Link href="/health/medications" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {isLoadingMeds ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0084ff" />
              <Text style={styles.loadingText}>Loading medications...</Text>
            </View>
          ) : upcomingMedications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol size={24} name="pills.fill" color="#c5d5e6" />
              <Text style={styles.emptyText}>No upcoming medications</Text>
              <Link href="/health/medications" asChild>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Medication</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            upcomingMedications.slice(0, 3).map((medication) => (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.medicationTimeContainer}>
                  <Text style={styles.medicationTime}>{formatTime(medication.time)}</Text>
                </View>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{medication.medicine_name}</Text>
                  <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                  <Text style={styles.medicationPattern}>{medication.repeat_pattern}</Text>
                </View>
                <TouchableOpacity style={styles.medicationTakenButton}>
                  <IconSymbol size={20} name="checkmark" color="#0084ff" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <IconSymbol size={22} name="sparkles" color="#0084ff" />
              <Text style={styles.sectionTitle}>Quick Access</Text>
            </View>
          </View>
          
          <View style={styles.quickAccessGrid}>
            {/* Mental Health Chatbot */}
            <Link href="/mental/chatbot" asChild>
              <TouchableOpacity style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIcon, { backgroundColor: '#e6f2ff' }]}>
                  <IconSymbol size={24} name="message.fill" color="#0084ff" />
                </View>
                <Text style={styles.quickAccessText}>Mental Health Assistant</Text>
              </TouchableOpacity>
            </Link>

            {/* Emergency Contacts */}
            <Link href="/emergency/contacts" asChild>
              <TouchableOpacity style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIcon, { backgroundColor: '#ffe6e6' }]}>
                  <IconSymbol size={24} name="person.crop.circle.fill" color="#ff3b30" />
                </View>
                <Text style={styles.quickAccessText}>Emergency Contacts</Text>
              </TouchableOpacity>
            </Link>

            {/* Nearby Clinics */}
            <Link href="/emergency/nearby" asChild>
              <TouchableOpacity style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIcon, { backgroundColor: '#e6ffed' }]}>
                  <IconSymbol size={24} name="map.fill" color="#34c759" />
                </View>
                <Text style={styles.quickAccessText}>Nearby Clinics</Text>
              </TouchableOpacity>
            </Link>

            {/* Mood Journal */}
            <Link href="/mental/journal" asChild>
              <TouchableOpacity style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIcon, { backgroundColor: '#fff0e6' }]}>
                  <IconSymbol size={24} name="book.fill" color="#ff9500" />
                </View>
                <Text style={styles.quickAccessText}>Mood Journal</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Emergency Contacts Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <IconSymbol size={22} name="person.crop.circle.badge.plus" color="#0084ff" />
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            </View>
            <Link href="/emergency/contacts" asChild>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {isLoadingContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0084ff" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : emergencyContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol size={24} name="person.crop.circle.badge.plus" color="#c5d5e6" />
              <Text style={styles.emptyText}>No emergency contacts</Text>
              <Link href="/emergency/contacts" asChild>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Contact</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            emergencyContacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone_number}</Text>
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                </View>
                <TouchableOpacity style={styles.contactCallButton}>
                  <IconSymbol size={20} name="phone.fill" color="#fff" />
                </TouchableOpacity>
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
    backgroundColor: '#f5f9fc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  headerContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  sosButton: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sosButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  profileCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: {
    padding: 20,
    borderRadius: 16,
  },
  profileLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  loadingProfileText: {
    color: '#fff',
    marginTop: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completeProfileText: {
    color: '#fff',
    fontWeight: '500',
    marginRight: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0084ff',
    fontWeight: '500',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#0084ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  medicationTimeContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0084ff',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicationPattern: {
    fontSize: 12,
    color: '#999',
  },
  medicationTakenButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7eaff',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickAccessIcon: {
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0084ff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactRelation: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  contactCallButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#0084ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
});