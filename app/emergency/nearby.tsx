import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

// Mock clinic data (in a real app, this would come from an API)
const mockClinics = [
  {
    id: '1',
    name: 'City General Hospital',
    distance: '0.8',
    address: '123 Main St, City Center',
    phone: '(123) 456-7890',
    open: true,
    type: 'hospital',
    wait: '15',
    lat: 40.712776,
    lng: -74.005974
  },
  {
    id: '2',
    name: 'Urgent Care Clinic',
    distance: '1.2',
    address: '456 Oak Ave, East Side',
    phone: '(123) 555-1212',
    open: true,
    type: 'urgent',
    wait: '25',
    lat: 40.718234,
    lng: -73.998564
  },
  {
    id: '3',
    name: 'Family Medical Center',
    distance: '2.1',
    address: '789 Pine St, West End',
    phone: '(123) 987-6543',
    open: false,
    type: 'clinic',
    wait: '0',
    lat: 40.708765,
    lng: -74.015432
  },
  {
    id: '4',
    name: 'Children\'s Hospital',
    distance: '3.5',
    address: '101 Maple Dr, Northside',
    phone: '(123) 222-3333',
    open: true,
    type: 'hospital',
    wait: '30',
    lat: 40.722543,
    lng: -73.987654
  },
  {
    id: '5',
    name: 'Emergency Medical Center',
    distance: '4.2',
    address: '202 Elm St, Southside',
    phone: '(123) 444-5555',
    open: true,
    type: 'emergency',
    wait: '10',
    lat: 40.702234,
    lng: -74.012345
  }
];

