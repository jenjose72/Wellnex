import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MentalScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Mental Wellness</Text>
          <Text style={styles.headerSubtitle}>Support for your mental health</Text>
        </View>

        <View style={styles.moodContainer}>
          <Text style={styles.moodQuestion}>How are you feeling today?</Text>
          <View style={styles.moodOptions}>
            <TouchableOpacity style={styles.moodOption}>
              <IconSymbol size={32} name="face.smiling.fill" color="#28a745" />
              <Text style={styles.moodText}>Great</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodOption}>
              <IconSymbol size={32} name="face.dashed.fill" color="#17a2b8" />
              <Text style={styles.moodText}>Good</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodOption}>
              <IconSymbol size={32} name="face.dashed" color="#ffc107" />
              <Text style={styles.moodText}>Okay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moodOption}>
              <IconSymbol size={32} name="face.frown.fill" color="#dc3545" />
              <Text style={styles.moodText}>Bad</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          
          <TouchableOpacity style={styles.activityCard}>
            <View style={[styles.activityIcon, styles.meditationIcon]}>
              <IconSymbol size={24} name="person.fill.viewfinder" color="#6f42c1" />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>Guided Meditation</Text>
              <Text style={styles.activityDuration}>10 minutes</Text>
            </View>
            <IconSymbol size={24} name="play.circle.fill" color="#6f42c1" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.activityCard}>
            <View style={[styles.activityIcon, styles.breathingIcon]}>
              <IconSymbol size={24} name="waveform.path.ecg" color="#007bff" />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>Deep Breathing</Text>
              <Text style={styles.activityDuration}>5 minutes</Text>
            </View>
            <IconSymbol size={24} name="play.circle.fill" color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Mood Tracking</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>Your mood history will be displayed here</Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourcesContainer}>
            <TouchableOpacity style={styles.resourceButton}>
              <IconSymbol size={20} name="book.fill" color="#333" />
              <Text style={styles.resourceText}>Articles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceButton}>
              <IconSymbol size={20} name="video.fill" color="#333" />
              <Text style={styles.resourceText}>Videos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceButton}>
              <IconSymbol size={20} name="phone.fill" color="#333" />
              <Text style={styles.resourceText}>Helplines</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  moodContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  moodQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodOption: {
    alignItems: 'center',
    padding: 8,
  },
  moodText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  cardContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    padding: 16,
  },
  activityCard: {
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
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  meditationIcon: {
    backgroundColor: '#efe7f8',
  },
  breathingIcon: {
    backgroundColor: '#e6f2ff',
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  resourceText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});