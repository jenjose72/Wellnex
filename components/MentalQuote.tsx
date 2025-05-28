import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

// Fallback quotes if database fetch fails
const fallbackQuotes = [
  {
    text: "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
    author: "Unknown"
  },
  {
    text: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman"
  },
  {
    text: "Mental health is not a destination, but a process. It's about how you drive, not where you're going.",
    author: "Noam Shpancer"
  },
  {
    text: "Self-care is how you take your power back.",
    author: "Lalah Delia"
  },
  {
    text: "The strongest people are those who win battles we know nothing about.",
    author: "Unknown"
  }
];

export default function MentalQuote() {
  const [quote, setQuote] = useState(fallbackQuotes[0]);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { user } = useAuth();
  
  useEffect(() => {
    fetchQuote();
  }, []);
  
  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch quotes from the database
      const { data, error } = await supabase
        .from('mental_quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If we have quotes in the database, use them
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setQuote(data[randomIndex]);
      } else {
        // Otherwise use fallback quotes
        const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
        setQuote(fallbackQuotes[randomIndex]);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Use fallback quote if error
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      setQuote(fallbackQuotes[randomIndex]);
    } finally {
      setIsLoading(false);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#ffffff', '#f0f7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quoteContainer}
      >
        <Text style={styles.quoteText}>{quote.text}</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  quoteContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  quoteText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 26,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  quoteAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0084ff',
    textAlign: 'right',
  },
});