export default function NearbyScreen() {
  const router = useRouter();
  const webViewRef = useRef(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [clinics, setClinics] = useState(mockClinics);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // This HTML with Leaflet would be injected into the WebView
  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; }
    html, body, #map { height: 100%; width: 100%; }
    .marker-hospital { background-color: #0084ff; }
    .marker-urgent { background-color: #ff9500; }
    .marker-emergency { background-color: #ff3b30; }
    .marker-clinic { background-color: #34c759; }
    .marker-user { background-color: #007aff; }
    .marker-label { color: white; font-weight: bold; text-align: center; line-height: 24px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize the map
    const map = L.map('map').setView([40.712776, -74.005974], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create custom icon for clinics
    function createClinicIcon(type) {
      return L.divIcon({
        className: 'marker-' + type,
        html: '<div class="marker-label">+</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    }
    
    // Create user location icon
    const userIcon = L.divIcon({
      className: 'marker-user',
      html: '<div class="marker-label">●</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // Add user location marker
    const userMarker = L.marker([40.712776, -74.005974], {icon: userIcon}).addTo(map);
    
    // Add clinic markers
    const clinics = ${JSON.stringify(mockClinics)};
    clinics.forEach(clinic => {
      const clinicIcon = createClinicIcon(clinic.type);
      const marker = L.marker([clinic.lat, clinic.lng], {icon: clinicIcon})
        .addTo(map)
        .bindPopup(
          '<b>' + clinic.name + '</b><br>' +
          clinic.address + '<br>' +
          'Phone: ' + clinic.phone + '<br>' +
          (clinic.open ? '<span style="color:green">Open</span>' : '<span style="color:red">Closed</span>')
        );
    });
    
    // Function to update user location
    window.updateUserLocation = function(lat, lng) {
      userMarker.setLatLng([lat, lng]);
      map.setView([lat, lng], 13);
    };
  </script>
</body>
</html>
  `;
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        
        // In a real app, you'd fetch nearby clinics based on location
        // For now, we'll just simulate a loading delay
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } else {
        setIsLoading(false);
      }
    })();
  }, []);
  
  const handleRequestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    
    if (status === 'granted') {
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (location && webViewRef.current) {
      const { latitude, longitude } = location.coords;
      const script = `window.updateUserLocation(${latitude}, ${longitude});`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [location]);
  
  const filteredClinics = clinics.filter(clinic => 
    (filterType === 'all' || clinic.type === filterType) &&
    (clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     clinic.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Medical Facilities</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol size={20} name="magnifyingglass" color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search facilities..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <IconSymbol size={20} name="xmark.circle.fill" color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'all' ? styles.filterChipActive : null]} 
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, filterType === 'all' ? styles.filterChipTextActive : null]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'hospital' ? styles.filterChipActive : null]} 
            onPress={() => setFilterType('hospital')}
          >
            <Text style={[styles.filterChipText, filterType === 'hospital' ? styles.filterChipTextActive : null]}>Hospitals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'urgent' ? styles.filterChipActive : null]} 
            onPress={() => setFilterType('urgent')}
          >
            <Text style={[styles.filterChipText, filterType === 'urgent' ? styles.filterChipTextActive : null]}>Urgent Care</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'emergency' ? styles.filterChipActive : null]} 
            onPress={() => setFilterType('emergency')}
          >
            <Text style={[styles.filterChipText, filterType === 'emergency' ? styles.filterChipTextActive : null]}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'clinic' ? styles.filterChipActive : null]} 
            onPress={() => setFilterType('clinic')}
          >
            <Text style={[styles.filterChipText, filterType === 'clinic' ? styles.filterChipTextActive : null]}>Clinics</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.mapContainer}>
        {!locationPermission ? (
          <View style={styles.permissionContainer}>
            <IconSymbol size={40} name="location.slash.fill" color="#999" />
            <Text style={styles.permissionText}>Location access is required to find nearby clinics</Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={handleRequestLocation}
            >
              <Text style={styles.permissionButtonText}>Grant Location Access</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084ff" />
            <Text style={styles.loadingText}>Finding nearby facilities...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: leafletHTML }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoad={() => {
              if (location) {
                const { latitude, longitude } = location.coords;
                const script = `window.updateUserLocation(${latitude}, ${longitude});`;
                webViewRef.current.injectJavaScript(script);
              }
            }}
          />
        )}
      </View>
      
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          {filteredClinics.length} {filteredClinics.length === 1 ? 'Facility' : 'Facilities'} Found
        </Text>
        
        <ScrollView>
          {filteredClinics.map(clinic => (
            <TouchableOpacity 
              key={clinic.id} 
              style={styles.clinicCard}
              onPress={() => {
                if (webViewRef.current) {
                  const script = `
                    var marker = markers['${clinic.id}'];
                    if (marker) {
                      marker.openPopup();
                      map.setView([${clinic.lat}, ${clinic.lng}], 15);
                    }
                  `;
                  webViewRef.current.injectJavaScript(script);
                }
              }}
            >
              <View style={[styles.clinicTypeIndicator, { 
                backgroundColor: 
                  clinic.type === 'hospital' ? '#0084ff' : 
                  clinic.type === 'urgent' ? '#ff9500' : 
                  clinic.type === 'emergency' ? '#ff3b30' : '#34c759'
              }]} />
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                <Text style={styles.clinicAddress}>{clinic.address}</Text>
                <View style={styles.clinicStats}>
                  <Text style={styles.clinicDistance}>{clinic.distance} mi</Text>
                  {clinic.open ? (
                    <Text style={styles.clinicOpen}>Open • {clinic.wait} min wait</Text>
                  ) : (
                    <Text style={styles.clinicClosed}>Closed</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <IconSymbol size={20} name="phone.fill" color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e6f2ff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#0084ff',
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#e9ecef',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },
  permissionButton: {
    backgroundColor: '#0084ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  clinicCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  clinicTypeIndicator: {
    width: 8,
    height: '80%',
    borderRadius: 4,
    marginRight: 12,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  clinicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicDistance: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  clinicOpen: {
    fontSize: 14,
    color: '#34c759',
  },
  clinicClosed: {
    fontSize: 14,
    color: '#ff3b30',
  },
  callButton: {
    backgroundColor: '#0084ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});