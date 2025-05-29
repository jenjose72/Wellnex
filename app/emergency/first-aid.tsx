import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

type FirstAidItem = {
  id: string;
  title: string;
  category: string;
  steps: string[];
  updated_at: string;
};

const FIRST_AID_STORAGE_KEY = 'wellnex_first_aid_data';
const FIRST_AID_LAST_UPDATED_KEY = 'wellnex_first_aid_updated';

export default function FirstAidScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [firstAidData, setFirstAidData] = useState<FirstAidItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    
    // Initialize data
    initializeFirstAidData();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const initializeFirstAidData = async () => {
    setIsLoading(true);
    
    try {
      // Check if we have stored data
      const storedData = await AsyncStorage.getItem(FIRST_AID_STORAGE_KEY);
      const lastUpdated = await AsyncStorage.getItem(FIRST_AID_LAST_UPDATED_KEY);
      
      if (storedData) {
        // We have cached data
        const parsedData = JSON.parse(storedData);
        setFirstAidData(parsedData);
        setIsDownloaded(true);
        setLastSyncTime(lastUpdated);
        
        // If online, check for newer data in background
        if (isOnline) {
          refreshFirstAidDataIfNeeded(lastUpdated);
        }
      } else if (isOnline) {
        // No cached data but we're online, fetch fresh data
        await fetchAndCacheFirstAidData();
      } else {
        // No cached data and offline
        setIsDownloaded(false);
      }
    } catch (error) {
      console.error('Error initializing first aid data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFirstAidDataIfNeeded = async (lastUpdated: string | null) => {
    if (!isOnline) return;
    
    try {
      // Check if we need to refresh data
      setIsDownloading(true);
      
      // In a real app, you might want to check server-side for data changes
      // Here we're just refreshing data if it's been more than a day
      const shouldRefresh = !lastUpdated || 
        (new Date().getTime() - new Date(lastUpdated).getTime()) > 24 * 60 * 60 * 1000;
      
      if (shouldRefresh) {
        await fetchAndCacheFirstAidData();
      } else {
        setIsDownloaded(true);
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Error refreshing first aid data:', error);
      setIsDownloading(false);
    }
  };

  const fetchAndCacheFirstAidData = async () => {
    if (!isOnline) {
      setIsDownloading(false);
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase
        .from('first_aid_guide')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;

      // Create sample data if database is empty
      const sampleData = createSampleFirstAidData();
      const finalData = data && data.length > 0 ? data : sampleData;
      
      // Parse steps from string to array
      const parsedData = finalData.map(item => ({
        ...item,
        steps: typeof item.steps === 'string' ? JSON.parse(item.steps) : item.steps
      }));
      
      // Cache data locally
      await AsyncStorage.setItem(FIRST_AID_STORAGE_KEY, JSON.stringify(parsedData));
      
      const currentTime = new Date().toISOString();
      await AsyncStorage.setItem(FIRST_AID_LAST_UPDATED_KEY, currentTime);
      
      setFirstAidData(parsedData);
      setLastSyncTime(currentTime);
      setIsDownloaded(true);
    } catch (error) {
      console.error('Error fetching and caching first aid data:', error);
      
      // Try to use sample data if fetch fails
      const sampleData = createSampleFirstAidData();
      setFirstAidData(sampleData);
      
      // Cache sample data as fallback
      await AsyncStorage.setItem(FIRST_AID_STORAGE_KEY, JSON.stringify(sampleData));
      
      const currentTime = new Date().toISOString();
      await AsyncStorage.setItem(FIRST_AID_LAST_UPDATED_KEY, currentTime);
      
      setLastSyncTime(currentTime);
      setIsDownloaded(true);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const createSampleFirstAidData = (): FirstAidItem[] => {
    return [
      {
        id: '1',
        title: 'CPR Instructions',
        category: 'critical',
        steps: [
          'Check for responsiveness and call for help',
          'Place the person on their back',
          'Start chest compressions (30x)',
          'Give two rescue breaths',
          'Continue CPR until help arrives'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Choking',
        category: 'critical',
        steps: [
          'Stand behind the person and lean them forward',
          'Give 5 back blows between the shoulder blades',
          'If unsuccessful, perform 5 abdominal thrusts',
          'Alternate between 5 back blows and 5 abdominal thrusts',
          'Continue until the object is dislodged or emergency help arrives'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Cuts and Scrapes',
        category: 'injuries',
        steps: [
          'Clean your hands with soap and water',
          'Stop the bleeding by applying gentle pressure',
          'Clean the wound with clean water',
          'Apply an antibiotic ointment',
          'Cover with a sterile bandage'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Burns',
        category: 'injuries',
        steps: [
          'Cool the burn with cool (not cold) running water for 10-15 minutes',
          'Remove jewelry or tight items from the burned area',
          'Don\'t break blisters',
          'Apply a clean, dry bandage',
          'Take an over-the-counter pain reliever if needed'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Allergic Reaction',
        category: 'medical',
        steps: [
          'Identify and remove the allergen if possible',
          'If breathing is difficult, call emergency services',
          'Use an epinephrine auto-injector if available',
          'Apply cool compress to itchy areas',
          'Monitor for signs of anaphylaxis (severe reaction)'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '6',
        title: 'Heart Attack',
        category: 'critical',
        steps: [
          'Call emergency services immediately',
          'Have the person sit or lie down and rest',
          'Loosen any tight clothing',
          'If the person is not allergic to aspirin, give them one to chew',
          'If the person becomes unresponsive, begin CPR'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '7',
        title: 'Stroke',
        category: 'critical',
        steps: [
          'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency',
          'Note when symptoms first appeared',
          'Don\'t give them medication, food, or drinks',
          'If unresponsive and not breathing, begin CPR',
          'Keep them comfortable and calm until help arrives'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '8',
        title: 'Broken Bone',
        category: 'injuries',
        steps: [
          'Immobilize the injured area',
          'Apply ice wrapped in a cloth to reduce swelling',
          'Elevate the injured limb if possible',
          'Don\'t try to straighten a broken bone',
          'Seek medical help immediately'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '9',
        title: 'Seizure',
        category: 'medical',
        steps: [
          'Clear the area around the person of anything hazardous',
          'Gently roll them onto their side if possible',
          'Place something soft under their head',
          'Don\'t put anything in their mouth',
          'Call emergency services if the seizure lasts more than 5 minutes'
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: '10',
        title: 'Heat Stroke',
        category: 'medical',
        steps: [
          'Move the person to a cool place',
          'Remove excess clothing',
          'Cool them with wet cloths or a cool bath',
          'Apply ice packs to armpits, neck, and groin',
          'Call emergency services immediately'
        ],
        updated_at: new Date().toISOString()
      }
    ];
  };

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };
  
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'critical': return '#ff3b30';
      case 'injuries': return '#ff9500';
      default: return '#34c759';
    }
  };
  
  const refreshData = async () => {
    if (!isOnline) {
      return;
    }
    
    await fetchAndCacheFirstAidData();
  };

  const filteredData = firstAidData
    .filter(item => 
      (selectedCategory === 'all' || item.category === selectedCategory) &&
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
          <Text style={styles.headerTitle}>First Aid Library</Text>
          {isOnline && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshData}
              disabled={isDownloading}
            >
              <Ionicons name="refresh" size={20} color="#0084ff" />
            </TouchableOpacity>
          )}
        </View>
      
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#0084ff" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search first aid topics"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      
        <View style={styles.categoryFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterScroll}>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'critical' && styles.categoryActive]}
              onPress={() => setSelectedCategory('critical')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'critical' && styles.categoryTextActive]}>Critical</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'injuries' && styles.categoryActive]}
              onPress={() => setSelectedCategory('injuries')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'injuries' && styles.categoryTextActive]}>Injuries</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, selectedCategory === 'medical' && styles.categoryActive]}
              onPress={() => setSelectedCategory('medical')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'medical' && styles.categoryTextActive]}>Medical</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084ff" />
            <Text style={styles.loadingText}>Loading first aid procedures...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="first-aid" size={50} color="#c5d5e6" />
            <Text style={styles.emptyText}>No procedures found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm 
                ? `No results for "${searchTerm}". Try a different search term.`
                : `No ${selectedCategory !== 'all' ? selectedCategory : ''} procedures available.`}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>{filteredData.length} first aid procedures available</Text>
            
            {filteredData.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.firstAidCard, 
                  expandedItem === item.id && styles.expandedCard,
                  { borderLeftColor: getCategoryColor(item.category) }
                ]}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[
                      styles.categoryBadge,
                      { backgroundColor: `${getCategoryColor(item.category)}15` }
                    ]}>
                      <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    size={20} 
                    name={expandedItem === item.id ? "chevron-up" : "chevron-down"} 
                    color="#0084ff" 
                  />
                </View>
                
                {expandedItem === item.id && (
                  <View style={styles.contentContainer}>
                    {item.steps.map((step, index) => (
                      <View key={index} style={styles.stepContainer}>
                        <LinearGradient
                          colors={['#0084ff', '#1e96ff']}
                          style={styles.stepNumber}
                        >
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </LinearGradient>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      
      <BlurView intensity={80} tint="light" style={styles.offlineNotice}>
        {isDownloaded ? (
          <Ionicons name="checkmark-circle" size={16} color="#0084ff" />
        ) : (
          <Ionicons name="cloud-download" size={16} color="#0084ff" />
        )}
        <Text style={styles.offlineText}>
          {isDownloading 
            ? "Downloading first aid information for offline use..."
            : isDownloaded 
              ? `All first aid information available offline (Last updated: ${formatLastSyncTime(lastSyncTime)})`
              : !isOnline 
                ? "You're offline. Connect to download first aid information."
                : "Tap refresh to download first aid information for offline use"}
        </Text>
        {isDownloading && <ActivityIndicator size="small" color="#0084ff" style={{marginLeft: 8}} />}
      </BlurView>
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
  refreshButton: {
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    height: 50,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#222',
  },
  categoryFilterContainer: {
    paddingLeft: 16,
    marginTop: 8,
  },
  categoryFilterScroll: {
    paddingRight: 16,
  },
  categoryButton: {
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
  categoryActive: {
    backgroundColor: '#0084ff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  firstAidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderColor: '#f5f5f5',
  },
  expandedCard: {
    borderColor: '#0084ff',
    shadowColor: '#0084ff',
    shadowOpacity: 0.15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contentContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  offlineNotice: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  offlineText: {
    marginLeft: 8,
    color: '#0084ff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    flex: 1,
  },
});