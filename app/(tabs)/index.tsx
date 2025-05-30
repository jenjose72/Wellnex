import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Entypo, FontAwesome, FontAwesome5, Foundation, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { addDays, addMonths, isBefore, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MedicationReminder = {
  id: string;
  medicine_name: string;
  dosage: string;
  time: string;
  time_numeric?: string;
  next_scheduled?: string;
  repeat_pattern: string;
  notes?: string;
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
  const { user, signOut } = useAuth();
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

  // Call functionality
  const handleCall = (phoneNumber: string, contactName: string) => {
    Alert.alert(
      'Make Phone Call',
      `Call ${contactName} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
      ]
    );
  };

  const handleSOS = () => {
    router.push('/emergency/sos');
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getRepeatPatternIcon = (pattern) => {
    switch(pattern) {
      case 'Daily':
        return <MaterialCommunityIcons name="calendar-refresh" size={16} color="#1a73e8" />;
      case 'Weekly':
        return <MaterialCommunityIcons name="calendar-week" size={16} color="#1a73e8" />;
      case 'Monthly':
        return <MaterialCommunityIcons name="calendar-month" size={16} color="#1a73e8" />;
      case 'As needed':
        return <Ionicons name="timer-outline" size={16} color="#1a73e8" />;
      default:
        return null;
    }
  };

  const markMedicationAsTaken = async (med: MedicationReminder) => {
    try {
      let nextScheduled = null;
      
      if (med.repeat_pattern && med.repeat_pattern !== 'As needed') {
        try {
          const now = new Date();
          let hours = 8;
          let minutes = 0;
          
          if (med.time_numeric) {
            const timeParts = med.time_numeric.split(':');
            if (timeParts.length === 2) {
              hours = parseInt(timeParts[0], 10);
              minutes = parseInt(timeParts[1], 10);
            }
          } else if (med.time) {
            const formattedTime = formatTimeFor24Hour(med.time);
            if (formattedTime) {
              const timeParts = formattedTime.split(':');
              if (timeParts.length === 2) {
                hours = parseInt(timeParts[0], 10);
                minutes = parseInt(timeParts[1], 10);
              }
            }
          }
          
          if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
            throw new Error(`Invalid time components: hours=${hours}, minutes=${minutes}`);
          }
          
          nextScheduled = new Date();
          nextScheduled.setHours(hours, minutes, 0, 0);
          
          switch (med.repeat_pattern) {
            case 'Daily':
              if (isBefore(nextScheduled, now)) {
                nextScheduled = addDays(nextScheduled, 1);
              }
              break;
            case 'Weekly':
              nextScheduled = addDays(nextScheduled, 7);
              break;
            case 'Monthly':
              nextScheduled = addMonths(nextScheduled, 1);
              break;
          }
        } catch (timeError) {
          console.error('Error processing medication time:', timeError);
          nextScheduled = addDays(new Date(), 1);
          nextScheduled.setHours(8, 0, 0, 0);
        }
      }
      
      const { error } = await supabase
        .from('medication_reminders')
        .update({ 
          next_scheduled: nextScheduled ? nextScheduled.toISOString() : null,
          last_taken: new Date().toISOString()
        })
        .eq('id', med.id);
      
      if (error) {
        console.error('Error updating medication:', error);
        Alert.alert('Error', 'Failed to update medication status');
      } else {
        fetchUpcomingMedications();
        Alert.alert('Success', `${med.medicine_name} marked as taken! Next dose scheduled.`);
      }
    } catch (e) {
      console.error('Error in markMedicationAsTaken:', e);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const formatTimeFor24Hour = (timeStr) => {
    if (!timeStr) return null;
    
    try {
      if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        const timeParts = timeStr.match(/(\d+):(\d+)\s*(am|pm|AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const period = timeParts[3].toLowerCase();
          
          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (timeRegex.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      console.warn(`Could not parse time format: ${timeStr}, using default 08:00`);
      return "08:00";
    } catch (error) {
      console.error('Error formatting time:', error);
      return "08:00";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#e3f2fd', '#f8f9fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
        style={styles.backgroundGradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header with compact SOS */}
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.headerTitle}>
                Welcome{username ? ` ${username}` : ' to Wellnex'}
              </Text>
              <Text style={styles.headerSubtitle}>Your personal health companion</Text>
            </View>
            {/* Compact SOS Button */}
            <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
              <LinearGradient
                colors={['#ff3b30', '#ff5e3a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sosButtonInner}
              >
                <FontAwesome size={18} name="phone" color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#1a73e8', '#4285f4']}
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
                        <Foundation size={18} name="pencil" color="#fff" />
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
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    </Link>
                  )}
                </>
              )}
            </LinearGradient>
          </View>

          {/* Upcoming Medications */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Upcoming Medications</Text>
              <Link href="/medication" asChild>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {isLoadingMeds ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1a73e8" />
                <Text style={styles.loadingText}>Loading medications...</Text>
              </View>
            ) : upcomingMedications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome5 size={28} name="pills" color="#1a73e8" />
                <Text style={styles.emptyText}>No upcoming medications</Text>
                <Link href="/medication" asChild>
                  <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add Medication</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ) : (
              upcomingMedications.slice(0, 1).map((med) => {
                let nextDoseText = 'Not scheduled';
                let isOverdue = false;
                
                if (med.next_scheduled) {
                  try {
                    const nextDate = parseISO(med.next_scheduled);
                    const now = new Date();
                    isOverdue = isBefore(nextDate, now);
                    
                    const isToday = nextDate.getDate() === now.getDate() && 
                                    nextDate.getMonth() === now.getMonth() &&
                                    nextDate.getFullYear() === now.getFullYear();
                                    
                    if (isToday) {
                      nextDoseText = `Today at ${med.time}`;
                    } else {
                      const day = nextDate.getDate();
                      const month = nextDate.toLocaleString('default', { month: 'short' });
                      nextDoseText = `${day} ${month} at ${med.time}`;
                    }
                  } catch (parseError) {
                    console.error('Error parsing next scheduled date:', parseError);
                    nextDoseText = 'Schedule error';
                  }
                } else if (med.repeat_pattern === 'As needed') {
                  nextDoseText = 'Take as needed';
                }
                
                return (
                  <View key={med.id} style={styles.medicationCard}>
                    <View style={[
                      styles.medicationTime,
                      isOverdue ? styles.medicationTimeOverdue : null
                    ]}>
                      {isOverdue ? (
                        <Ionicons name="warning" size={18} color="#ff6b6b" />
                      ) : (
                        <Ionicons name="time" size={18} color="#1a73e8" />
                      )}
                      <Text style={[
                        styles.timeText, 
                        isOverdue ? styles.timeTextOverdue : null
                      ]}>
                        {nextDoseText}
                      </Text>
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.medicationName}>{med.medicine_name}</Text>
                      <Text style={styles.medicationDosage}>{med.dosage}</Text>
                      {med.repeat_pattern ? (
                        <View style={styles.repeatPatternRow}>
                          {getRepeatPatternIcon(med.repeat_pattern)}
                          <Text style={styles.repeatPatternText}>
                            {med.repeat_pattern}
                          </Text>
                        </View>
                      ) : null}
                      {med.notes ? (
                        <View style={styles.notesRow}>
                          <MaterialIcons name="notes" size={16} color="#adb5bd" />
                          <Text style={styles.notesText}>{med.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.actionButtons}>
                      <Link href="/medication" asChild>
                        <TouchableOpacity style={styles.actionButton}>
                          <MaterialIcons name="delete-outline" size={20} color="#1a73e8" />
                        </TouchableOpacity>
                      </Link>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.checkButton]}
                        onPress={() => {
                          Alert.alert(
                            "Mark as Taken",
                            `Mark "${med.medicine_name}" as taken?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              { 
                                text: "Confirm", 
                                onPress: () => markMedicationAsTaken(med)
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Quick Access */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
            </View>
            
            <View style={styles.quickAccessGrid}>
              {/* Mental Health Chatbot */}
              <Link href="/mental/chatbot" asChild>
                <TouchableOpacity style={styles.quickAccessCard}>
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#e3f2fd' }]}>
                    <Entypo size={24} name="chat" color="#1a73e8" />
                  </View>
                  <Text style={styles.quickAccessText}>Mental Health Assistant</Text>
                </TouchableOpacity>
              </Link>

              {/* Emergency Contacts */}
              <Link href="/emergency/contacts" asChild>
                <TouchableOpacity style={styles.quickAccessCard}>
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#ffebee' }]}>
                    <MaterialIcons size={24} name="contact-emergency" color="#f44336" />
                  </View>
                  <Text style={styles.quickAccessText}>Emergency Contacts</Text>
                </TouchableOpacity>
              </Link>

              {/* Nearby Clinics */}
              <Link href="/emergency/nearby" asChild>
                <TouchableOpacity style={styles.quickAccessCard}>
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#e8f5e8' }]}>
                    <FontAwesome5 size={24} name="hospital" color="#4caf50" />
                  </View>
                  <Text style={styles.quickAccessText}>Nearby Clinics</Text>
                </TouchableOpacity>
              </Link>

              {/* Mood Journal */}
              <Link href="/mental/journal" asChild>
                <TouchableOpacity style={styles.quickAccessCard}>
                  <View style={[styles.quickAccessIcon, { backgroundColor: '#fff3e0' }]}>
                    <Entypo size={24} name="open-book" color="#ff9800" />
                  </View>
                  <Text style={styles.quickAccessText}>Mood Journal</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Emergency Contacts Preview */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <Link href="/emergency/contacts" asChild>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {isLoadingContacts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1a73e8" />
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            ) : emergencyContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons size={28} name="contact-emergency" color="#1a73e8" />
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
                  <TouchableOpacity 
                    style={styles.contactCallButton}
                    onPress={() => handleCall(contact.phone_number, contact.name)}
                  >
                    <MaterialIcons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Sign Out Button */}
          <View style={styles.signOutContainer}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#5f6368',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  sosButton: {
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sosButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
    letterSpacing: 0.5,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0084ff',
    fontWeight: '500',
  },
  profileGradient: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  profileLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  loadingProfileText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileDetails: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  medicationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f7ff',
  },
  medicationTimeOverdue: {
    borderBottomColor: '#ffecec',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1971c2',
    marginLeft: 6,
  },
  timeTextOverdue: {
    color: '#ff6b6b',
  },
  medicationDetails: {
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  medicationDosage: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  repeatPatternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  repeatPatternText: {
    color: '#495057',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  notesText: {
    color: '#adb5bd',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f7ff',
    paddingTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkButton: {
    backgroundColor: '#339af0',
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
    backgroundColor: '#34c759',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});