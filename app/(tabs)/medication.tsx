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

export default function MedicationScreen() {
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
      'Diagnosis': '#dc3545',
      'Surgery': '#fd7e14',
      'Allergy': '#ffc107',
      'Vaccination': '#28a745',
      'Lab Result': '#17a2b8',
      'Treatment': '#6f42c1',
      'Emergency': '#e83e8c',
      'Other': '#6c757d'
    };
    return colors[type] || '#6c757d';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Health Management</Text>
          <Text style={styles.headerSubtitle}>
            Track medications and manage medical history
          </Text>
        </View>

        {/* Medications Section */}
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Medications</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <IconSymbol size={20} name="plus" color="#fff" />
            </TouchableOpacity>
          </View>

          {medications.map((med) => (
            <View key={med.id} style={styles.medicationCard}>
              <View style={styles.medicationTime}>
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
                <IconSymbol size={20} name="checkmark" color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Medical History Section */}
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setHistoryModalVisible(true)}
            >
              <IconSymbol size={20} name="plus" color="#fff" />
            </TouchableOpacity>
          </View>

          {medicalHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No medical history records yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap + to add your first record</Text>
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
                    <IconSymbol size={16} name="trash" color="#dc3545" />
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
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Medication</Text>

              <TextInput
                placeholder="Medicine Name"
                value={newMed.medicine_name}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, medicine_name: text })
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Dosage (e.g., 500mg • 1 Tablet)"
                value={newMed.dosage}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, dosage: text })
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Repeat Pattern (e.g., daily)"
                value={newMed.repeat_pattern}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, repeat_pattern: text })
                }
                style={styles.input}
              />
              <TextInput
                placeholder="Notes (optional)"
                value={newMed.notes}
                onChangeText={(text) =>
                  setNewMed({ ...newMed, notes: text })
                }
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="time" size={20} color="#007bff" />
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
                  <IconSymbol name="calendar" size={20} color="#007bff" />
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
                  <IconSymbol name="calendar" size={20} color="#007bff" />
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
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedication}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Medical History Modal */}
        <Modal visible={historyModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Medical History</Text>

              <ScrollView style={styles.typeSelector}>
                <Text style={styles.typeSelectorLabel}>Type *</Text>
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

              <TextInput
                placeholder="Title *"
                value={newHistory.title}
                onChangeText={(text) =>
                  setNewHistory({ ...newHistory, title: text })
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Description (optional)"
                value={newHistory.description}
                onChangeText={(text) =>
                  setNewHistory({ ...newHistory, description: text })
                }
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowHistoryDatePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <IconSymbol name="calendar" size={20} color="#007bff" />
                  <Text style={styles.dateTimeText}>
                    {newHistory.date_recorded || 'Select Date *'}
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
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedicalHistory}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  headerContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  cardContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
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
  addButton: {
    backgroundColor: '#007bff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTime: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notesText: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  checkButton: {
    backgroundColor: '#28a745',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTypeContainer: {
    flex: 1,
  },
  historyTypeBadge: {
    paddingHorizontal: 8,
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
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    maxHeight: 120,
    marginBottom: 12,
  },
  typeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  typeOptionSelected: {
    backgroundColor: '#007bff',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  dateTimeButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 8,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    marginRight: 12,
  },
  cancelText: {
    color: '#777',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});