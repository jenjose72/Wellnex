import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Replace IconSymbol with Expo Vector Icons
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Add your Gemini API key here
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Mental wellness system prompt for Gemini
const SYSTEM_PROMPT = `You are a compassionate mental wellness assistant. Your role is to provide emotional support, comfort, and guidance to users who may be experiencing difficult emotions or mental health challenges. 

Guidelines:
- Always respond with empathy, warmth, and understanding
- Validate the user's feelings without judgment
- Offer gentle, practical coping strategies when appropriate
- Use encouraging and hopeful language
- Keep responses conversational and supportive (2-4 sentences typically)
- If someone expresses severe distress or suicidal thoughts, gently suggest professional help
- Focus on self-care, mindfulness, and positive coping mechanisms
- Remember that you're here to comfort and support, not to diagnose or replace professional therapy

Respond as if you're a caring friend who genuinely wants to help the person feel better.`;

// Fallback responses for when API fails
const fallbackResponses = {
  greeting: [
    "Hello! I'm here to support you through whatever you're going through. How are you feeling right now?",
    "Hi there! I'm glad you're here. Sometimes just reaching out is the hardest step. What's on your mind?",
    "Welcome! I'm here to listen without judgment and offer support. How can I help you today?"
  ],
  general: [
    "I hear you, and your feelings are completely valid. You're not alone in this.",
    "Thank you for sharing that with me. It takes courage to open up about how you're feeling.",
    "I'm here with you through this difficult moment. Remember, this feeling will pass.",
    "You're being so brave by reaching out. What you're going through is real and important."
  ],
  error: [
    "I'm having trouble connecting right now, but I want you to know that I'm here for you. Your feelings matter.",
    "Even though I'm experiencing some technical difficulties, please know that you're not alone. How are you holding up?",
    "I may be having connection issues, but what you're feeling is valid and important. Can you tell me more about what's going on?"
  ]
};

// Function to call Gemini API
async function getGeminiResponse(userMessage, conversationHistory = []) {
  try {
    // Prepare conversation context
    let contextMessages = conversationHistory.slice(-6); // Last 6 messages for context
    let conversationContext = contextMessages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
    ).join('\n');

    const prompt = `${SYSTEM_PROMPT}

Previous conversation context:
${conversationContext}

Current user message: ${userMessage}

Please respond with empathy and support:`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null;
  }
}

// Get fallback response
function getFallbackResponse(text) {
  const lowerCaseText = text.toLowerCase();
  
  if (lowerCaseText.includes('hello') || lowerCaseText.includes('hi') || lowerCaseText.includes('hey')) {
    return fallbackResponses.greeting[Math.floor(Math.random() * fallbackResponses.greeting.length)];
  } else {
    return fallbackResponses.general[Math.floor(Math.random() * fallbackResponses.general.length)];
  }
}

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm here to support you through whatever you're experiencing. You're not alone, and your feelings matter. How are you doing today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const scrollViewRef = useRef(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Check API connection on mount
  useEffect(() => {
    checkAPIConnection();
    if (user) {
      loadChatHistory();
    }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [user]);

  // Check if Gemini API is configured
  const checkAPIConnection = () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      setIsConnected(false);
      Alert.alert(
        'API Configuration Required', 
        'Please add your Gemini API key to enable AI responses. The chatbot will use fallback responses for now.',
        [{ text: 'OK' }]
      );
    }
  };

  // Load chat history from Supabase
  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_type', 'mental')
        .order('timestamp', { ascending: true })
        .limit(20);
        
      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const chatHistory = [];
        
        data.forEach(log => {
          chatHistory.push({
            id: `user-${log.id}`,
            text: log.user_msg,
            sender: 'user',
            timestamp: new Date(log.timestamp)
          });
          
          chatHistory.push({
            id: `bot-${log.id}`,
            text: log.bot_response,
            sender: 'bot',
            timestamp: new Date(log.timestamp)
          });
        });
        
        setMessages(prevMessages => {
          const welcomeMessage = prevMessages[0];
          return [welcomeMessage, ...chatHistory];
        });
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userMessageText = inputText;
    setInputText('');
    setIsTyping(true);
    
    let botResponseText;
    
    // Try to get response from Gemini API
    if (isConnected && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      botResponseText = await getGeminiResponse(userMessageText, messages);
    }
    
    // Fall back to predefined responses if API fails
    if (!botResponseText) {
      botResponseText = getFallbackResponse(userMessageText);
    }
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await supabase.from('chat_logs').insert([
          {
            user_id: user.id,
            chat_type: 'mental',
            user_msg: userMessageText,
            bot_response: botResponseText,
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error('Failed to save chat log:', err);
      }
    }
    
    // Simulate natural typing delay
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f0f7ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons size={24} name="chevron-back" color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mental Wellness Assistant</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.onlineDot, !isConnected && styles.offlineDot]} />
            <Text style={[styles.statusText, !isConnected && styles.offlineText]}>
              {isConnected ? 'AI Powered' : 'Basic Mode'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>
      
      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(message => (
            <View 
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userText : styles.botText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.timeText,
                message.sender === 'user' ? styles.userTimeText : styles.botTimeText
              ]}>
                {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
              <View style={styles.typingIndicator}>
                <Animated.View style={[styles.typingDot, styles.typingDot1]} />
                <Animated.View style={[styles.typingDot, styles.typingDot2]} />
                <Animated.View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <Text style={styles.typingText}>Assistant is typing...</Text>
            </View>
          )}
        </ScrollView>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons size={20} name="paper-plane" color="#fff" />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f2ff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  offlineDot: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  offlineText: {
    color: '#FF9800',
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e6f2ff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimeText: {
    color: '#999',
  },
  typingBubble: {
    paddingVertical: 16,
    minWidth: 120,
  },
  typingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0084ff',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e6f2ff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e6f2ff',
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0084ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0084ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#b3d9ff',
    shadowOpacity: 0.1,
  },
});