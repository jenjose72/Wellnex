import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


// Expanded collection of mental health quotes
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
  },
  {
    text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.",
    author: "Glenn Close"
  },
  {
    text: "There is hope, even when your brain tells you there isn't.",
    author: "John Green"
  },
  {
    text: "You are not your illness. You have an individual story to tell. You have a name, a history, a personality. Staying yourself is part of the battle.",
    author: "Julian Seifter"
  },
  {
    text: "My dark days made me stronger. Or maybe I already was strong, and they made me prove it.",
    author: "Emery Lord"
  },
  {
    text: "Sometimes the people around you won't understand your journey. They don't need to, it's not for them.",
    author: "Joubert Botha"
  },
  {
    text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
    author: "Albus Dumbledore"
  },
  {
    text: "Just because no one else can heal or do your inner work for you doesn't mean you can, should, or need to do it alone.",
    author: "Lisa Olivera"
  },
  {
    text: "Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time.",
    author: "Unknown"
  },
  {
    text: "The bravest thing I ever did was continuing my life when I wanted to die.",
    author: "Juliette Lewis"
  },
  {
    text: "Not until we are lost do we begin to understand ourselves.",
    author: "Henry David Thoreau"
  }
];

export default function MentalQuote() {
  const [quote, setQuote] = useState(quotes[0]);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    // Select random quote on component mount
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
          <FontAwesome size={22} name="quote-left" color="#0084ff" />
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