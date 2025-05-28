import MentalQuote from '@/components/MentalQuote';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Entypo, FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MentalScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moodData, setMoodData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`, strokeWidth: 2 }],
    legend: ['Mood (1-5)']
  });
  const [moodAnalysis, setMoodAnalysis] = useState({
    averageMood: 'N/A',
    improvement: '0%',
    topTrigger: 'None',
    recommendation: 'Start tracking your mood daily'
  });
  const screenWidth = Dimensions.get('window').width - 32;
  
  useEffect(() => {
    if (user) {
      fetchTodayMood();
      fetchMoodData();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const fetchTodayMood = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('mood_logs')
        .select('mood')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSelectedMood(data[0].mood);
        setTodayMood(data[0].mood);
      }
    } catch (error) {
      console.error('Error fetching today mood:', error);
    }
  };
  
  const fetchMoodData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get last 7 days of mood data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const { data, error } = await supabase
        .from('mood_logs')
        .select('mood, energy_level, note, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Process data for chart
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = Array(7).fill(0).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toISOString().split('T')[0],
            day: days[d.getDay()],
            mood: null,
            energy: null
          };
        });
        
        // Map mood data to numeric values
        const moodValues = {
          'Great': 5,
          'Good': 4,
          'Okay': 3,
          'Bad': 2,
          'Terrible': 1
        };
        
        // Fill in data for days we have entries
        data.forEach(entry => {
          const entryDate = entry.logged_at.split('T')[0];
          const dayIndex = last7Days.findIndex(d => d.date === entryDate);
          
          if (dayIndex !== -1) {
            // If multiple entries per day, use the average
            if (last7Days[dayIndex].mood === null) {
              last7Days[dayIndex].mood = moodValues[entry.mood] || 3;
              last7Days[dayIndex].energy = entry.energy_level || 5;
            } else {
              // Simple average if multiple entries
              last7Days[dayIndex].mood = (last7Days[dayIndex].mood + (moodValues[entry.mood] || 3)) / 2;
              last7Days[dayIndex].energy = (last7Days[dayIndex].energy + (entry.energy_level || 5)) / 2;
            }
          }
        });
        
        // Fill gaps with average or default value
        const validMoods = last7Days.filter(d => d.mood !== null).map(d => d.mood);
        const avgMood = validMoods.length > 0 
          ? validMoods.reduce((sum, val) => sum + val, 0) / validMoods.length 
          : 3;
        
        last7Days.forEach(day => {
          if (day.mood === null) day.mood = avgMood;
        });
        
        // Create chart data
        setMoodData({
          labels: last7Days.map(d => d.day),
          datasets: [{ 
            data: last7Days.map(d => d.mood),
            color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`, 
            strokeWidth: 2 
          }],
          legend: ['Mood (1-5)']
        });
        
        // Calculate analysis
        // 1. Average mood
        const moodsNames = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];
        const averageScore = validMoods.reduce((sum, val) => sum + val, 0) / validMoods.length;
        const averageMood = moodsNames[Math.round(averageScore) - 1] || 'Okay';
        
        // 2. Weekly improvement
        const firstHalf = validMoods.slice(0, Math.ceil(validMoods.length / 2));
        const secondHalf = validMoods.slice(Math.ceil(validMoods.length / 2));
        
        const firstHalfAvg = firstHalf.length > 0 
          ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length 
          : 0;
        const secondHalfAvg = secondHalf.length > 0 
          ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length 
          : 0;
        
        const improvementPercent = firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        
        // 3. Find top trigger (simplified, would need NLP for better accuracy)
        const notes = data.map(entry => entry.note || '').filter(note => note !== '');
        const triggers = [
          { name: 'Work', keywords: ['work', 'job', 'boss', 'colleague', 'deadline', 'meeting'] },
          { name: 'Sleep', keywords: ['sleep', 'tired', 'insomnia', 'rest', 'nap', 'bed'] },
          { name: 'Social', keywords: ['friend', 'social', 'family', 'people', 'relationship', 'partner'] },
          { name: 'Health', keywords: ['health', 'pain', 'doctor', 'sick', 'illness', 'symptom'] }
        ];
        
        const triggerCounts = triggers.map(trigger => {
          let count = 0;
          notes.forEach(note => {
            const lowerNote = note.toLowerCase();
            trigger.keywords.forEach(keyword => {
              if (lowerNote.includes(keyword.toLowerCase())) count++;
            });
          });
          return { name: trigger.name, count };
        });
        
        triggerCounts.sort((a, b) => b.count - a.count);
        const topTrigger = triggerCounts[0].count > 0 ? triggerCounts[0].name : 'None detected';
        
        // 4. Generate a recommendation
        let recommendation = 'Track your mood daily for better insights';
        
        if (topTrigger !== 'None detected') {
          switch (topTrigger) {
            case 'Work':
              recommendation = 'Try a 5-minute breathing exercise before work';
              break;
            case 'Sleep':
              recommendation = 'Consider going to bed 30 minutes earlier';
              break;
            case 'Social':
              recommendation = 'Schedule short breaks from social activities';
              break;
            case 'Health':
              recommendation = 'Add 10 minutes of gentle stretching to your day';
              break;
          }
        } else if (validMoods.length > 3) {
          if (averageScore < 3) {
            recommendation = 'Consider talking to someone about how you feel';
          } else if (averageScore >= 4) {
            recommendation = 'Keep up your positive practices!';
          } else {
            recommendation = 'Try a daily mindfulness practice';
          }
        }
        
        setMoodAnalysis({
          averageMood,
          improvement: `${improvementPercent.toFixed(0)}%`,
          topTrigger: topTrigger !== 'None detected' ? topTrigger : 'None identified',
          recommendation
        });
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMood = async (mood: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to track your mood');
      return;
    }
    
    setSelectedMood(mood);
    
    // Don't save again if user already logged mood today
    if (mood === todayMood) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .insert([{
          user_id: user.id,
          mood: mood,
          energy_level: 5, // Default value
          note: ''
        }]);
        
      if (error) throw error;
      
      setTodayMood(mood);
      // Refresh mood data after logging a new mood
      fetchMoodData();
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood');
    } finally {
      setIsSubmitting(false);
    }
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
      case 'Great': return "face-smile-beam";
      case 'Good': return "face-smile";
      case 'Okay': return "face-meh";
      case 'Bad': return "face-sad-tear";
      default: return "face-meh";
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
                disabled={isSubmitting}
              >
                {isSubmitting && selectedMood === mood ? (
                  <ActivityIndicator color={getMoodColor(mood)} />
                ) : (
                  <>
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
                      <FontAwesome6 
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
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {todayMood && (
            <Text style={styles.moodRecorded}>Your mood for today has been recorded</Text>
          )}
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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0084ff" />
              <Text style={styles.loadingText}>Loading your mood data...</Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <LineChart
                data={moodData}
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
          )}

          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <FontAwesome6 size={18} name="face-smile-wink" color="#0084ff" />
              </View>
              <Text style={styles.statLabel}>Average Mood</Text>
              <Text style={styles.statValue}>{moodAnalysis.averageMood}</Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <FontAwesome size={18} name="line-chart" color={parseFloat(moodAnalysis.improvement) >= 0 ? "#28a745" : "#dc3545"} />
              </View>
              <Text style={styles.statLabel}>Weekly Change</Text>
              <Text style={[styles.statValue, {color: parseFloat(moodAnalysis.improvement) >= 0 ? "#28a745" : "#dc3545"}]}>
                {moodAnalysis.improvement}
              </Text>
            </View>

            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <FontAwesome size={18} name="exclamation-triangle" color="#ff9500" />
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
            <Entypo size={22} name="light-bulb" color="#0084ff" />
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
                <Entypo size={24} name="chat" color="#0084ff" />
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
                <Entypo size={24} name="open-book" color="#0084ff" />
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
                <FontAwesome5 size={24} name="brain" color="#0084ff" />
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
  moodRecorded: {
    fontSize: 12,
    color: '#0084ff',
    textAlign: 'center',
    marginTop: 12,
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
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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