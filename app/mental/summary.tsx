import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for mood history
const weeklyMoodData = {
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

// Mock data for mood distribution
const moodDistribution = {
  labels: ['Great', 'Good', 'Okay', 'Bad'],
  data: [30, 45, 20, 5],
  colors: ['#28a745', '#0084ff', '#ffc107', '#dc3545'],
  legendFontColor: '#7F7F7F',
  legendFontSize: 12
};

// Mock data for top triggers
const triggersData = {
  labels: ['Work', 'Sleep', 'Social', 'Health', 'Other'],
  data: [
    [35, 28, 15, 12, 10]
  ]
};

export default function SummaryScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width - 40;
  const [timeframe, setTimeframe] = useState('week');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f0f7ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mental Wellness Summary</Text>
        <View style={{ width: 40 }} />
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
        
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Mood Trend</Text>
          <LineChart
            data={weeklyMoodData}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#f8fbff',
              decimalPlaces: 0,
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
          />
        </Animated.View>
        
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          
          <Animated.View 
            style={[styles.insightCard, { opacity: fadeAnim }]}
          >
            <LinearGradient
              colors={['#e6f2ff', '#f0f7ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.insightIcon}
            >
              <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color="#0084ff" />
            </LinearGradient>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Your mood is improving</Text>
              <Text style={styles.insightText}>You've had 10% more positive days compared to last week.</Text>
            </View>
          </Animated.View>
          
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
              <IconSymbol size={24} name="figure.walk" color="#34c759" />
            </LinearGradient>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Exercise helps your mood</Text>
              <Text style={styles.insightText}>Days with exercise show 25% better mood scores.</Text>
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
              <IconSymbol size={24} name="bed.double.fill" color="#ff9500" />
            </LinearGradient>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Sleep affects your wellbeing</Text>
              <Text style={styles.insightText}>Your mood tends to be lower on days with less than 7 hours of sleep.</Text>
            </View>
          </Animated.View>
        </View>
        
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
            data={moodDistribution}
            width={screenWidth}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="data"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
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
          <Text style={styles.cardTitle}>Top Mood Factors</Text>
          <BarChart
            data={triggersData}
            width={screenWidth}
            height={220}
            yAxisLabel="%"
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#f8fbff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 132, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.6,
            }}
            style={styles.chart}
          />
        </Animated.View>
        
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          
          <TouchableOpacity style={styles.recommendationCard}>
            <LinearGradient
              colors={['#e6f2ff', '#f0f7ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recommendationIcon}
            >
              <IconSymbol size={24} name="person.fill.viewfinder" color="#0084ff" />
            </LinearGradient>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Morning Meditation</Text>
              <Text style={styles.recommendationText}>Start your day with 5 minutes of mindfulness</Text>
            </View>
            <View style={styles.recommendationArrow}>
              <IconSymbol size={20} name="chevron.right" color="#0084ff" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recommendationCard}>
            <LinearGradient
              colors={['#e2f5eb', '#ebfbf2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recommendationIcon}
            >
              <IconSymbol size={24} name="figure.walk" color="#34c759" />
            </LinearGradient>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Daily Walk</Text>
              <Text style={styles.recommendationText}>Aim for 20 minutes of walking each day</Text>
            </View>
            <View style={styles.recommendationArrow}>
              <IconSymbol size={20} name="chevron.right" color="#34c759" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recommendationCard}>
            <LinearGradient
              colors={['#efe7f8', '#f3e5ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recommendationIcon}
            >
              <IconSymbol size={24} name="book.fill" color="#6f42c1" />
            </LinearGradient>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Journal Your Thoughts</Text>
              <Text style={styles.recommendationText}>Regular journaling has been shown to improve mental clarity</Text>
            </View>
            <View style={styles.recommendationArrow}>
              <IconSymbol size={20} name="chevron.right" color="#6f42c1" />
            </View>
          </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
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
  },
  recommendationsContainer: {
    marginBottom: 32,
  },
  recommendationCard: {
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
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
  },
});