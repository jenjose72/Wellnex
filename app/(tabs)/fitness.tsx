import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FitnessScreen() {
  const navigation = useNavigation();
  const router=useRouter()
  const [userData, setUserData] = useState({
    height: 0,
    weight: 0,
    bmi: 0,
    bmiCategory: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [newHeight, setNewHeight] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users_profile')
        .select('height_cm, weight_kg')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const height = data.height_cm || 0;
        const weight = data.weight_kg || 0;
        const calculatedBMI = calculateBMI(height, weight);
        const category = getBMICategory(calculatedBMI);
        
        setUserData({
          height,
          weight,
          bmi: calculatedBMI,
          bmiCategory: category,
        });
        
        setNewHeight(height.toString());
        setNewWeight(weight.toString());
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
    setLoading(false);
  };

  const calculateBMI = (height, weight) => {
    if (height <= 0 || weight <= 0) return 0;
    // Height in meters (assuming it's stored in cm)
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (bmi === 0) return 'Not Available';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obesity';
  };

  const getBMICategoryColor = (category) => {
    switch(category) {
      case 'Underweight': return '#a83b00';
      case 'Normal weight': return '#04e000';
      case 'Overweight': return '#f03e3e';
      case 'Obesity': return '#a80000';
      default: return '#adb5bd';
    }
  };

    const getBMICategoryBgColor = (category) => {
    switch(category) {
      case 'Underweight': return '#f5c2a6';
      case 'Normal weight': return '#c7f7c6';
      case 'Overweight': return '#ffcfcf';
      case 'Obesity': return '#ffc7c7';
      default: return '#adb5bd';
    }
  };
  const updateUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const height = parseFloat(newHeight);
      const weight = parseFloat(newWeight);

      if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        Alert.alert('Error', 'Please enter valid height and weight values');
        return;
      }

      const { error } = await supabase
        .from('users_profile')
        .update({
          height_cm: height,
          weight_kg: weight,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user data:', error);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setModalVisible(false);
      fetchUserData();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error in updateUserData:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#e7f5ff', '#f8f9fa']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Fitness</Text>
          <Text style={styles.headerSubtitle}>Track and optimize your health</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* BMI Calculator Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <IconSymbol name="waveform.path.ecg" size={20} color="#1971c2" />
              <Text style={styles.cardTitle}>BMI Calculator</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setModalVisible(true)}
            >
              <IconSymbol name="pencil" size={16} color="#339af0" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <IconSymbol name="arrow.clockwise" size={24} color="#339af0" />
              <Text style={styles.loadingText}>Loading your data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.bmiResult}>
                <Text style={[styles.bmiValue,{color:getBMICategoryColor(userData.bmiCategory)}]}>{userData.bmi}</Text>
                <View 
                  style={[
                    styles.bmiCategoryBadge, 
                    {backgroundColor: getBMICategoryColor(userData.bmiCategory)}
                  ]}
                >
                  <Text style={styles.bmiCategoryText}>{userData.bmiCategory}</Text>
                </View>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Height</Text>
                  <Text style={styles.statValue}>{userData.height} cm</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{userData.weight} kg</Text>
                </View>
              </View>
              
              <View style={[styles.tipContainer,{backgroundColor: getBMICategoryBgColor(userData.bmiCategory)}]}>
                <Text style={[styles.bmiTip,{color: getBMICategoryColor(userData.bmiCategory)}]}>
                  BMI is a measurement of a person's weight with respect to their height. It's a good indicator of your health.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Chatbot Redirect Section */}
        <TouchableOpacity
          style={[styles.card, styles.chatbotCard]}
          onPress={() => router.push('fitness/chatbot')}
        >
          <LinearGradient
            colors={['#228be6', '#1971c2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatbotGradient}
          >
            <View style={styles.chatbotContent}>
              <View>
                <Text style={styles.chatbotTitle}>Ask Fitness Bot</Text>
                <Text style={styles.chatbotDescription}>
                  Get workout tips, routines, and healthy habits with our AI chatbot.
                </Text>
              </View>
              <View style={styles.chatbotIconContainer}>
               <Ionicons size={28} name="fitness-sharp" color='#FFFFFF' />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update your measurements</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" size={20} color="#adb5bd" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={newHeight}
                  onChangeText={setNewHeight}
                  keyboardType="numeric"
                  placeholder="Height in cm"
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
              
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="numeric"
                  placeholder="Weight in kg"
                />
                <Text style={styles.inputUnit}>kg</Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateUserData}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated styles for the fitness page header to match the Emergency page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1c7ed6',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#5f6368',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1971c2',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e7f5ff',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#339af0',
    marginLeft: 4,
    fontWeight: '500',
  },
  bmiResult: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1971c2',
  },
  bmiCategoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  bmiCategoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e7f5ff',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#e7f5ff',
  },
  statLabel: {
    fontSize: 14,
    color: '#74c0fc',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1971c2',
  },
  tipContainer: {
    backgroundColor: '#e7f5ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  bmiTip: {
    fontSize: 14,
    color: '#1971c2',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    textAlign: 'center',
    color: '#74c0fc',
    marginTop: 12,
    fontSize: 16,
  },
  chatbotCard: {
    padding: 0,
    overflow: 'hidden',
  },
  chatbotGradient: {
    borderRadius: 16,
  },
  chatbotContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  chatbotDescription: {
    fontSize: 14,
    color: '#e7f5ff',
    maxWidth: '90%',
  },
  chatbotIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 113, 194, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1971c2',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#74c0fc',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#e7f5ff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1971c2',
  },
  inputUnit: {
    marginLeft: 10,
    fontSize: 16,
    color: '#74c0fc',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  cancelButtonText: {
    color: '#74c0fc',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#339af0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});