import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

// Mock quotes data
const quotes = [
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
  const [quote, setQuote] = useState(quotes[0]);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    // Get a random quote from the array
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#ffffff', '#f0f7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quoteContainer}
      >
        <View style={styles.iconContainer}>
          <IconSymbol size={22} name="quote.bubble" color="#0084ff" />
        </View>
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
  iconContainer: {
    backgroundColor: '#e6f2ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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