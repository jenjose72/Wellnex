import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Link } from 'expo-router';
import MentalQuote from '@/components/MentalQuote';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for mood tracking history
const mockMoodData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [4, 3, 2, 3, 4, 3, 3],
      color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
      strokeWidth: 2
    }
  ],
  legend: ['Mood (1-4)']
};

// Mock analysis data
const moodAnalysis = {
  averageMood: 'Good',
  improvement: '+10%',
  topTrigger: 'Work Stress',
  recommendation: 'Try a 5-minute breathing exercise'
};

export default function MentalScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width - 32;

  const saveMood = (mood: string) => {
    setSelectedMood(mood);
    // In a real app, you would save this to storage or a database
  };
  
  const getMoodColor = (mood) => {
    switch(mood) {
      case 'Great': return '#28a745';
      case 'Good': return '#17a2b8';
      case 'Okay': return '#ffc107';
      case 'Bad': return '#dc3545';
      default: return '#0084ff';
    }
  };
  
  const getMoodIcon = (mood) => {
    switch(mood) {
      case 'Great': return "face.smiling.fill";
      case 'Good': return "face.dashed.fill";
      case 'Okay': return "face.dashed";
      case 'Bad': return "face.frown.fill";
      default: return "face.dashed";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#ffffff', '#f0f7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Mental Wellness</Text>
          <Text style={styles.headerSubtitle}>Support for your mental health</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mental Quote Component */}
        <MentalQuote />

        <View style={styles.moodContainer}>
          <Text style={styles.moodQuestion}>How are you feeling today?</Text>
          <View style={styles.moodOptions}>
            {['Great', 'Good', 'Okay', 'Bad'].map((mood) => (
              <TouchableOpacity 
                key={mood}
                style={[styles.moodOption, selectedMood === mood && styles.selectedMood]}
                onPress={() => saveMood(mood)}
              >
                <View 
                  style={[
                    styles.moodIconContainer, 
                    { 
                      backgroundColor: selectedMood === mood 
                        ? getMoodColor(mood) 
                        : `${getMoodColor(mood)}15` 
                    }
                  ]}
                >
                  <IconSymbol 
                    size={28} 
                    name={getMoodIcon(mood)} 
                    color={selectedMood === mood ? '#fff' : getMoodColor(mood)} 
                  />
                </View>
                <Text style={[
                  styles.moodText, 
                  selectedMood === mood && { color: getMoodColor(mood), fontWeight: '600' }
                ]}>
                  {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Mood Analysis Chart */}
        <View style={styles.analysisContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Weekly Mood Analysis</Text>
            <Link href="/mental/summary" asChild>
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>See Details</Text>
                <IconSymbol size={16} name="chevron.right" color="#0084ff" />
              </TouchableOpacity>
            </Link>
          </View>
          
          {/* Mood Chart */}
          <View style={styles.chartContainer}>
            <LineChart
              data={mockMoodData}
              width={screenWidth - 32}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#f8fbff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                style: {
                  borderRadius: 12,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#0084ff',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <IconSymbol size={18} name="face.smiling" color="#0084ff" />
              </View>
              <Text style={styles.statLabel}>Average Mood</Text>
              <Text style={styles.statValue}>{moodAnalysis.averageMood}</Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <IconSymbol size={18} name="chart.line.uptrend.xyaxis" color="#28a745" />
              </View>
              <Text style={styles.statLabel}>Weekly Change</Text>
              <Text style={[styles.statValue, {color: '#28a745'}]}>
                {moodAnalysis.improvement}
              </Text>
            </View>

            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <IconSymbol size={18} name="exclamationmark.triangle" color="#ff9500" />
              </View>
              <Text style={styles.statLabel}>Top Trigger</Text>
              <Text style={styles.statValue}>{moodAnalysis.topTrigger}</Text>
            </View>
          </View>

          {/* Recommendation */}
          <LinearGradient
            colors={['#e6f2ff', '#f0f7ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recommendationContainer}
          >
            <IconSymbol size={22} name="lightbulb.fill" color="#0084ff" />
            <Text style={styles.recommendationText}>
              {moodAnalysis.recommendation}
            </Text>
          </LinearGradient>
        </View>

        {/* Mental Health Feature Cards */}
        <Text style={styles.featuresTitle}>Wellness Resources</Text>
        <View style={styles.featureContainer}>
          <Link href="/mental/chatbot" asChild>
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#e6f2ff' }]}>
                <IconSymbol size={24} name="message.fill" color="#0084ff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Mental Health Chatbot</Text>
                <Text style={styles.featureDescription}>Talk about your feelings and get support</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#c5d5e6" />
            </TouchableOpacity>
          </Link>

          <Link href="/mental/journal" asChild>
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#e6f0ff' }]}>
                <IconSymbol size={24} name="book.fill" color="#0084ff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Mood Journal</Text>
                <Text style={styles.featureDescription}>Track your emotions and write thoughts</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#c5d5e6" />
            </TouchableOpacity>
          </Link>

          <Link href="/mental/summary" asChild>
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#e6f2ff' }]}>
                <IconSymbol size={24} name="chart.bar_fill" color="#0084ff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Weekly Summary</Text>
                <Text style={styles.featureDescription}>View insights about your mental wellbeing</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#c5d5e6" />
            </TouchableOpacity>
          </Link>
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
  headerGradient: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  moodContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  moodQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    width: '22%',
  },
  selectedMood: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#d7e8ff',
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  analysisContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0084ff',
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    padding: 8,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#e6f2ff',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#0084ff',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  featureContainer: {
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1, 
    borderColor: '#e6f2ff',
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  }
});