import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

type UserProfile = {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_group?: string;
};

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    name: '',
    age: undefined,
    gender: '',
    height_cm: undefined,
    weight_kg: undefined,
    blood_group: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
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
      
      setProfile(data || { 
        id: user.id,
        name: '',
        gender: '',
        blood_group: '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInputChange = (field: keyof UserProfile, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    
    if (value === '' || !isNaN(numValue)) {
      setProfile(prev => ({ ...prev, [field]: value === '' ? undefined : numValue }));
    }
  };

  const validateForm = () => {
    if (!profile.name || profile.name.trim() === '') {
      setErrorMessage('Please enter your name');
      return false;
    }
    
    if (profile.age !== undefined && (profile.age <= 0 || profile.age > 120)) {
      setErrorMessage('Please enter a valid age (1-120)');
      return false;
    }
    
    if (profile.height_cm !== undefined && (profile.height_cm <= 0 || profile.height_cm > 300)) {
      setErrorMessage('Please enter a valid height (1-300 cm)');
      return false;
    }
    
    if (profile.weight_kg !== undefined && (profile.weight_kg <= 0 || profile.weight_kg > 500)) {
      setErrorMessage('Please enter a valid weight (1-500 kg)');
      return false;
    }
    
    setErrorMessage(null);
    return true;
  };

  const calculateBMI = () => {
    if (profile.height_cm && profile.weight_kg) {
      const heightInMeters = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightInMeters * heightInMeters);
      const bmiStatus = getBMIStatus(bmi);
      
      try {
        if (user) {
          supabase.from('bmi_logs').insert([{
            user_id: user.id,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            bmi_result: bmi,
            bmi_status: bmiStatus,
          }]);
        }
      } catch (error) {
        console.error('Error logging BMI:', error);
      }
    }
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const saveProfile = async () => {
    if (!validateForm() || !user) return;
    
    try {
      setIsSaving(true);
      
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let saveError;
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('users_profile')
          .update({
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            blood_group: profile.blood_group,
          })
          .eq('id', user.id);
          
        saveError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('users_profile')
          .insert({
            id: user.id,
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            blood_group: profile.blood_group,
          });
          
        saveError = error;
      }
      
      if (saveError) throw saveError;
      
      // Log BMI if height and weight are provided
      calculateBMI();
      
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol size={24} name="chevron.left" color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084ff" />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.name || ''}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.age?.toString() || ''}
                  onChangeText={(text) => handleNumberInputChange('age', text)}
                  placeholder="Enter your age"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile.gender || ''}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select gender" value="" color="#999" />
                    {genderOptions.map((gender) => (
                      <Picker.Item key={gender} label={gender} value={gender} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.height_cm?.toString() || ''}
                  onChangeText={(text) => handleNumberInputChange('height_cm', text)}
                  placeholder="Enter your height in cm"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.weight_kg?.toString() || ''}
                  onChangeText={(text) => handleNumberInputChange('weight_kg', text)}
                  placeholder="Enter your weight in kg"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Blood Group</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile.blood_group || ''}
                    onValueChange={(value) => handleInputChange('blood_group', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select blood group" value="" color="#999" />
                    {bloodGroupOptions.map((bloodGroup) => (
                      <Picker.Item key={bloodGroup} label={bloodGroup} value={bloodGroup} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f2ff',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#fce8e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0084ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});