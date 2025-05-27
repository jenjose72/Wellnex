import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

export default function SOSScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
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
    })();
  }, []);

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

  const sendSOS = () => {
    Alert.alert(
      'SOS Activated',
      'Emergency services have been notified and your emergency contacts have been alerted with your location.',
      [{ text: 'OK' }]
    );
    
    // In a real app, you would:
    // 1. Call emergency services
    // 2. Send SMS with location to emergency contacts
    // 3. Sound an alarm if enabled
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
          <IconSymbol size={24} name="chevron.left" color="#333" />
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
        >
          <View style={styles.sosInnerCircle}>
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.sosHelpText}>
          Press the button in case of emergency
        </Text>
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
});