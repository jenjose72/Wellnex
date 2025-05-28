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
import { format, parse, addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import styles from '@/styles/medication';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

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

  // Get appropriate icon for medical history type
  const getHistoryTypeIcon = (type) => {
    switch(type) {
      case 'Diagnosis':
        return <MaterialIcons name="medical-services" size={18} color="#fff" />;
      case 'Surgery':
        return <Ionicons name="cut-sharp" size={18} color="#fff" />;
      case 'Allergy':
        return <FontAwesome5 name="allergies" size={16} color="#fff" />;
      case 'Vaccination':
        return <FontAwesome5 name="syringe" size={16} color="#fff" />;
      case 'Lab Result':
        return <MaterialIcons name="science" size={18} color="#fff" />;
      case 'Treatment':
        return <FontAwesome5 name="hand-holding-medical" size={16} color="#fff" />;
      case 'Emergency':
        return <Ionicons name="warning" size={18} color="#fff" />;
      case 'Other':
        return <MaterialCommunityIcons name="file-document-outline" size={18} color="#fff" />;
      default:
        return <MaterialIcons name="event-note" size={18} color="#fff" />;
    }
  };

  // Get appropriate icon for repeat pattern
  const getRepeatPatternIcon = (pattern) => {
    switch(pattern) {
      case 'Daily':
        return <MaterialCommunityIcons name="calendar-refresh" size={16} color="#228be6" />;
      case 'Weekly':
        return <MaterialCommunityIcons name="calendar-week" size={16} color="#228be6" />;
      case 'Monthly':
        return <MaterialCommunityIcons name="calendar-month" size={16} color="#228be6" />;
      case 'As needed':
        return <Ionicons name="timer-outline" size={16} color="#228be6" />;
      default:
        return null;
    }
  };

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

  // Fixed function to format time from 12-hour to 24-hour format
  const formatTimeFor24Hour = (timeStr) => {
    if (!timeStr) return null;
    
    try {
      // Handle "hh:mm a" format (like "08:30 AM")
      if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        const timeParts = timeStr.match(/(\d+):(\d+)\s*(am|pm|AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const period = timeParts[3].toLowerCase();
          
          // Convert to 24-hour format
          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
      
      // If already in HH:MM format, validate and return
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (timeRegex.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // If we can't parse it, return a default time
      console.warn(`Could not parse time format: ${timeStr}, using default 08:00`);
      return "08:00";
    } catch (error) {
      console.error('Error formatting time:', error);
      return "08:00"; // Safe default
    }
  };

  // Fixed function to calculate the next scheduled time
  const calculateNextScheduledTime = (timeStr, repeatPattern) => {
    if (!timeStr || !repeatPattern) return null;
    
    try {
      const now = new Date();
      const timeFormatted = formatTimeFor24Hour(timeStr);
      
      if (!timeFormatted) return null;
      
      const [hoursStr, minutesStr] = timeFormatted.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      // Validate hours and minutes to avoid RangeError
      if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
        console.warn(`Invalid time components: hours=${hours}, minutes=${minutes}`);
        return null;
      }
      
      // Create a date object for today with the medication time
      let nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today and it's a recurring med, schedule for next occurrence
      if (isBefore(nextDate, now) && repeatPattern !== 'As needed') {
        switch (repeatPattern) {
          case 'Daily':
            nextDate = addDays(nextDate, 1);
            break;
          case 'Weekly':
            nextDate = addDays(nextDate, 7);
            break;
          case 'Monthly':
            nextDate = addMonths(nextDate, 1);
            break;
        }
      }
      
      return nextDate;
    } catch (error) {
      console.error('Error calculating next scheduled time:', error);
      // Return a safe default time - tomorrow at 8 AM
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(8, 0, 0, 0);
      return tomorrow;
    }
  };

  // Fixed addMedication function
  const addMedication = async () => {
    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        Alert.alert('Authentication Error', 'User not logged in.');
        return;
      }

      // Validate required fields
      if (!newMed.medicine_name || !newMed.time || !newMed.repeat_pattern) {
        Alert.alert('Validation Error', 'Please fill in required fields (Name, Time, and Repeat Pattern).');
        return;
      }

      // Format time safely and handle potential errors
      let timeFormatted;
      let nextScheduled;
      
      try {
        timeFormatted = formatTimeFor24Hour(newMed.time);
        nextScheduled = calculateNextScheduledTime(newMed.time, newMed.repeat_pattern);
      } catch (timeError) {
        console.error('Error processing time:', timeError);
        // Use safe defaults
        timeFormatted = "08:00";
        const tomorrow = addDays(new Date(), 1);
        tomorrow.setHours(8, 0, 0, 0);
        nextScheduled = tomorrow;
      }
      
      // Create a clean object without any undefined or empty string values
      const medicationData = {
        medicine_name: newMed.medicine_name,
        dosage: newMed.dosage || null,
        time: newMed.time,
        repeat_pattern: newMed.repeat_pattern,
        notes: newMed.notes || null,
        start_date: newMed.start_date || null,
        end_date: newMed.end_date || null,
        user_id: data.user.id,
        time_numeric: timeFormatted,
        next_scheduled: nextScheduled ? nextScheduled.toISOString() : null,
      };
      
      console.log('Sending medication data:', medicationData);
      
      const { error } = await supabase
        .from('medication_reminders')
        .insert([medicationData]);

      if (error) {
        console.error('Supabase error:', error);
        Alert.alert('Error', `Failed to add medication: ${error.message}`);
      } else {
        Alert.alert('Success', 'Medication added successfully!');
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
        await fetchMedications();
        try {
          await scheduleMedicationNotification(newMed);
        } catch (notificationError) {
          console.error('Failed to schedule notification:', notificationError);
        }
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert('Error', 'An unexpected error occurred while adding medication.');
    }
  };

  const addMedicalHistory = async () => {
    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        Alert.alert('Authentication Error', 'User not logged in.');
        return;
      }

      if (!newHistory.type || !newHistory.title || !newHistory.date_recorded) {
        Alert.alert('Validation Error', 'Please fill in required fields (Type, Title, and Date).');
        return;
      }

      const historyWithUser = {
        ...newHistory,
        user_id: data.user.id,
      };

      const { error } = await supabase
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
    } catch (e) {
      console.error('Unexpected error adding medical history:', e);
      Alert.alert('Error', 'An unexpected error occurred while adding medical history.');
    }
  };

  // Enhanced deleteMedicalHistory function with better error handling
  const deleteMedicalHistory = async (historyId, historyTitle) => {
    try {
      Alert.alert(
        'Delete Medical Record',
        `Are you sure you want to delete "${historyTitle}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Show loading indicator or disable UI if needed
                
                const { error } = await supabase
                  .from('medical_history')
                  .delete()
                  .eq('id', historyId);

                if (error) {
                  console.error('Error deleting medical history:', error);
                  Alert.alert('Error', `Failed to delete record: ${error.message}`);
                } else {
                  // Success - update the UI
                  await fetchMedicalHistory();
                  Alert.alert('Success', 'Medical record deleted successfully');
                }
              } catch (deleteError) {
                console.error('Unexpected error during deletion:', deleteError);
                Alert.alert('Error', 'An unexpected error occurred while deleting the record.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (e) {
      console.error('Error in delete dialog:', e);
    }
  };

  // Fixed markMedicationAsTaken function
  const markMedicationAsTaken = async (med) => {
    try {
      // Calculate when the next dose should be scheduled based on repeat pattern
      let nextScheduled = null;
      
      if (med.repeat_pattern && med.repeat_pattern !== 'As needed') {
        try {
          // Get current time as the base for the next scheduled time
          const now = new Date();
          
          // Extract hours and minutes from the time_numeric field if available, otherwise from time
          let hours = 8; // Default to 8 AM if time format can't be parsed
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
          
          // Validate hours and minutes
          if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
            throw new Error(`Invalid time components: hours=${hours}, minutes=${minutes}`);
          }
          
          // Set base time for next dose to today with the same time
          nextScheduled = new Date();
          nextScheduled.setHours(hours, minutes, 0, 0);
          
          // Calculate next scheduled date based on repeat pattern
          switch (med.repeat_pattern) {
            case 'Daily':
              // If it's already past the time today, schedule for tomorrow
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
          // If there's an error with the time, set next schedule to tomorrow at 8 AM as a fallback
          nextScheduled = addDays(new Date(), 1);
          nextScheduled.setHours(8, 0, 0, 0);
        }
      }
      
      // Update medication with new next_scheduled date and last_taken time
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
        fetchMedications();
        Alert.alert('Success', `${med.medicine_name} marked as taken! Next dose scheduled.`);
      }
    } catch (e) {
      console.error('Error in markMedicationAsTaken:', e);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Fixed scheduleMedicationNotification function to handle errors better
  const scheduleMedicationNotification = async (med) => {
    try {
      if (!med.time) {
        console.warn('No time specified for notification');
        return;
      }
      
      let medTime;
      try {
        // Try to parse the time
        medTime = parse(med.time, 'hh:mm a', new Date());
        
        // If the time is invalid, create a default time
        if (isNaN(medTime.getTime())) throw new Error('Invalid time');
      } catch (parseError) {
        console.warn('Error parsing time for notification:', parseError);
        // Default to 8 AM tomorrow
        medTime = new Date();
        medTime.setHours(8, 0, 0, 0);
        medTime = addDays(medTime, 1);
      }

      const now = new Date();

      if (medTime < now) {
        medTime.setDate(medTime.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
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
      
      console.log(`Scheduled notification with ID: ${notificationId}`);
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
          <View style={styles.headerTitleWrapper}>
            <MaterialIcons name="health-and-safety" size={32} color="#1971c2" style={styles.headerIcon} />
            <View>
              <Text style={styles.headerTitle}>Health Management</Text>
              <Text style={styles.headerSubtitle}>Track medications and medical history</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Medications Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <FontAwesome5 name="pills" size={20} color="#1971c2" />
              <Text style={styles.sectionTitle}>Today's Medications</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="prescription-bottle" size={36} color="#74c0fc" />
              <Text style={styles.emptyStateText}>No medications scheduled</Text>
              <Text style={styles.emptyStateSubtext}>Add your medications to get reminders</Text>
            </View>
          ) : (
            medications.map((med) => {
              // Format the next scheduled date for display
              let nextDoseText = 'Not scheduled';
              let isOverdue = false;
              
              if (med.next_scheduled) {
                try {
                  const nextDate = parseISO(med.next_scheduled);
                  const now = new Date();
                  isOverdue = isBefore(nextDate, now);
                  
                  // Show date only if it's not today
                  const isToday = nextDate.getDate() === now.getDate() && 
                                  nextDate.getMonth() === now.getMonth() &&
                                  nextDate.getFullYear() === now.getFullYear();
                                  
                  if (isToday) {
                    nextDoseText = `Today at ${med.time}`;
                  } else {
                    // Format the date to a user-friendly string
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
                      <Ionicons name="time" size={18} color="#1971c2" />
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
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          "Delete Medication",
                          `Are you sure you want to delete ${med.medicine_name}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Delete", 
                              style: "destructive",
                              onPress: async () => {
                                const { error } = await supabase
                                  .from('medication_reminders')
                                  .delete()
                                  .eq('id', med.id);
                                
                                if (error) {
                                  console.error(error);
                                  Alert.alert('Error', 'Failed to delete medication');
                                } else {
                                  fetchMedications();
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#339af0" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.checkButton]}
                      onPress={() => {
                        Alert.alert(
                          "Mark as Taken",
                          `Mark ${med.medicine_name} as taken?`,
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

        {/* Medical History Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="history-edu" size={22} color="#1971c2" />
              <Text style={styles.sectionTitle}>Medical History</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setHistoryModalVisible(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medicalHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={36} color="#74c0fc" />
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
                      {getHistoryTypeIcon(history.type)}
                      <Text style={styles.historyTypeText}>{history.type}</Text>
                    </View>
                    <View style={styles.historyDateContainer}>
                      <Ionicons name="calendar" size={14} color="#74c0fc" />
                      <Text style={styles.historyDate}>{history.date_recorded}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteMedicalHistory(history.id, history.title)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#339af0" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.historyTitle}>{history.title}</Text>
                {history.description ? (
                  <View style={styles.descriptionContainer}>
                    <MaterialCommunityIcons name="text" size={16} color="#495057" style={styles.descriptionIcon} />
                    <Text style={styles.historyDescription}>{history.description}</Text>
                  </View>
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
                <View style={styles.modalTitleContainer}>
                  <FontAwesome5 name="prescription-bottle-alt" size={20} color="#1971c2" style={styles.modalIcon} />
                  <Text style={styles.modalTitle}>Add Medication</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#adb5bd" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="medication" size={20} color="#1971c2" style={styles.inputIcon} />
                <TextInput
                  placeholder="Medicine Name"
                  value={newMed.medicine_name}
                  onChangeText={(text) =>
                    setNewMed({ ...newMed, medicine_name: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#74c0fc"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="pill" size={20} color="#1971c2" style={styles.inputIcon} />
                <TextInput
                  placeholder="Dosage (e.g., 500mg • 1 Tablet)"
                  value={newMed.dosage}
                  onChangeText={(text) =>
                    setNewMed({ ...newMed, dosage: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#74c0fc"
                />
              </View>
              
              {/* Repeat Pattern Selection */}
              <Text style={styles.inputLabel}>
                <MaterialCommunityIcons name="repeat" size={18} color="#74c0fc" style={{marginRight: 6}} />
                Repeat Pattern
              </Text>
              <View style={styles.repeatPatternContainer}>
                {['Daily', 'Weekly', 'Monthly', 'As needed'].map((pattern) => (
                  <TouchableOpacity
                    key={pattern}
                    style={[
                      styles.repeatPatternOption,
                      newMed.repeat_pattern === pattern && styles.repeatPatternSelected
                    ]}
                    onPress={() => setNewMed({ ...newMed, repeat_pattern: pattern })}
                  >
                    {newMed.repeat_pattern === pattern ? (
                      <MaterialCommunityIcons 
                        name={pattern === 'Daily' ? 'calendar-refresh' : 
                              pattern === 'Weekly' ? 'calendar-week' : 
                              pattern === 'Monthly' ? 'calendar-month' : 'timer-outline'} 
                        size={16} 
                        color="#fff" 
                        style={{marginRight: 4}} 
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.repeatPatternText,
                        newMed.repeat_pattern === pattern && styles.repeatPatternTextSelected
                      ]}
                    >
                      {pattern}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="note-text" size={20} color="#1971c2" style={styles.inputIcon} />
                <TextInput
                  placeholder="Notes (optional)"
                  value={newMed.notes}
                  onChangeText={(text) =>
                    setNewMed({ ...newMed, notes: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#74c0fc"
                />
              </View>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <Ionicons name="time" size={20} color="#1971c2" />
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
                  <MaterialCommunityIcons name="calendar-start" size={20} color="#1971c2" />
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
                  <MaterialCommunityIcons name="calendar-end" size={20} color="#1971c2" />
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
                  <Ionicons name="close-circle" size={18} color="#74c0fc" style={{marginRight: 4}} />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedication}
                  style={styles.saveButton}
                >
                  <Ionicons name="save" size={18} color="#fff" style={{marginRight: 4}} />
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
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="history-edu" size={24} color="#1971c2" style={styles.modalIcon} />
                  <Text style={styles.modalTitle}>Add Medical History</Text>
                </View>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#adb5bd" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                <MaterialIcons name="category" size={18} color="#74c0fc" style={{marginRight: 4}} />
                Type *
              </Text>
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
                      {newHistory.type === type && getHistoryTypeIcon(type)}
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

              <Text style={styles.inputLabel}>
                <MaterialIcons name="title" size={18} color="#74c0fc" style={{marginRight: 4}} />
                Title *
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="short-text" size={20} color="#1971c2" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter title"
                  value={newHistory.title}
                  onChangeText={(text) =>
                    setNewHistory({ ...newHistory, title: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#74c0fc"
                />
              </View>

              <Text style={styles.inputLabel}>
                <MaterialCommunityIcons name="text-box" size={18} color="#74c0fc" style={{marginRight: 4}} />
                Description (optional)
              </Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="text" size={20} color="#1971c2" style={[styles.inputIcon, {alignSelf: 'flex-start', marginTop: 12}]} />
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
              </View>

              <Text style={styles.inputLabel}>
                <MaterialIcons name="event" size={18} color="#74c0fc" style={{marginRight: 4}} />
                Date *
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowHistoryDatePicker(true)}
              >
                <View style={styles.dateTimeWrapper}>
                  <Ionicons name="calendar" size={20} color="#1971c2" />
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
                  <Ionicons name="close-circle" size={18} color="#74c0fc" style={{marginRight: 4}} />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addMedicalHistory}
                  style={styles.saveButton}
                >
                  <Ionicons name="save" size={18} color="#fff" style={{marginRight: 4}} />
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
                  <MaterialCommunityIcons name="pill" size={28} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        {/* Medicine Effects */}
        <TouchableOpacity
            style={[styles.card, styles.medicineCard]}
            onPress={() => navigation.navigate('medicine/MedicineConflicts')}
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
                  <MaterialCommunityIcons name="clipboard-alert" size={28} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
     
      </ScrollView>
    </SafeAreaView>
  );
}

