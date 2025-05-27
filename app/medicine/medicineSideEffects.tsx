import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const MedicineSideEffects = () => {
  const navigation = useNavigation();
  const [medicineName, setMedicineName] = useState('');
  const [loading, setLoading] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const [error, setError] = useState('');

  const fetchMedicineInfo = async () => {
    if (!medicineName.trim()) {
      setError('Please enter a medicine name');
      return;
    }

    setLoading(true);
    setError('');
    setMedicineInfo(null);

    try {
      // Configure the model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create a prompt for medicine information
      const prompt = `Please provide information about the medication "${medicineName}" in the following JSON format:
      {
        "name": "Full medication name",
        "purpose": "What this medication is used to treat (1-2 sentences)",
        "category": "Drug category/class",
        "sideEffects": {
          "common": ["list", "of", "common", "side", "effects"],
          "serious": ["list", "of", "serious", "side", "effects", "that", "require", "medical", "attention"]
        },
        "precautions": ["list", "of", "important", "precautions"],
        "interactions": ["list", "of", "notable", "drug", "interactions"]
      }
      
      If you're not familiar with this specific medication, please respond with:
      {
        "error": "Information not available"
      }
      
      Return ONLY the JSON with no additional text.`;
      
      // Get response from Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Try to parse the response as JSON
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.substring(jsonStart, jsonEnd);
        const parsedInfo = JSON.parse(jsonString);
        
        if (parsedInfo.error) {
          setError(`Sorry, information about "${medicineName}" is not available.`);
        } else {
          setMedicineInfo(parsedInfo);
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        setError('Failed to process medication information. Please try a different medication name.');
      }
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      setError('Unable to retrieve medication information at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#e7f5ff', '#f8f9fa']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <IconSymbol name="chevron.left" size={24} color="#1971c2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Information</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchSection}>
            <Text style={styles.searchTitle}>
              Get Information About Your Medication
            </Text>
            <Text style={styles.searchSubtitle}>
              Enter a medication name to learn about its uses and potential side effects
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter medicine name (e.g., Ibuprofen)"
                placeholderTextColor="#74c0fc"
                value={medicineName}
                onChangeText={setMedicineName}
              />

              <TouchableOpacity
                style={[
                  styles.searchButton,
                  !medicineName.trim() && styles.searchButtonDisabled,
                ]}
                onPress={fetchMedicineInfo}
                disabled={!medicineName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <IconSymbol name="magnifyingglass" size={18} color="#fff" />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.triangle" size={32} color="#ff922b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {medicineInfo && (
            <View style={styles.resultCard}>
              <View style={styles.medicineHeader}>
                <View>
                  <Text style={styles.medicineName}>{medicineInfo.name}</Text>
                  <Text style={styles.medicineCategory}>{medicineInfo.category}</Text>
                </View>
                <View style={styles.pillIconContainer}>
                  <IconSymbol name="pills.fill" size={24} color="#fff" />
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Purpose</Text>
                <Text style={styles.sectionContent}>{medicineInfo.purpose}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Common Side Effects</Text>
                <View style={styles.listContainer}>
                  {medicineInfo.sideEffects.common.map((effect, index) => (
                    <View key={`common-${index}`} style={styles.listItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.listItemText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>
                  <Text style={{ color: '#e03131' }}>Serious</Text> Side Effects
                </Text>
                <Text style={styles.warningText}>Seek medical attention if you experience:</Text>
                <View style={styles.listContainer}>
                  {medicineInfo.sideEffects.serious.map((effect, index) => (
                    <View key={`serious-${index}`} style={styles.listItem}>
                      <View style={[styles.bulletPoint, styles.seriousBullet]} />
                      <Text style={styles.listItemText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Precautions</Text>
                <View style={styles.listContainer}>
                  {medicineInfo.precautions.map((precaution, index) => (
                    <View key={`precaution-${index}`} style={styles.listItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.listItemText}>{precaution}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {medicineInfo.interactions && medicineInfo.interactions.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Drug Interactions</Text>
                  <View style={styles.listContainer}>
                    {medicineInfo.interactions.map((interaction, index) => (
                      <View key={`interaction-${index}`} style={styles.listItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.listItemText}>{interaction}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.disclaimer}>
                Note: This information is provided for educational purposes and is not a substitute for professional medical advice. Always consult with your healthcare provider.
              </Text>
            </View>
          )}

          {!medicineInfo && !loading && !error && (
            <View style={styles.placeholderContainer}>
              <IconSymbol name="magnifyingglass" size={64} color="#74c0fc" />
              <Text style={styles.placeholderText}>
                Search for a medication to see information about its uses and side effects
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
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
  searchSection: {
    marginBottom: 24,
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1971c2',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#e7f5ff',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1971c2',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d0ebff',
  },
  searchButton: {
    backgroundColor: '#339af0',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#a5d8ff',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#fff9db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffec99',
    marginBottom: 24,
  },
  errorText: {
    color: '#e67700',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e7f5ff',
  },
  placeholderText: {
    color: '#74c0fc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#d0ebff',
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1971c2',
  },
  medicineCategory: {
    fontSize: 14,
    color: '#74c0fc',
    marginTop: 4,
  },
  pillIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#339af0',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e7f5ff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  warningText: {
    fontSize: 14,
    color: '#e03131',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#339af0',
    marginTop: 8,
    marginRight: 10,
  },
  seriousBullet: {
    backgroundColor: '#e03131',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: 12,
    color: '#868e96',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 16,
  },
});

export default MedicineSideEffects;