import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Response templates for the chatbot
const botResponses = {
  greeting: [
    "Hello! I'm here to support your mental wellbeing. How are you feeling today?",
    "Hi there! I'm your mental wellness assistant. What's on your mind?",
    "Welcome! I'm here to chat about anything that's troubling you. How can I help?"
  ],
  stressed: [
    "I'm sorry to hear you're feeling stressed. Have you tried any relaxation techniques today?",
    "Stress can be challenging. Would you like me to suggest some quick breathing exercises?",
    "When you're stressed, it's important to take breaks. Would you like some self-care suggestions?"
  ],
  sad: [
    "I'm sorry you're feeling down. Would you like to talk about what's making you sad?",
    "Remember that it's okay to feel sad sometimes. Would it help to discuss what triggered this feeling?",
    "Thank you for sharing that with me. Is there anything specific that might help lift your mood right now?"
  ],
  anxious: [
    "Anxiety can be overwhelming. Let's focus on the present moment. What are five things you can see around you?",
    "When anxiety strikes, grounding techniques can help. Would you like me to guide you through one?",
    "I understand anxiety is difficult. Remember to breathe slowly. Is there a specific worry on your mind?"
  ],
  general: [
    "Thank you for sharing that. How long have you been feeling this way?",
    "I appreciate you opening up. Would you like to talk more about this?",
    "Your feelings are valid. Is there something specific you'd like support with today?",
    "I'm here to listen. What do you think might help you feel better right now?"
  ]
};

// Get a random response from the appropriate category
function getResponse(text) {
  const lowerCaseText = text.toLowerCase();
  
  if (lowerCaseText.includes('hello') || lowerCaseText.includes('hi') || lowerCaseText.includes('hey')) {
    return botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
  } else if (lowerCaseText.includes('stress') || lowerCaseText.includes('overwhelm')) {
    return botResponses.stressed[Math.floor(Math.random() * botResponses.stressed.length)];
  } else if (lowerCaseText.includes('sad') || lowerCaseText.includes('unhappy') || lowerCaseText.includes('depress')) {
    return botResponses.sad[Math.floor(Math.random() * botResponses.sad.length)];
  } else if (lowerCaseText.includes('anxi') || lowerCaseText.includes('worry') || lowerCaseText.includes('panic')) {
    return botResponses.anxious[Math.floor(Math.random() * botResponses.anxious.length)];
  } else {
    return botResponses.general[Math.floor(Math.random() * botResponses.general.length)];
  }
}

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm here to support your mental wellbeing. How are you feeling today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load previous chat logs when component mounts
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [user]);

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
        // Transform data into message format
        const chatHistory = [];
        
        data.forEach(log => {
          // Add user message
          chatHistory.push({
            id: `user-${log.id}`,
            text: log.user_msg,
            sender: 'user',
            timestamp: new Date(log.timestamp)
          });
          
          // Add bot response
          chatHistory.push({
            id: `bot-${log.id}`,
            text: log.bot_response,
            sender: 'bot',
            timestamp: new Date(log.timestamp)
          });
        });
        
        setMessages(prevMessages => {
          // Keep only the first welcome message and add history
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
    
    // Add user message
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
    
    // Get bot response
    const botResponseText = getResponse(userMessageText);
    
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
    
    // Simulate bot typing with a delay
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
    }, 1500);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
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
          <IconSymbol size={24} name="chevron.left" color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mental Health Assistant</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>
      
      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
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
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
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
            placeholder="Type your message here..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <IconSymbol size={20} name="paperplane.fill" color="#fff" />
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
    backgroundColor: '#0084ff',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#0084ff',
    fontWeight: '500',
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
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f7ff',
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
    paddingVertical: 14,
    width: 80,
  },
  typingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0084ff',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
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