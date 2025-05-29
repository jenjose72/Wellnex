import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Initialize Gemini API
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY';
const genAI = new GoogleGenerativeAI(apiKey);

const MedicineConflicts = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [conflictResults, setConflictResults] = useState(null);
  const [error, setError] = useState('');

  // Fetch user's medications from Supabase
  useEffect(() => {
    fetchUserMedications();
  }, []);

  const fetchUserMedications = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to view your medication conflicts');
        setLoading(false);
        return;
      }
      
      // Fetch medications from Supabase
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('medicine_name, dosage, notes')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching medications:', error);
        setError('Failed to fetch your medications');
      } else {
        setMedications(data || []);
        
        // Auto-analyze if medications exist
        if (data && data.length > 1) {
          analyzeConflicts(data);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserMedications:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeConflicts = async (meds = medications) => {
    if (!meds || meds.length < 2) {
      setConflictResults({
        hasConflicts: false,
        message: "You need at least two medications to check for conflicts.",
        conflicts: []
      });
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      
      // Format medications for the prompt
      const medsList = meds.map(med => 
        `${med.medicine_name}${med.dosage ? ` (${med.dosage})` : ''}`
      ).join(', ');
      
      // Configure the model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create the prompt for Gemini
      const prompt = `As a healthcare assistant, analyze the following medications for potential interactions or conflicts. 
      The user is currently taking these medications: ${medsList}.
      
      Please provide your analysis in JSON format as follows:
      {
        "hasConflicts": true/false,
        "summary": "Brief summary of findings",
        "conflicts": [
          {
            "medications": ["Drug A", "Drug B"],
            "severity": "Mild/Moderate/Severe",
            "description": "Description of the interaction",
            "recommendation": "What the user should know or do"
          }
          // Additional conflicts if any
        ]
      }
      
      If there are no conflicts, still provide the JSON with hasConflicts set to false and an appropriate summary.
      Only return the JSON object without any additional text or explanation.`;
      
      // Get response from Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
    
      try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsedResults = JSON.parse(jsonString);
        
        setConflictResults(parsedResults);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        setError('Failed to analyze medication conflicts. Please try again.');
      }
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      setError('Unable to check for conflicts at this time. Please try again later.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return '#e03131';
      case 'moderate':
        return '#f08c00';
      case 'mild':
        return '#74b816';
      default:
        return '#339af0';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#e7f5ff', '#f8f9fa']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#1971c2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication Conflicts</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overview section */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <MaterialCommunityIcons name="pill" size={24} color="#1971c2" />
            <Text style={styles.overviewTitle}>Your Medications</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#339af0" />
              <Text style={styles.loadingText}>Loading your medications...</Text>
            </View>
          ) : medications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={40} color="#74c0fc" />
              <Text style={styles.emptyTitle}>No Medications Found</Text>
              <Text style={styles.emptyMessage}>
                You don't have any medications added. Add medications in your health management section.
              </Text>
              <TouchableOpacity
                style={styles.addMedsButton}
                onPress={() => navigation.navigate('(tabs)/medication')}
              >
                <Text style={styles.addMedsButtonText}>Add Medications</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.medicationList}>
                {medications.map((med, index) => (
                  <View key={index} style={styles.medicationItem}>
                    <View style={styles.medicationIcon}>
                      <MaterialCommunityIcons name="pill" size={16} color="#1971c2" />
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.medicationName}>{med.medicine_name}</Text>
                      {med.dosage ? (
                        <Text style={styles.medicationDosage}>{med.dosage}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              
              {medications.length === 1 && (
                <Text style={styles.singleMedicationMessage}>
                  You need at least two medications to check for conflicts
                </Text>
              )}
            </>
          )}
        </View>

        {/* Conflicts section */}
        {!loading && medications.length > 1 && (
          <View style={styles.conflictsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conflict Analysis</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => analyzeConflicts()}
                disabled={analyzing}
              >
                <Ionicons name="refresh" size={16} color="#1971c2" />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            
            {analyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#339af0" />
                <Text style={styles.analyzingText}>Analyzing medication conflicts...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={32} color="#ff922b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : conflictResults ? (
              <View style={styles.resultsContainer}>
                <View style={[
                  styles.summaryBanner,
                  conflictResults.hasConflicts ? styles.warningBanner : styles.safeBanner
                ]}>
                  {conflictResults.hasConflicts ? (
                    <Ionicons name="warning" size={24} color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                  <Text style={styles.summaryText}>{conflictResults.summary}</Text>
                </View>
                
                {conflictResults.hasConflicts && conflictResults.conflicts.map((conflict, index) => (
                  <View key={index} style={styles.conflictCard}>
                    <View style={styles.conflictHeader}>
                      <View style={[
                        styles.severityBadge, 
                        { backgroundColor: getSeverityColor(conflict.severity) }
                      ]}>
                        <Text style={styles.severityText}>{conflict.severity}</Text>
                      </View>
                      <Text style={styles.conflictingMeds}>
                        {conflict.medications.join(' + ')}
                      </Text>
                    </View>
                    
                    <Text style={styles.conflictDescription}>
                      {conflict.description}
                    </Text>
                    
                    <View style={styles.recommendationContainer}>
                      <Ionicons name="bulb" size={20} color="#1971c2" />
                      <Text style={styles.recommendationText}>
                        {conflict.recommendation}
                      </Text>
                    </View>
                  </View>
                ))}
                
                <View style={styles.disclaimerContainer}>
                  <Text style={styles.disclaimerText}>
                    This information is for reference only. Always consult with your healthcare provider before making any changes to your medication regimen.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7f5ff',
    borderWidth: 1,
    borderColor: '#d0ebff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1971c2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e7f5ff',
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#74c0fc',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 16,
  },
  addMedsButton: {
    backgroundColor: '#339af0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addMedsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  medicationList: {
    marginBottom: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e7f5ff',
  },
  medicationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e7f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1971c2',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#74c0fc',
    marginTop: 2,
  },
  singleMedicationMessage: {
    fontSize: 14,
    color: '#868e96',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  conflictsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  refreshText: {
    color: '#1971c2',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  analyzingText: {
    fontSize: 16,
    color: '#74c0fc',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#fff9db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffec99',
  },
  errorText: {
    color: '#e67700',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  resultsContainer: {
    marginTop: 8,
  },
  summaryBanner: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningBanner: {
    backgroundColor: '#ff8787',
  },
  safeBanner: {
    backgroundColor: '#69db7c',
  },
  summaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  conflictCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  conflictingMeds: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1971c2',
  },
  conflictDescription: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 12,
  },
  recommendationContainer: {
    flexDirection: 'row',
    backgroundColor: '#e7f5ff',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1971c2',
    marginLeft: 10,
    flex: 1,
  },
  disclaimerContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ced4da',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#868e96',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default MedicineConflicts;