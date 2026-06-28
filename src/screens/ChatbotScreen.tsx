import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Layout, Spacing } from '../theme/Theme';
import { ChatMessage, generateChatResponse } from '../services/groqService';
import { useAppSelector } from '../hooks/reduxHooks';

interface ChatbotScreenProps {
  navigation: any;
}

export default function ChatbotScreen({ navigation }: ChatbotScreenProps) {
  const { colors, gradients, shadows, isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial system prompt to set the AI's identity and context
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are FIZI Coach, an expert AI personal trainer designed to help the user achieve their fitness goals. 
You are enthusiastic, knowledgeable, encouraging, and concise.
The user's name is ${user?.displayName || 'Champion'}. 
Their current fitness level is ${user?.fitnessProfile?.experienceLevel || 'Unknown'}. 
Their goal is to ${user?.fitnessProfile?.fitnessGoals?.join(' and ') || 'stay fit'}.
Address them by name occasionally. Keep your responses short and punchy, suitable for a mobile app chat interface.`
    };

    // Add a welcome message from the assistant
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello ${user?.displayName || 'Champion'}! I'm your FIZI AI Coach. How can I help you crush your fitness goals today? 💪`
    };

    setMessages([systemPrompt, welcomeMessage]);
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Groq API
      const responseText = await generateChatResponse(newMessages);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get chat response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I am taking a quick breather. Please check your internet connection and try again!',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'system') return null; // Don't show system prompt

    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryStart }]}>
            <MaterialCommunityIcons name="robot-outline" size={16} color="#FFF" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser 
            ? { backgroundColor: colors.primaryStart, borderBottomRightRadius: 4 } 
            : { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[styles.messageText, isUser ? { color: '#FFF' } : { color: colors.textPrimary }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>FIZI Coach</Text>
            <View style={[styles.onlineIndicator, { backgroundColor: colors.accentSuccess }]} />
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages.filter(m => m.role !== 'system')}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primaryStart} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Coach is typing...</Text>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.glassSurface, borderTopColor: colors.glassBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)' }]}
              placeholder="Ask me anything about your fitness..."
              placeholderTextColor={colors.textTertiary}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: inputMessage.trim() ? colors.primaryStart : colors.textTertiary }
              ]} 
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  chatContainer: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageWrapperAssistant: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: Layout.borderRadius.m,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.m,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
