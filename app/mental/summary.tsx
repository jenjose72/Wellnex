import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Entypo, FontAwesome, FontAwesome5 } from '@expo/vector-icons';

type MoodLog = {
  id: string;
  mood: string;
  note: string;
  energy_level: number;
  logged_at: string;
};

export default function SummaryScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width - 40;
  const [timeframe, setTimeframe] = useState('week');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [moodData, setMoodData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
      strokeWidth: 2
    }],
    legend: ['Mood']
  });
  
  const [distributionData, setDistributionData] = useState({
    labels: ['Great', 'Good', 'Okay', 'Bad'],
    data: [0, 0, 0, 0],
    colors: ['#28a745', '#0084ff', '#ffc107', '#dc3545']
  });
  
  // Start fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Fetch data when component mounts or timeframe changes
  useEffect(() => {
    if (user) {
      fetchMoodData();
    } else {
      setIsLoading(false);
    }
  }, [user, timeframe]);

  const fetchMoodData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Calculate date range based on selected timeframe
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeframe === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setMonth(endDate.getMonth() - 3);
      }
      
      // Fetch mood logs from Supabase
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: true });
      
      if (error) throw error;
      
      // Process data for charts
      if (data && data.length > 0) {
        processMoodData(data);
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processMoodData = (data: MoodLog[]) => {
    // Process mood trend data based on timeframe
    const labels: string[] = [];
    const moodValues: number[] = [];
    
    if (timeframe === 'week') {
      // Group by day of week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const moodByDay: {[key: string]: number[]} = {};
      
      // Initialize all days
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const dayName = dayNames[day.getDay()];
        labels.push(dayName);
        moodByDay[dayName] = [];
      }
      
      // Group mood values by day
      data.forEach(log => {
        const date = new Date(log.logged_at);
        const day = dayNames[date.getDay()];
        const moodValue = getMoodValue(log.mood);
        if (moodByDay[day]) {
          moodByDay[day].push(moodValue);
        }
      });
      
      // Calculate average mood for each day
      labels.forEach(day => {
        const moods = moodByDay[day];
        if (moods.length > 0) {
          const avgMood = moods.reduce((sum, val) => sum + val, 0) / moods.length;
          moodValues.push(parseFloat(avgMood.toFixed(1)));
        } else {
          moodValues.push(0);
        }
      });
    } else if (timeframe === 'month') {
      // Group by week
      for (let i = 0; i < 4; i++) {
        labels.push(`Week ${i+1}`);
      }
      
      const weekBuckets: number[][] = [[], [], [], []];
      
      data.forEach(log => {
        const logDate = new Date(log.logged_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(diffDays / 7));
        
        weekBuckets[weekIndex].push(getMoodValue(log.mood));
      });
      
      weekBuckets.forEach(bucket => {
        if (bucket.length > 0) {
          const avgMood = bucket.reduce((sum, val) => sum + val, 0) / bucket.length;
          moodValues.push(parseFloat(avgMood.toFixed(1)));
        } else {
          moodValues.push(0);
        }
      });
    } else {
      // Group by month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      for (let i = 2; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        labels.push(monthNames[monthIndex]);
      }
      
      const monthBuckets: number[][] = [[], [], []];
      
      data.forEach(log => {
        const logDate = new Date(log.logged_at);
        const monthDiff = (currentMonth - logDate.getMonth() + 12) % 12;
        if (monthDiff < 3) {
          monthBuckets[monthDiff].push(getMoodValue(log.mood));
        }
      });
      
      monthBuckets.forEach(bucket => {
        if (bucket.length > 0) {
          const avgMood = bucket.reduce((sum, val) => sum + val, 0) / bucket.length;
          moodValues.push(parseFloat(avgMood.toFixed(1)));
        } else {
          moodValues.push(0);
        }
      });
    }
    
    // Update mood trend chart data
    setMoodData({
      labels,
      datasets: [{
        data: moodValues,
        color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
        strokeWidth: 2
      }],
      legend: ['Mood']
    });
    
    // Process mood distribution data
    const distribution = {
      Great: 0,
      Good: 0,
      Okay: 0,
      Bad: 0
    };
    
    data.forEach(log => {
      if (distribution[log.mood] !== undefined) {
        distribution[log.mood]++;
      }
    });
    
    setDistributionData({
      labels: Object.keys(distribution),
      data: Object.values(distribution),
      colors: ['#28a745', '#0084ff', '#ffc107', '#dc3545']
    });
  };
  
  const getMoodValue = (mood: string): number => {
    switch (mood.toLowerCase()) {
      case 'great': return 5;
      case 'good': return 4;
      case 'okay': return 3;
      case 'bad': return 2;
      default: return 3;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f0f7ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Entypo size={24} name="chevron-left" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mental Wellness Summary</Text>
        <TouchableOpacity onPress={fetchMoodData} style={styles.refreshButton}>
          <FontAwesome size={20} name="refresh" color="#333" />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeframeSelector}>
          <TouchableOpacity 
            style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeSelected]}
            onPress={() => setTimeframe('week')}
          >
            <Text style={[styles.timeframeText, timeframe === 'week' && styles.timeframeTextSelected]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeSelected]}
            onPress={() => setTimeframe('month')}
          >
            <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeTextSelected]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeframeButton, timeframe === '3months' && styles.timeframeSelected]}
            onPress={() => setTimeframe('3months')}
          >
            <Text style={[styles.timeframeText, timeframe === '3months' && styles.timeframeTextSelected]}>
              3 Months
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084ff" />
            <Text style={styles.loadingText}>Loading your mood data...</Text>
          </View>
        ) : (
          <>
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <Text style={styles.cardTitle}>Mood Trend</Text>
              <LineChart
                data={moodData}
                width={screenWidth}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#f8fbff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#0084ff',
                  },
                  propsForBackgroundLines: {
                    stroke: '#e6f2ff',
                    strokeDasharray: '',
                  },
                  useShadowColorFromDataset: false,
                }}
                bezier
                style={styles.chart}
                fromZero
              />
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.card, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  }) }] 
                }
              ]}
            >
              <Text style={styles.cardTitle}>Mood Distribution</Text>
              <PieChart
                data={distributionData.data.map((value, index) => ({
                  name: distributionData.labels[index],
                  population: value,
                  color: distributionData.colors[index],
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12
                }))}
                width={screenWidth}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </Animated.View>
            
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Daily Tips</Text>
              
              <Animated.View 
                style={[
                  styles.insightCard, 
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    }) }] 
                  }
                ]}
              >
                <LinearGradient
                  colors={['#e2f5eb', '#ebfbf2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.insightIcon}
                >
                  <FontAwesome5 size={24} name="walking" color="#34c759" />
                </LinearGradient>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Exercise helps your mood</Text>
                  <Text style={styles.insightText}>Try to include 20 minutes of movement daily.</Text>
                </View>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.insightCard, 
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0]
                    }) }] 
                  }
                ]}
              >
                <LinearGradient
                  colors={['#fff0e6', '#fff5ed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.insightIcon}
                >
                  <FontAwesome5 size={24} name="bed" color="#ff9500" />
                </LinearGradient>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Sleep affects your wellbeing</Text>
                  <Text style={styles.insightText}>Aim for 7-8 hours of quality sleep each night.</Text>
                </View>
              </Animated.View>
            </View>
          </>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  timeframeSelected: {
    backgroundColor: '#fff',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666',
  },
  timeframeTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  insightsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
  }
});