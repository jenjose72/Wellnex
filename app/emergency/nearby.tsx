import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Types for emergency places
type EmergencyPlace = {
  lat: number;
  lng: number;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'pharmacy';
  distance?: number;
};

type LocationState = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

export default function NearbyScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [emergencyPlaces, setEmergencyPlaces] = useState<EmergencyPlace[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const maxRetries = 3;

  // Generate dynamic HTML with current location
  const generateLeafletHTML = useCallback((initialLat: number, initialLng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
  <style>
    body { padding: 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    html, body, #map { height: 100%; width: 100%; overflow: hidden; }
    .marker-user {
      background-color: #007aff;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(0, 122, 255, 0.6);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 15px rgba(0, 122, 255, 0.6); }
      50% { box-shadow: 0 0 25px rgba(0, 122, 255, 0.9); }
      100% { box-shadow: 0 0 15px rgba(0, 122, 255, 0.6); }
    }
    .marker-hospital {
      background-color: #ff3b30;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-police {
      background-color: #5856d6;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-fire {
      background-color: #ff9500;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-pharmacy {
      background-color: #4cd964;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-selected {
      width: 18px;
      height: 18px;
      border: 3px solid white;
      transform: scale(1.2);
      z-index: 1000 !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .leaflet-popup-content {
      margin: 12px 16px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map, userMarker;
    const emergencyMarkers = {};
    
    try {
      // Initialize the map with current location
      map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        doubleClickZoom: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([${initialLat}, ${initialLng}], 14);
      
      // Add tile layer with better error handling
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        detectRetina: true,
        attribution: '© OpenStreetMap contributors'
      });
      
      tiles.addTo(map);
      
      // Create custom icons
      const userIcon = L.divIcon({
        className: 'marker-user',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11]
      });
      
      const hospitalIcon = L.divIcon({
        className: 'marker-hospital',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
      });
      
      const policeIcon = L.divIcon({
        className: 'marker-police',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
      });
      
      const fireIcon = L.divIcon({
        className: 'marker-fire',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
      });
      
      const pharmacyIcon = L.divIcon({
        className: 'marker-pharmacy',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
      });
      
      // Add user location marker
      userMarker = L.marker([${initialLat}, ${initialLng}], {icon: userIcon})
        .addTo(map)
        .bindPopup("<strong>📍 Your Current Location</strong>");
      
      // Function to calculate distance between two points
      function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      
      // Function to update user location
      window.updateUserLocation = function(lat, lng) {
        try {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
            map.setView([lat, lng], map.getZoom());
            userMarker.setPopupContent(
              "<strong>📍 Your Current Location</strong><br>" +
              "<small>Lat: " + lat.toFixed(6) + "<br>Lng: " + lng.toFixed(6) + "</small>"
            );
          }
        } catch (error) {
          console.error('Error updating user location:', error);
        }
      };
      
      // Function to add emergency places
      window.addEmergencyPlaces = function(places) {
        try {
          // Clear existing markers
          for (const id in emergencyMarkers) {
            map.removeLayer(emergencyMarkers[id]);
            delete emergencyMarkers[id];
          }
          
          if (!places || places.length === 0) {
            console.log('No emergency places to add');
            return;
          }
          
          // Add new markers
          places.forEach((place, index) => {
            let icon, emoji;
            switch(place.type) {
              case 'hospital': 
                icon = hospitalIcon; 
                emoji = '🏥';
                break;
              case 'police': 
                icon = policeIcon; 
                emoji = '👮';
                break;
              case 'fire_station': 
                icon = fireIcon; 
                emoji = '🚒';
                break;
              case 'pharmacy': 
                icon = pharmacyIcon; 
                emoji = '💊';
                break;
              default: 
                icon = hospitalIcon;
                emoji = '🏥';
            }
            
            const userLat = userMarker.getLatLng().lat;
            const userLng = userMarker.getLatLng().lng;
            const distance = calculateDistance(userLat, userLng, place.lat, place.lng);
            
            const placeId = 'place_' + index;
            
            const marker = L.marker([place.lat, place.lng], {icon})
              .addTo(map)
              .bindPopup(
                "<strong>" + emoji + " " + place.name + "</strong><br>" +
                "<small>Distance: " + distance.toFixed(1) + " km</small><br>" +
                "<small>Type: " + place.type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase()) + "</small>"
              );
              
            marker.on('click', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerSelected',
                  id: placeId
                }));
              }
            });
            
            emergencyMarkers[placeId] = marker;
          });
          
          console.log('Added', places.length, 'emergency places to map');
        } catch (error) {
          console.error('Error adding emergency places:', error);
        }
      };
      
      // Function to highlight a marker
      window.highlightMarker = function(id) {
        try {
          // Reset all markers first
          for (const key in emergencyMarkers) {
            const marker = emergencyMarkers[key];
            const icon = marker.getIcon();
            icon.options.className = icon.options.className.replace(' marker-selected', '');
            marker.setIcon(L.divIcon(icon.options));
          }
          
          // Highlight the selected marker
          if (id && emergencyMarkers[id]) {
            const marker = emergencyMarkers[id];
            marker.openPopup();
            map.setView(marker.getLatLng(), 15);
            
            const icon = marker.getIcon();
            if (!icon.options.className.includes('marker-selected')) {
              icon.options.className += ' marker-selected';
              marker.setIcon(L.divIcon(icon.options));
            }
          }
        } catch (error) {
          console.error('Error highlighting marker:', error);
        }
      };
      
      // Error handling for tiles
      tiles.on('tileerror', function(error) {
        console.log('Tile loading error:', error);
      });
      
      // Map ready notification
      map.whenReady(function() {
        console.log('Map is ready');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapReady'}));
        }
      });
      
    } catch (error) {
      console.error('Map initialization error:', error);
      document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Map failed to load. Please try again.</div>';
    }
  </script>
