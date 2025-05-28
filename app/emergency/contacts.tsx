import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

type Contact = {
  id: string;
  name: string;
  phone_number: string;
  relation: string;
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone_number: '', relation: 'personal' });
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load your emergency contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!user) return;
    
    if (newContact.name.trim() === '' || newContact.phone_number.trim() === '') {
      Alert.alert('Error', 'Please enter both name and phone number');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([
          {
            user_id: user.id,
            name: newContact.name.trim(),
            phone_number: newContact.phone_number.trim(),
            relation: newContact.relation
          }
        ])
        .select();
        
      if (error) throw error;

      setContacts([...(data || []), ...contacts]);
      setNewContact({ name: '', phone_number: '', relation: 'personal' });
      setShowAddForm(false);
      Alert.alert('Success', 'Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('emergency_contacts')
                .delete()
                .eq('id', id);
                
              if (error) throw error;
              
              setContacts(contacts.filter(contact => contact.id !== id));
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCall = (phoneNumber: string) => {
    // Show confirmation dialog before making call
    Alert.alert(
      'Make Phone Call',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
      ]
    );
  };

  const filteredContacts = filter === 'all' 
    ? contacts 
    : contacts.filter(contact => contact.relation === filter);
    
  const getRelationColor = (relation: string) => {
    switch(relation) {
      case 'emergency': return '#ff3b30';
      case 'hospital': return '#0084ff';
      case 'doctor': return '#34c759';
      default: return '#ff9500';
    }
  };

  const getRelationIcon = (relation: string) => {
    switch(relation) {
      case 'emergency':
        return <MaterialIcons name="emergency" size={14} color={getRelationColor(relation)} />;
      case 'hospital':
        return <FontAwesome5 name="hospital" size={14} color={getRelationColor(relation)} />;
      case 'doctor':
        return <FontAwesome5 name="user-md" size={14} color={getRelationColor(relation)} />;
      default:
        return <Ionicons name="person" size={14} color={getRelationColor(relation)} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#ffffff', '#f5f9ff']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0084ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <TouchableOpacity 
            style={[styles.addButton, showAddForm && styles.activeAddButton]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <Ionicons name="close" size={24} color="#fff" />
            ) : (
              <Ionicons name="add" size={24} color="#0084ff" />
            )}
          </TouchableOpacity>
        </View>
      
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'all' && styles.filterActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'emergency' && styles.filterActive]}
              onPress={() => setFilter('emergency')}
            >
              <Text style={[styles.filterText, filter === 'emergency' && styles.filterTextActive]}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'hospital' && styles.filterActive]}
              onPress={() => setFilter('hospital')}
            >
              <Text style={[styles.filterText, filter === 'hospital' && styles.filterTextActive]}>Hospital</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'doctor' && styles.filterActive]}
              onPress={() => setFilter('doctor')}
            >
              <Text style={[styles.filterText, filter === 'doctor' && styles.filterTextActive]}>Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'personal' && styles.filterActive]}
              onPress={() => setFilter('personal')}
            >
              <Text style={[styles.filterText, filter === 'personal' && styles.filterTextActive]}>Personal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
      
      {showAddForm && (
        <View style={styles.addFormContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={newContact.name}
            onChangeText={(text) => setNewContact({...newContact, name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={newContact.phone_number}
            onChangeText={(text) => setNewContact({...newContact, phone_number: text})}
            keyboardType="phone-pad"
          />
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <View style={styles.categoryButtonsContainer}>
              <TouchableOpacity 
                style={[styles.categoryButton, newContact.relation === 'personal' && styles.categoryActive]}
                onPress={() => setNewContact({...newContact, relation: 'personal'})}
              >
                <Text style={[styles.categoryText, newContact.relation === 'personal' && styles.categoryTextActive]}>Personal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryButton, newContact.relation === 'doctor' && styles.categoryActive]}
                onPress={() => setNewContact({...newContact, relation: 'doctor'})}
              >
                <Text style={[styles.categoryText, newContact.relation === 'doctor' && styles.categoryTextActive]}>Doctor</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryButton, newContact.relation === 'hospital' && styles.categoryActive]}
                onPress={() => setNewContact({...newContact, relation: 'hospital'})}
              >
                <Text style={[styles.categoryText, newContact.relation === 'hospital' && styles.categoryTextActive]}>Hospital</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryButton, newContact.relation === 'emergency' && styles.categoryActive]}
                onPress={() => setNewContact({...newContact, relation: 'emergency'})}
              >
                <Text style={[styles.categoryText, newContact.relation === 'emergency' && styles.categoryTextActive]}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleAddContact}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#0084ff', '#1e96ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Contact</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084ff" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-add" size={50} color="#c5d5e6" />
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Tap the + button to add your first emergency contact'
                : `No ${filter} contacts found. Try a different category or add a new contact`}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={[styles.contactIndicator, { backgroundColor: getRelationColor(contact.relation) }]} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>{contact.phone_number}</Text>
                <View style={[styles.contactBadge, { backgroundColor: `${getRelationColor(contact.relation)}15` }]}>
                  <View style={styles.badgeIconContainer}>
                    {getRelationIcon(contact.relation)}
                    <Text style={[styles.contactBadgeText, { color: getRelationColor(contact.relation) }]}>
                      {contact.relation}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.contactActions}>
                {/* Enhanced Call Button */}
                
                
                {/* Dial Button - Opens phone dialer directly */}
                <TouchableOpacity 
                  style={styles.dialButton}
                  onPress={() => Linking.openURL(`tel:${contact.phone_number}`)}
                >
                  <LinearGradient
                    colors={['#34c759', '#30d158']}
                    style={styles.callButtonGradient}
                  >
                    <FontAwesome5 name="phone-alt" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContact(contact.id)}
                >
                  <LinearGradient
                    colors={['#ff3b30', '#ff4d40']}
                    style={styles.callButtonGradient}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 16, 
    borderBottomRightRadius: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeAddButton: {
    backgroundColor: '#0084ff',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterActive: {
    backgroundColor: '#0084ff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  contactIndicator: {
    width: 4,
    height: '100%',
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
    letterSpacing: -0.3,
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
  badgeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  dialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  callButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addFormContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryActive: {
    backgroundColor: '#0084ff',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});