import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MaterialIcons } from '@expo/vector-icons';

// Initialize the Gemini API with your API key
// You'll need to store this securely, preferably using environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your fitness and health assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useState(new Animated.Value(0))[0];


  // Store conversation history for context
  const [conversationHistory, setConversationHistory] = useState([
    "You are a fitness and health assistant named Wellnex. Your goal is to provide accurate, helpful advice on exercise, nutrition, and healthy lifestyle choices. Keep responses focused on promoting health and wellness. Avoid giving medical diagnoses or treatment recommendations that should come from healthcare professionals. Always encourage users to consult healthcare providers for medical concerns. Be supportive, motivational, and informative."
  ]);

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
        .eq('chat_type', 'fitness')
        .order('timestamp', { ascending: true })
        .limit(20);
        
      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Transform data into message format
        const chatHistory = [];
        const newConversationHistory = [...conversationHistory];
        
        data.forEach(log => {
          // Add user message
          chatHistory.push({
            id: `user-${log.id}`,
            text: log.user_msg,
            sender: 'user',
            timestamp: new Date(log.timestamp)
          });
          
          // Add to conversation history for context
          newConversationHistory.push(`User: ${log.user_msg}`);
          
          // Add bot response
          chatHistory.push({
            id: `bot-${log.id}`,
            text: log.bot_response,
            sender: 'bot',
            timestamp: new Date(log.timestamp)
          });
          
          // Add to conversation history for context
          newConversationHistory.push(`Assistant: ${log.bot_response}`);
        });
        
        setConversationHistory(newConversationHistory);
        
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

  // Function to get response from Gemini API
  const getGeminiResponse = async (userPrompt) => {
    try {
      // Configure the model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" ,

      });
      
      // Add the user's latest message to conversation history
      const fullPrompt = [...conversationHistory, `User: ${userPrompt}`];
      
      // Get response from Gemini
      const result = await model.generateContent(fullPrompt.join('\n'));
      const response = await result.response;
      const text = response.text();
      
      // Update the conversation history with both user input and AI response
      setConversationHistory([
        ...fullPrompt,
        `Assistant: ${text}`
      ]);
      
      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Could you try again later?";
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
    
    // Get response from Gemini
    const botResponseText = await getGeminiResponse(userMessageText);
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await supabase.from('chat_logs').insert([
          {
            user_id: user.id,
            chat_type: 'fitness',
            user_msg: userMessageText,
            bot_response: botResponseText,
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error('Failed to save chat log:', err);
      }
    }
    
    // Add the bot response to messages
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date()
    };
    
    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
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
          <MaterialIcons size={24} name="chevron-left" color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Fitness Health Assistant</Text>
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
            placeholder="Ask about fitness, nutrition, or wellness..."
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