</body>
</html>
  `, []);

  // Function to find nearby emergency places using Nominatim
  const findNearbyEmergencyPlaces = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const radius = 30000; // 3km radius for better performance
      const categories = [
        { type: 'hospital', query: 'hospital', amenity: 'hospital' },
        { type: 'pharmacy', query: 'pharmacy', amenity: 'pharmacy' }
      ];
      
      const allPlaces: EmergencyPlace[] = [];
      
      for (const category of categories) {
        try {
          // Use Overpass API for better results
          const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"="${category.amenity}"](around:${radius},${lat},${lng});
              way["amenity"="${category.amenity}"](around:${radius},${lat},${lng});
              relation["amenity"="${category.amenity}"](around:${radius},${lat},${lng});
            );
            out center;
          `;
          
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': 'Wellnex/1.0.0 (Emergency Services App)',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: `data=${encodeURIComponent(overpassQuery)}`
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.elements) {
            data.elements.slice(0, 10).forEach((place: any) => { // Limit to 10 per category
              const placeLat = place.lat || place.center?.lat;
              const placeLng = place.lon || place.center?.lon;
              
              if (placeLat && placeLng) {
                const distance = calculateDistance(lat, lng, placeLat, placeLng);
                allPlaces.push({
                  lat: placeLat,
                  lng: placeLng,
                  name: place.tags?.name || `${category.type.replace('_', ' ')} near you`,
                  type: category.type as EmergencyPlace['type'],
                  distance: distance
                });
              }
            });
          }
          
          // Rate limiting - respect API limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error fetching ${category.type}:`, error);
        }
      }
      
      // Sort by distance and limit total results
      const sortedPlaces = allPlaces
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 30); // Limit to 30 total places
      
      setEmergencyPlaces(sortedPlaces);
      return sortedPlaces;
    } catch (error) {
      console.error('Error fetching emergency places:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get current location with retry logic
  const getCurrentLocation = useCallback(async (): Promise<LocationState | null> => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      
      return {
        coords: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // Retry with lower accuracy
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        try {
          const fallbackLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          return {
            coords: {
              latitude: fallbackLocation.coords.latitude,
              longitude: fallbackLocation.coords.longitude,
            }
          };
        } catch (fallbackError) {
          console.error('Fallback location error:', fallbackError);
        }
      }
      
      return null;
    }
  }, [retryCount]);

  // Initialize location and permissions
  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      try {
        setIsLoading(true);
        
        // Check if location services are enabled
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services to find nearby emergency services.',
            [{ text: 'OK' }]
          );
          setLocationPermission(false);
          return;
        }

        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (!isMounted) return;
        
        setLocationPermission(status === 'granted');
        
        if (status === 'granted') {
          const currentLocation = await getCurrentLocation();
          
          if (currentLocation && isMounted) {
            setLocation(currentLocation);
            // Load emergency places
            await findNearbyEmergencyPlaces(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude
            );
          }
        } else {
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to show nearby emergency services.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Location initialization error:', error);
        if (isMounted) {
          Alert.alert(
            'Location Error',
            'Unable to get your location. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
    };
  }, [getCurrentLocation, findNearbyEmergencyPlaces]);

  const handleRequestLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
          await findNearbyEmergencyPlaces(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
        }
      }
    } catch (error) {
      console.error('Location request error:', error);
      Alert.alert('Error', 'Unable to get location access. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update map when location changes
  useEffect(() => {
    if (location && webViewRef.current && mapLoaded) {
      const { latitude, longitude } = location.coords;
      const script = `
        try {
          if (typeof window.updateUserLocation === 'function') {
            window.updateUserLocation(${latitude}, ${longitude});
          }
        } catch(e) {
          console.error('Map update error:', e);
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [location, mapLoaded]);

  // Update emergency places on map
  useEffect(() => {
    if (emergencyPlaces.length > 0 && webViewRef.current && mapLoaded) {
      const script = `
        try {
          if (typeof window.addEmergencyPlaces === 'function') {
            window.addEmergencyPlaces(${JSON.stringify(emergencyPlaces)});
          }
        } catch(e) {
          console.error('Emergency places update error:', e);
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [emergencyPlaces, mapLoaded]);

  // Handle marker selection and highlight on map
  const handleSelectPlace = (index: number) => {
    const placeId = `place_${index}`;
    setSelectedPlaceId(placeId);
    
    if (webViewRef.current && mapLoaded) {
      const script = `
        try {
          if (typeof window.highlightMarker === 'function') {
            window.highlightMarker('${placeId}');
          }
        } catch(e) {
          console.error('Highlight marker error:', e);
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapLoaded(true);
      } else if (data.type === 'markerSelected') {
        setSelectedPlaceId(data.id);
        
        // Extract the index from the ID (format: 'place_X')
        const index = parseInt(data.id.split('_')[1], 10);
        if (!isNaN(index) && index >= 0 && index < emergencyPlaces.length) {
          // Scroll to the selected place in the list
          // Implementation would depend on your FlatList ref
        }
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  // Get initial coordinates for map
  const getInitialCoords = () => {
    if (location) {
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
    }
    // Fallback to coordinates
    return {
      lat: 8.5241,
      lng: 76.9366
    };
  };

  const initialCoords = getInitialCoords();

  // Get an appropriate icon for the emergency place type
  const getEmergencyTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'police':
        return '👮';
      case 'fire_station':
        return '🚒';
      case 'pharmacy':
        return '💊';
      default:
        return '📍';
    }
  };

  // Get background color for each type
  const getTypeBackgroundColor = (type: string) => {
    switch (type) {
      case 'hospital':
        return '#ffebeb';
      case 'police':
        return '#eceaff';
      case 'fire_station':
        return '#fff5eb';
      case 'pharmacy':
        return '#ebffef';
      default:
        return '#e9ecef';
    }
  };

  const renderEmergencyPlaceItem = ({ item, index }: { item: EmergencyPlace; index: number }) => {
    const isSelected = selectedPlaceId === `place_${index}`;
    
    return (
      <TouchableOpacity
        style={[
          styles.placeCard, 
          isSelected && styles.placeCardSelected,
          { backgroundColor: getTypeBackgroundColor(item.type) }
        ]}
        onPress={() => handleSelectPlace(index)}
        activeOpacity={0.7}
      >
        <View style={styles.placeIconContainer}>
          <Text style={styles.placeIcon}>{getEmergencyTypeIcon(item.type)}</Text>
        </View>
        <View style={styles.placeDetails}>
          <Text style={styles.placeName}>{item.name}</Text>
          <View style={styles.placeMetaContainer}>
            <Text style={styles.placeDistance}>
              {item.distance ? `${item.distance.toFixed(1)} km away` : 'Distance unknown'}
            </Text>
            <Text style={styles.placeType}>
              {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <TouchableOpacity 
          onPress={() => location && findNearbyEmergencyPlaces(location.coords.latitude, location.coords.longitude)}
          style={styles.refreshButton}
          disabled={!location || isLoading}
        >
          <IconSymbol size={20} name="arrow.clockwise" color={location && !isLoading ? "#007aff" : "#999"} />
        </TouchableOpacity>
      </View>
      
      {/* Split screen layout */}
      <View style={styles.contentContainer}>
        {/* Top half: Map */}
        <View style={styles.mapContainer}>
          {locationPermission === false ? (
            <View style={styles.permissionContainer}>
              <IconSymbol size={40} name="location.slash.fill" color="#999" />
              <Text style={styles.permissionTitle}>Location Access Required</Text>
              <Text style={styles.permissionText}>
                We need your location to show nearby emergency services.
              </Text>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={handleRequestLocation}
              >
                <Text style={styles.permissionButtonText}>Grant Location Access</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading && !location ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007aff" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : (
            <>
              <WebView
                ref={webViewRef}
                source={{ html: generateLeafletHTML(initialCoords.lat, initialCoords.lng) }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onMessage={handleWebViewMessage}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007aff" />
                    <Text style={styles.loadingText}>Loading map...</Text>
                  </View>
                )}
                onError={(error) => console.error('WebView error:', error)}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.log('WebView HTTP error:', nativeEvent);
                }}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                androidHardwareAccelerationDisabled={Platform.OS === 'android'}
                originWhitelist={['*']}
                mixedContentMode="compatibility"
                onLoadEnd={() => {
                  // Initial data injection after map loads
                  setTimeout(() => {
                    if (location) {
                      const { latitude, longitude } = location.coords;
                      const script = `
                        (function() {
                          try {
                            if (typeof window.updateUserLocation === 'function') {
                              window.updateUserLocation(${latitude}, ${longitude});
                            }
                            if (typeof window.addEmergencyPlaces === 'function' && ${JSON.stringify(emergencyPlaces)}.length > 0) {
                              window.addEmergencyPlaces(${JSON.stringify(emergencyPlaces)});
                            }
                          } catch(e) {
                            console.error('Initial data injection error:', e);
                          }
                        })();
                      `;
                      webViewRef.current?.injectJavaScript(script);
                    }
                  }, 1000);
                }}
              />
              
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingCard}>
                    <ActivityIndicator size="small" color="#007aff" />
                    <Text style={styles.loadingOverlayText}>Loading emergency services...</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Bottom half: Emergency places list */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Nearby Emergency Services</Text>
            {emergencyPlaces.length > 0 && (
              <Text style={styles.listSubtitle}>{emergencyPlaces.length} places found</Text>
            )}
          </View>

          {!location || locationPermission === false || isLoading ? (
            <View style={styles.emptyListContainer}>
              {!location || locationPermission === false ? (
                <Text style={styles.emptyListText}>
                  Please enable location to see nearby services
                </Text>
              ) : (
                <ActivityIndicator size="small" color="#007aff" />
              )}
            </View>
          ) : emergencyPlaces.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <IconSymbol size={30} name="exclamationmark.circle" color="#999" />
              <Text style={styles.emptyListTitle}>No services found</Text>
              <Text style={styles.emptyListText}>
                We couldn't find any emergency services nearby. Try expanding your search.
              </Text>
            </View>
          ) : (
            <FlatList
              data={emergencyPlaces}
              keyExtractor={(_, index) => `place_${index}`}
              renderItem={renderEmergencyPlaceItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListFooterComponent={<View style={{ height: 20 }} />}
            />
          )}
        </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  refreshButton: {
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
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  mapContainer: {
    height: '50%', // Map takes up half the screen
    backgroundColor: '#e9ecef',
  },
  listContainer: {
    height: '50%', // List takes up half the screen
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  listHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  placeCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  placeCardSelected: {
    borderWidth: 2,
    borderColor: '#007aff',
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  placeIcon: {
    fontSize: 20,
  },
  placeDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  placeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placeDistance: {
    fontSize: 14,
    color: '#666',
  },
  placeType: {
    fontSize: 14,
    color: '#007aff',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#007aff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingOverlayText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
});