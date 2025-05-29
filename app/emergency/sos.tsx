import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EmergencyContact = {
  id: string;
  name: string;
  phone_number: string;
  relation: string;
};

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    shareLocation: true,
    sendSMS: true,
    callEmergency: true,
    soundAlarm: false,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
      
      // Fetch emergency contacts
      if (user) {
        fetchEmergencyContacts();
      }
    })();
  }, [user]);

  // Fetch emergency contacts from the database
  const fetchEmergencyContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setEmergencyContacts(data || []);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will initiate an emergency SOS call and notify your emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'YES, Send SOS', style: 'destructive', onPress: () => sendSOS() }
      ]
    );
  };

  const sendSOS = async () => {
    setIsLoading(true);
    
    try {
      // 1. Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'SMS Not Available',
          'SMS messaging is not available on this device.'
        );
        return;
      }
      
      // 2. Get current location if permission is granted and setting is enabled
      let locationText = "Location not available";
      if (locationPermission && settings.shareLocation && location) {
        const { latitude, longitude } = location.coords;
        locationText = `Location: https://maps.google.com/?q=${latitude},${longitude}`;
        
        // Try to get address if possible
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          if (addresses && addresses.length > 0) {
            const address = addresses[0];
            const addressComponents = [
              address.name,
              address.street,
              address.city,
              address.region,
              address.postalCode,
              address.country
            ].filter(Boolean);
            
            if (addressComponents.length > 0) {
              locationText += `\nAddress: ${addressComponents.join(', ')}`;
            }
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
      }
      
      // 3. Compose emergency message
      const messageBody = `EMERGENCY SOS ALERT: I need immediate help! ${locationText}`;
      
      // 4. Send SMS if enabled and we have contacts
      if (settings.sendSMS && emergencyContacts.length > 0) {
        // Get array of phone numbers
        const phoneNumbers = emergencyContacts.map(contact => contact.phone_number);
        
        // Send the SMS
        const { result } = await SMS.sendSMSAsync(
          phoneNumbers,
          messageBody
        );
        
        if (result === 'sent') {
          console.log('SMS sent successfully');
        } else {
          console.log('SMS sending canceled or failed', result);
        }
      } else if (settings.sendSMS && emergencyContacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'You have no emergency contacts set up. Would you like to add some now?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Add Contacts', onPress: () => router.push('/emergency/contacts') }
          ]
        );
        return;
      }
      
      // 5. Call emergency services if enabled
      if (settings.callEmergency) {
        // This would typically open the phone dialer with emergency number
        // For safety reasons, we'll just show this in an alert instead of auto-dialing
        Alert.alert(
          'Calling Emergency Services',
          'Would you like to call emergency services now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call Emergency',
              onPress: () => {
                Linking.openURL('tel:108'); // Use your country's emergency number
              }
            }
          ]
        );
      }
      
      // 6. Play alarm sound if enabled
      if (settings.soundAlarm) {
        // This would play an alarm sound
        // Implementation would depend on your audio library
        // For example, with expo-av:
        // const soundObject = new Audio.Sound();
        // await soundObject.loadAsync(require('@/assets/sounds/alarm.mp3'));
        // await soundObject.playAsync();
      }
      
      // Show success alert
      Alert.alert(
        'SOS Activated',
        `Emergency alert has been sent to ${emergencyContacts.length} contact${emergencyContacts.length !== 1 ? 's' : ''}.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error sending SOS:', error);
      Alert.alert(
        'SOS Error',
        'There was a problem sending your emergency alert. Please try again or call emergency services directly.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handleRequestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status === 'granted') {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.sosContainer}>
        <View style={styles.locationStatus}>
          {locationPermission ? (
            <Text style={styles.locationStatusText}>
              <IconSymbol size={16} name="location.fill" color="#0084ff" /> Location: Available
            </Text>
          ) : (
            <TouchableOpacity style={styles.locationPermissionButton} onPress={handleRequestLocation}>
              <Text style={styles.locationPermissionText}>
                <IconSymbol size={16} name="location" color="#ff3b30" /> Enable Location
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={handleSOS}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <View style={styles.sosInnerCircle}>
            {isLoading ? (
              <ActivityIndicator color="#ff3b30" size="large" />
            ) : (
              <Text style={styles.sosText}>SOS</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.sosHelpText}>
          Press the button in case of emergency
        </Text>
        
        {emergencyContacts.length === 0 && (
          <TouchableOpacity 
            style={styles.addContactsButton}
            onPress={() => router.push('/emergency/contacts')}
          >
            <Text style={styles.addContactsText}>Add Emergency Contacts</Text>
            <IconSymbol size={16} name="chevron.right" color="#0084ff" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Emergency Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Share Location</Text>
            <Text style={styles.settingDescription}>Include your location data with emergency alerts</Text>
          </View>
          <Switch
            value={settings.shareLocation}
            onValueChange={() => toggleSetting('shareLocation')}
            trackColor={{ false: '#e0e0e0', true: '#b3d9ff' }}
            thumbColor={settings.shareLocation ? '#0084ff' : '#f5f5f5'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Send SMS</Text>
            <Text style={styles.settingDescription}>Automatically send SMS to emergency contacts</Text>
          </View>
          <Switch
            value={settings.sendSMS}
            onValueChange={() => toggleSetting('sendSMS')}
            trackColor={{ false: '#e0e0e0', true: '#b3d9ff' }}
            thumbColor={settings.sendSMS ? '#0084ff' : '#f5f5f5'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Call Emergency Services</Text>
            <Text style={styles.settingDescription}>Automatically call 911/emergency services</Text>
          </View>
          <Switch
            value={settings.callEmergency}
            onValueChange={() => toggleSetting('callEmergency')}
            trackColor={{ false: '#e0e0e0', true: '#b3d9ff' }}
            thumbColor={settings.callEmergency ? '#0084ff' : '#f5f5f5'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Sound Alarm</Text>
            <Text style={styles.settingDescription}>Play a loud alarm when SOS is activated</Text>
          </View>
          <Switch
            value={settings.soundAlarm}
            onValueChange={() => toggleSetting('soundAlarm')}
            trackColor={{ false: '#e0e0e0', true: '#b3d9ff' }}
            thumbColor={settings.soundAlarm ? '#0084ff' : '#f5f5f5'}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.contactsButton}
          onPress={() => router.push('/emergency/contacts')}
        >
          <IconSymbol size={20} name="person.crop.circle.fill" color="#0084ff" />
          <Text style={styles.contactsButtonText}>Manage Emergency Contacts</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  locationStatus: {
    marginBottom: 20,
  },
  locationStatusText: {
    fontSize: 14,
    color: '#0084ff',
    fontWeight: '500',
  },
  locationPermissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffebeb',
    borderRadius: 20,
  },
  locationPermissionText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '500',
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  sosInnerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
  sosText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff3b30',
  },
  sosHelpText: {
    marginTop: 24,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  contactsButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
  },
  contactsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0084ff',
  },
  addContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#e6f2ff',
    borderRadius: 20,
  },
  addContactsText: {
    color: '#0084ff',
    fontWeight: '600',
    marginRight: 4,
  }
});