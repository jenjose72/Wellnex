import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
export default function MedicationScreen() {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showHistoryDatePicker, setShowHistoryDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(new Date());

  const [newMed, setNewMed] = useState({
    medicine_name: '',
    dosage: '',
    time: '',
    start_date: '',
    end_date: '',
    repeat_pattern: '',
    notes: '',
    user_id: '',
  });

  const [newHistory, setNewHistory] = useState({
    type: '',
    title: '',
    description: '',
    date_recorded: '',
    user_id: '',
  });

  const historyTypes = [
    'Diagnosis',
    'Surgery',
    'Allergy',
    'Vaccination',
    'Lab Result',
    'Treatment',
    'Emergency',
    'Other'
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
    fetchMedications();
    fetchMedicalHistory();
  }, []);

  const fetchMedications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medication_reminders')
      .select('*')
      .order('time', { ascending: true });

    if (error) console.error(error);
    else setMedications(data);

    setLoading(false);
  };

  const fetchMedicalHistory = async () => {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .order('date_recorded', { ascending: false });

    if (error) console.error('Error fetching medical history:', error);
    else setMedicalHistory(data || []);
  };

  const addMedication = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Authentication Error', 'User not logged in.');
      return;
    }

    const medicationWithUser = {
      ...newMed,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('medication_reminders')
      .insert([medicationWithUser]);

    if (error) {
      console.error(error);
      Alert.alert('Error adding medication');
    } else {
      setModalVisible(false);
      setNewMed({
        medicine_name: '',
        dosage: '',
        time: '',
        start_date: '',
        end_date: '',
        repeat_pattern: '',
        notes: '',
        user_id: '',
      });
      fetchMedications();
      scheduleMedicationNotification(newMed);
    }
  };

  const addMedicalHistory = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Authentication Error', 'User not logged in.');
      return;
    }

    if (!newHistory.type || !newHistory.title || !newHistory.date_recorded) {
      Alert.alert('Validation Error', 'Please fill in required fields (Type, Title, and Date).');
      return;
    }

    const historyWithUser = {
      ...newHistory,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('medical_history')
      .insert([historyWithUser]);

    if (error) {
      console.error('Error adding medical history:', error);
      Alert.alert('Error', 'Failed to add medical history record.');
    } else {
      setHistoryModalVisible(false);
      setNewHistory({
        type: '',
        title: '',
        description: '',
        date_recorded: '',
        user_id: '',
      });
      fetchMedicalHistory();
      Alert.alert('Success', 'Medical history record added successfully.');
    }
  };

  const deleteMedicalHistory = async (historyId) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this medical history record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('medical_history')
              .delete()
              .eq('id', historyId);

            if (error) {
              console.error('Error deleting medical history:', error);
              Alert.alert('Error', 'Failed to delete medical history record.');
            } else {
              fetchMedicalHistory();
            }
          },
        },
      ]
    );
  };

  const scheduleMedicationNotification = async (med) => {
    try {
      const medTime = parse(med.time, 'hh:mm a', new Date());
      const now = new Date();

      if (medTime < now) {
        medTime.setDate(medTime.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to take ${med.medicine_name}`,
          body: `Dosage: ${med.dosage || 'As prescribed'}`,
          sound: true,
        },
        trigger: {
          hour: medTime.getHours(),
          minute: medTime.getMinutes(),
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedTime(selectedTime);
      setNewMed({
        ...newMed,
        time: format(selectedTime, 'hh:mm a'),
      });
    }
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      setNewMed({
        ...newMed,
        start_date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedEndDate(selectedDate);
      setNewMed({
        ...newMed,
        end_date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
  };

  const onHistoryDateChange = (event, selectedDate) => {
    setShowHistoryDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedHistoryDate(selectedDate);
      setNewHistory({
        ...newHistory,
        date_recorded: format(selectedDate, 'yyyy-MM-dd'),
      });
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Diagnosis': '#1c7ed6',
      'Surgery': '#4dabf7', 
      'Allergy': '#74c0fc',
      'Vaccination': '#339af0',
      'Lab Result': '#228be6',
      'Treatment': '#1971c2',
      'Emergency': '#1864ab',
      'Other': '#adb5bd'
    };
    return colors[type] || '#adb5bd';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#e7f5ff', '#f8f9fa']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Health Management</Text>
          <Text style={styles.headerSubtitle}>Track medications and medical history</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Medications Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <IconSymbol name="pills" size={20} color="#1971c2" />
              <Text style={styles.sectionTitle}>Today's Medications</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <IconSymbol size={16} name="plus" color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="pill" size={36} color="#74c0fc" />
              <Text style={styles.emptyStateText}>No medications scheduled</Text>
              <Text style={styles.emptyStateSubtext}>Add your medications to get reminders</Text>
            </View>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={styles.medicationCard}>
                <View style={styles.medicationTime}>
                  <IconSymbol name="clock" size={18} color="#1971c2" />
                  <Text style={styles.timeText}>{med.time}</Text>
                </View>
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationName}>{med.medicine_name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                  {med.notes ? (
                    <Text style={styles.notesText}>
                      Notes: {med.notes}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.checkButton}>
                  <IconSymbol size={16} name="checkmark" color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Medical History Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <IconSymbol name="doc.text" size={20} color="#1971c2" />
              <Text style={styles.sectionTitle}>Medical History</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setHistoryModalVisible(true)}
            >
              <IconSymbol size={16} name="plus" color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medicalHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="doc.text" size={36} color="#74c0fc" />
              <Text style={styles.emptyStateText}>No medical history records yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your medical history for future reference</Text>
            </View>
          ) : (
            medicalHistory.map((history) => (
              <View key={history.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyTypeContainer}>
                    <View 
                      style={[
                        styles.historyTypeBadge, 
                        { backgroundColor: getTypeColor(history.type) }
                      ]}
                    >
                      <Text style={styles.historyTypeText}>{history.type}</Text>
                    </View>
                    <Text style={styles.historyDate}>{history.date_recorded}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteMedicalHistory(history.id)}
                  >
                    <IconSymbol size={16} name="trash" color="#339af0" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.historyTitle}>{history.title}</Text>
                {history.description ? (
                  <Text style={styles.historyDescription}>{history.description}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Add Medication Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Medication</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" size={20} color="#adb5bd" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Medicine Name"
                value={newMed.medicine_name}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, medicine_name: text })
                }
                style={styles.input}
                placeholderTextColor="#74c0fc"
              />
              <TextInput
                placeholder="Dosage (e.g., 500mg • 1 Tablet)"
                value={newMed.dosage}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, dosage: text })
                }
                style={styles.input}
                placeholderTextColor="#74c0fc"
              />
              <TextInput
                placeholder="Repeat Pattern (e.g., daily)"
                value={newMed.repeat_pattern}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, repeat_pattern: text })
                }
                style={styles.input}
                placeholderTextColor="#74c0fc"
              />
              <TextInput
                placeholder="Notes (optional)"
                value={newMed.notes}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, notes: text })
                }
                style={styles.input}
                placeholderTextColor="#74c0fc"
              />

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="time" size={20} color="#1971c2" />
                  <Text style={styles.dateTimeText}>
                    {newMed.time || 'Select Time'}
                  </Text>
                </View>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={onTimeChange}
                />
              )}

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="calendar" size={20} color="#1971c2" />
                  <Text style={styles.dateTimeText}>
                    {newMed.start_date || 'Select Start Date'}
                  </Text>
                </View>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={selectedStartDate}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="calendar" size={20} color="#1971c2" />
                  <Text style={styles.dateTimeText}>
                    {newMed.end_date || 'Select End Date'}
                  </Text>
                </View>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={selectedEndDate}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedication}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Medical History Modal */}
        <Modal visible={historyModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Medical History</Text>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                  <IconSymbol name="xmark" size={20} color="#adb5bd" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Type *</Text>
              <ScrollView style={styles.typeSelector} horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeGrid}>
                  {historyTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newHistory.type === type && styles.typeOptionSelected
                      ]}
                      onPress={() => setNewHistory({ ...newHistory, type })}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        newHistory.type === type && styles.typeOptionTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                placeholder="Enter title"
                value={newHistory.title}
                onChangeText={(text) =>
                  setNewHistory({ ...newHistory, title: text })
                }
                style={styles.input}
                placeholderTextColor="#74c0fc"
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                placeholder="Enter description"
                value={newHistory.description}
                onChangeText={(text) =>
                  setNewHistory({ ...newHistory, description: text })
                }
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                placeholderTextColor="#74c0fc"
              />

              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowHistoryDatePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="calendar" size={20} color="#1971c2" />
                  <Text style={styles.dateTimeText}>
                    {newHistory.date_recorded || 'Select Date'}
                  </Text>
                </View>
              </TouchableOpacity>
              {showHistoryDatePicker && (
                <DateTimePicker
                  value={selectedHistoryDate}
                  mode="date"
                  display="default"
                  onChange={onHistoryDateChange}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setHistoryModalVisible(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedicalHistory}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Medicine Effects */}
      
        <TouchableOpacity
            style={[styles.card, styles.medicineCard]}
            onPress={() => navigation.navigate('medicine/medicineSideEffects')}
          >
            <LinearGradient
              colors={['#228be6', '#1971c2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.medicineGradient}
            >
              <View style={styles.medicineContent}>
                  <View>
                  <Text style={styles.medicineTitle}>Learn About Drug Interactions</Text>
                  <Text style={styles.medicineDescription}>
                    Understand potential medication interactions and side effects.
                  </Text>
                  </View>
                <View style={styles.medicineIconContainer}>
                  <IconSymbol name="bubble.right.fill" size={28} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        {/* Medicine Effects */}
        <TouchableOpacity
            style={[styles.card, styles.medicineCard]}
            onPress={() => navigation.navigate('medicine/medicineConflicts')}
          >
            <LinearGradient
              colors={['#93c9f5', '#4faeff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.medicineGradient}
            >
                <View style={styles.medicineContent}>
                  <View>
                  <Text style={styles.medicineTitle}>Verify Medication Compatibility</Text>
                  <Text style={styles.medicineDescription}>
                  Identify potential conflicts between your prescribed medications.
                  </Text>
                  </View>
                <View style={styles.medicineIconContainer}>
                  <IconSymbol name="bubble.right.fill" size={28} color="#ffffff" />
                </View>
                </View>
            </LinearGradient>
          </TouchableOpacity>
     
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
    paddingBottom: 20,
  },
  headerContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c7ed6',
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
  headerSubtitle: {
    fontSize: 16,
    color: '#4dabf7',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1971c2',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#339af0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  medicationTime: {
    backgroundColor: '#e7f5ff',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1971c2',
    marginTop: 4,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1971c2',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#74c0fc',
    marginTop: 4,
  },
  notesText: {
    color: '#adb5bd',
    fontSize: 13,
    marginTop: 4,
  },
  checkButton: {
    backgroundColor: '#339af0',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#1971c2',
    fontWeight: '500',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#74c0fc',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1971c2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7f5ff',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyTypeContainer: {
    flex: 1,
  },
  historyTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  historyTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    color: '#74c0fc',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1971c2',
    marginBottom: 8,
  },
  historyDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 113, 194, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
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
  },
  input: {
    backgroundColor: '#e7f5ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1971c2',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    color: '#74c0fc',
    marginBottom: 6,
    fontWeight: '500',
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  typeOption: {
    backgroundColor: '#e7f5ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  typeOptionSelected: {
    backgroundColor: '#339af0',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: '#ffffff',
  },
  dateTimeButton: {
    backgroundColor: '#e7f5ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1971c2',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  medicineCard: {
    padding: 0,
    overflow: 'hidden',
  },
  medicineGradient: {
    borderRadius: 16,
  },
  medicineContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  medicineDescription: {
    fontSize: 14,
    color: '#e7f5ff',
    maxWidth: '90%',
  },
  medicineIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 