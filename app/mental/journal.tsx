import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Replace IconSymbol with Expo Vector Icons
import { Ionicons, FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type JournalEntry = {
  id: string;
  mood: string;
  note: string;
  energy_level?: number;
  logged_at: string;
  tags?: string[];
};

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [journalText, setJournalText] = useState('');
  const [selectedMood, setSelectedMood] = useState('Good');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(5);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });
      
      if (error) throw error;
      
      // Format entries and parse tags if they exist
      const formattedEntries = data?.map(entry => ({
        ...entry,
        tags: entry.note?.match(/#[a-zA-Z0-9]+/g)?.map(tag => tag.slice(1)) || []
      }));
      
      setEntries(formattedEntries || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      Alert.alert('Error', 'Failed to load your journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNewEntry = (show: boolean) => {
    setShowNewEntry(show);
    Animated.timing(slideAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const saveEntry = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save a journal entry');
      return;
    }
    
    if (journalText.trim() === '') {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .insert([{
          user_id: user.id,
          mood: selectedMood,
          note: journalText,
          energy_level: energyLevel,
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add tags to the entry
        const newEntry = {
          ...data[0],
          tags: journalText.match(/#[a-zA-Z0-9]+/g)?.map(tag => tag.slice(1)) || []
        };
        
        setEntries([newEntry, ...entries]);
        setJournalText('');
        setEnergyLevel(5);
        toggleNewEntry(false);
        Alert.alert('Success', 'Your journal entry has been saved');
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save your journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('mood_logs')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              
              setEntries(entries.filter(entry => entry.id !== id));
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          }
        }
      ]
    );
  };

  const getMoodColor = (mood: string) => {
    switch(mood) {
      case 'Great': return '#28a745';
      case 'Good': return '#0084ff';
      case 'Okay': return '#ffc107';
      case 'Bad': return '#dc3545';
      default: return '#0084ff';
    }
  };
  
  // Update getMoodIcon function to use Expo Vector Icons names
  const getMoodIcon = (mood: string) => {
    switch(mood) {
      case 'Great': return "happy";
      case 'Good': return "happy-outline";
      case 'Okay': return "sad-outline";
      case 'Bad': return "sad";
      default: return "happy-outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f0f7ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons size={24} name="chevron-back" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mood Journal</Text>
        <TouchableOpacity 
          style={[styles.addButton, showNewEntry && styles.addButtonActive]}
          onPress={() => toggleNewEntry(!showNewEntry)}
        >
          <Ionicons size={24} name={showNewEntry ? "close" : "add"} color={showNewEntry ? "#fff" : "#0084ff"} />
        </TouchableOpacity>
      </LinearGradient>
      
      {showNewEntry ? (
        <Animated.View 
          style={[
            styles.newEntryContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }],
              opacity: slideAnim
            }
          ]}
        >
          <Text style={styles.newEntryTitle}>New Journal Entry</Text>
          
          <View style={styles.moodSelector}>
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodOptions}>
              {['Great', 'Good', 'Okay', 'Bad'].map((mood) => (
                <TouchableOpacity 
                  key={mood}
                  style={[styles.moodOption, selectedMood === mood && styles.selectedMood]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <View 
                    style={[
                      styles.moodIconContainer, 
                      { backgroundColor: selectedMood === mood ? getMoodColor(mood) : `${getMoodColor(mood)}15` }
                    ]}
                  >
                    <MaterialCommunityIcons 
                      size={28} 
                      name={getMoodIcon(mood)} 
                      color={selectedMood === mood ? '#fff' : getMoodColor(mood)} 
                    />
                  </View>
                  <Text style={[
                    styles.moodText, 
                    selectedMood === mood && { color: getMoodColor(mood), fontWeight: '600' }
                  ]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.energyContainer}>
            <Text style={styles.energyLabel}>Energy Level: {energyLevel}/10</Text>
            <View style={styles.energySlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.energyDot,
                    { backgroundColor: level <= energyLevel ? '#0084ff' : '#e6f2ff' }
                  ]}
                  onPress={() => setEnergyLevel(level)}
                />
              ))}
            </View>
          </View>
          
          <TextInput
            style={styles.journalInput}
            placeholder="Write about your day, thoughts, or feelings... Use #tags to categorize"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            value={journalText}
            onChangeText={setJournalText}
          />
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={saveEntry}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView 
          style={styles.entriesContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.journalHeader}>
            <Text style={styles.journalHeaderText}>Your Journal Entries</Text>
            <Text style={styles.journalSubheaderText}>Reflect on your emotional journey</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0084ff" />
              <Text style={styles.loadingText}>Loading journal entries...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#e6f2ff', '#f0f7ff']}
                style={styles.emptyStateIcon}
              >
                <FontAwesome size={48} name="book" color="#0084ff" />
              </LinearGradient>
              <Text style={styles.emptyStateText}>No journal entries yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add your first entry</Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <LinearGradient
                  colors={['#ffffff', '#f8fbff']}
                  style={styles.entryGradient}
                >
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>
                      {formatDate(entry.logged_at)}
                    </Text>
                    <View style={styles.entryMood}>
                      <MaterialCommunityIcons 
                        size={20} 
                        name={getMoodIcon(entry.mood)} 
                        color={getMoodColor(entry.mood)} 
                      />
                      <Text style={[styles.entryMoodText, { color: getMoodColor(entry.mood) }]}>
                        {entry.mood}
                      </Text>
                      {entry.energy_level && (
                        <Text style={styles.energyText}>• Energy: {entry.energy_level}/10</Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.entryText}>{entry.note}</Text>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <View style={styles.tagContainer}>
                      {entry.tags.map(tag => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.deleteEntryButton}
                    onPress={() => deleteEntry(entry.id)}
                  >
                    <MaterialIcons size={16} name="delete" color="#ff3b30" />
                    <Text style={styles.deleteEntryText}>Delete</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f2ff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  addButtonActive: {
    backgroundColor: '#0084ff',
    borderColor: '#0084ff',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  journalHeader: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  journalHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  journalSubheaderText: {
    fontSize: 16,
    color: '#666',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  entryCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  entryGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  entryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  entryMoodText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 4,
  },
  energyText: {
    fontSize: 12,
    color: '#666',
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  tagText: {
    fontSize: 12,
    color: '#0084ff',
    fontWeight: '600',
  },
  deleteEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 8,
  },
  deleteEntryText: {
    fontSize: 14,
    color: '#ff3b30',
    marginLeft: 4,
  },
  newEntryContainer: {
    flex: 1,
    padding: 20,
  },
  newEntryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  moodSelector: {
    marginBottom: 20,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  selectedMood: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodText: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  energyContainer: {
    marginBottom: 20,
  },
  energyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  energySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  energyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e6f2ff',
  },
  journalInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    height: 200,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e6f2ff',
    marginBottom: 24,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});