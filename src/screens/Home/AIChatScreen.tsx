import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAIChatStore } from '../../store/aiChatStore';
import ChatApi from '../../api/chatApi';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useBudgetStore } from '../../store/budgetStore';
import ChatService from '../../services/ChatService';

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;

export default function AIChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const TAB_BAR_HEIGHT = 70;

  // Theme variables
  const bgColor = theme.colors.background;
  const surfaceColor = theme.colors.surface;
  const textPrimary = theme.colors.onSurface;
  const textSecondary = theme.colors.onSurfaceVariant;
  const borderColor = theme.dark ? '#404040' : 'rgba(0,0,0,0.06)';
  const aiAvatarBg = theme.dark ? 'rgba(99,102,241,0.15)' : '#F3F4F6';
  const userAvatarBg = theme.dark ? 'rgba(139,92,246,0.15)' : '#F3F4F6';
  const userBubbleBg = theme.dark ? 'rgba(99,102,241,0.2)' : '#EEF2FF';
  const aiBubbleBg = theme.dark ? '#2A2D3A' : '#F3F4F6';
  const inputBg = theme.dark ? '#3F4451' : '#F3F4F6';
  const chipBg = theme.dark ? '#3F4451' : '#F3F4F6';
  const chipBorder = theme.dark ? '#4A4D5A' : '#E5E7EB';
  
  // Store state
  const {
    messages,
    inputText,
    isTyping,
    isRecording,
    showMenu,
    chatHistory,
    showHistory,
    addMessage,
    setInputText,
    setIsTyping,
    setIsRecording,
    setShowMenu,
    setShowHistory,
    loadChatHistoryFromFirebase,
    saveChatToFirebase,
    loadChatDetail,
    deleteChatFromFirebase,
  } = useAIChatStore();

  // Financial stores
  const { transactions } = useTransactionStore();
  const { wallets } = useWalletStore();
  const { budgets } = useBudgetStore();

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        console.log('[AIChatScreen] Loading chat history...');
        await loadChatHistoryFromFirebase();
        console.log('[AIChatScreen] Chat history loaded');
      } catch (error) {
        console.error('[AIChatScreen] Error in useEffect:', error);
      }
    };

    loadHistory();

    return () => {
      // Cleanup subscription on unmount
      console.log('[AIChatScreen] Cleaning up chat history subscription');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Get financial context for AI
  const getFinancialContext = () => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Filter transactions for current month
      const monthTransactions = transactions.filter((t: any) => {
        const tDate = new Date(t.createdAt);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });

      // Calculate totals
      const totalIncome = monthTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const totalExpense = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Calculate category expenses
      const categoryExpenses: { [key: string]: number } = {};
      monthTransactions
        .filter((t: any) => t.type === 'expense')
        .forEach((t: any) => {
          categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        });

      // Get top categories
      const topCategories = Object.entries(categoryExpenses)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalExpense) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Get total balance from wallets
      const balance = wallets.reduce((sum: number, w: any) => sum + w.balance, 0);

      // Get monthly budget
      const monthlyBudget = budgets.reduce((sum: number, b: any) => sum + b.limit, 0);

      // Format transactions for context
      const formattedTransactions = monthTransactions
        .slice(0, 10)
        .map((t: any) => ({
          amount: t.amount,
          category: t.category,
          type: t.type as 'income' | 'expense',
          date: new Date(t.createdAt).toLocaleDateString('vi-VN'),
          description: t.description,
        }));

      return {
        totalIncome,
        totalExpense,
        balance,
        categoryExpenses,
        monthlyBudget,
        transactions: formattedTransactions,
        topCategories,
      };
    } catch (error) {
      console.error('[AIChatScreen] Error getting financial context:', error);
      return undefined;
    }
  };

  // Handle send message
  const handleSend = async () => {
    // Validate message
    const validation = ChatApi.validateMessage(inputText);
    if (!validation.valid) {
      Alert.alert('Cảnh báo', validation.error || 'Vui lòng nhập câu hỏi');
      return;
    }

    // Create user message
    const userMessage = ChatApi.createUserMessage(inputText);
    addMessage(userMessage);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Get financial context
    const financialContext = getFinancialContext();
    
    // Send to Gemini AI with context
    const response = financialContext
      ? await ChatService.sendMessageWithContext(userMessage.text, financialContext)
      : await ChatApi.sendMessage(userMessage);
    
    if (response.message) {
      addMessage(response.message);
    } else if (response.error) {
      // Show error message
      addMessage({
        id: (Date.now() + 1).toString(),
        text: `❌ Lỗi: ${response.error}`,
        isUser: false,
        timestamp: new Date(),
      });
    }

    setIsTyping(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Handle voice recording
  const handleVoice = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording logic
    setTimeout(() => {
      if (!isRecording) {
        setInputText("Đây là văn bản từ giọng nói (demo)");
      }
    }, 100);
  };

  // Handle new chat
  const handleNewChat = () => {
    setShowMenu(false);
    Alert.alert(
      'Chat mới',
      'Bạn có chắc muốn bắt đầu một cuộc trò chuyện mới?',
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Lưu chat hiện tại lên Firebase
              const saved = await saveChatToFirebase();
              if (saved) {
                Alert.alert('Thành công', 'Chat đã được lưu. Bắt đầu chat mới!');
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              console.error('[AIChatScreen] Error in handleNewChat:', errorMsg);
              
              // Check if it's a permission error
              if (errorMsg.includes('permission-denied') || errorMsg.includes('Permission')) {
                Alert.alert(
                  'Lỗi quyền',
                  'Không có quyền lưu chat. Vui lòng kiểm tra Firebase Security Rules.',
                  [{ text: 'OK', onPress: () => {} }]
                );
              } else {
                Alert.alert('Lỗi', 'Không thể lưu chat. Vui lòng thử lại.');
              }
            }
          },
        },
      ]
    );
  };

  // Handle show history
  const handleShowHistory = () => {
    setShowMenu(false);
    console.log('[AIChatScreen] Opening history modal. Current history:', chatHistory.length, 'items');
    if (chatHistory.length === 0) {
      console.warn('[AIChatScreen] No chat history found');
    }
    setShowHistory(true);
  };

  // Handle select chat from history
  const handleSelectHistory = async (chat: any) => {
    try {
      const success = await loadChatDetail(chat.id);
      if (!success) {
        Alert.alert('Thông báo', 'Không thể tải chat này');
      }
    } catch (error) {
      console.error('[AIChatScreen] Error loading chat detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chat. Vui lòng thử lại.');
    }
  };

  // Handle delete chat from history
  const handleDeleteHistoryItem = async (id: string) => {
    Alert.alert(
      'Xóa chat',
      'Bạn chắc chắn muốn xóa chat này?',
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              await deleteChatFromFirebase(id);
              // State will auto-update via real-time subscription
            } catch (error) {
              console.error('[AIChatScreen] Error deleting chat:', error);
              Alert.alert('Lỗi', 'Không thể xóa chat. Vui lòng thử lại.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.modernHeader, { backgroundColor: surfaceColor }]}>
        <TouchableOpacity
          style={styles.modernBackButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.modernHeaderCenter}>
          <View style={styles.headerTitleRow}>
            <View style={styles.aiHeaderIcon}>
              <Icon name="robot-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.modernHeaderTitle, { color: textPrimary }]}>AI Tài Chính</Text>
              <Text style={[styles.modernHeaderSubtitle, { color: textSecondary }]}>Trợ lý thông minh</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.modernMenuButton}
          onPress={() => setShowMenu(true)}
        >
          <Icon name="dots-vertical" size={20} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={[styles.messagesContainer, { backgroundColor: bgColor }]}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => {
          const isUser = message.isUser;
          return (
            <View
              key={message.id}
              style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}
            >
              {!isUser && (
                <View style={[styles.modernAiAvatar, { backgroundColor: aiAvatarBg }]}>
                  <Icon name="robot" size={18} color="#6366F1" />
                </View>
              )}
              <View style={[styles.modernMessageBubble, isUser ? [styles.modernUserBubble, { backgroundColor: userBubbleBg }] : [styles.modernAiBubble, { backgroundColor: aiBubbleBg }]]}>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText, { color: textPrimary }]}>
                  {message.text}
                </Text>
                <Text style={[styles.timestamp, { color: textSecondary }]}>
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {isUser && (
                <View style={[styles.modernUserAvatar, { backgroundColor: userAvatarBg }]}>
                  <Icon name="account" size={18} color="#8B5CF6" />
                </View>
              )}
            </View>
          );
        })}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={[styles.modernAiAvatar, { backgroundColor: aiAvatarBg }]}>
              <Icon name="robot" size={18} color="#6366F1" />
            </View>
            <View style={[styles.modernMessageBubble, styles.modernAiBubble, styles.modernTypingBubble, { backgroundColor: aiBubbleBg }]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          </View>
        )}
        <View style={[styles.footerSpacer, { height: insets.bottom + TAB_BAR_HEIGHT }]} />
      </ScrollView>

      <View style={[styles.modernInputContainer, { borderTopColor: borderColor, backgroundColor: bgColor }]}>
        <View style={[styles.modernInputWrapper, { backgroundColor: inputBg }]}>
          <TextInput
            style={[styles.modernInput, { color: textPrimary }]}
            placeholder="Hỏi về tài chính của bạn..."
            placeholderTextColor={textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.modernVoiceButton, isRecording && styles.modernVoiceButtonActive]}
              onPress={handleVoice}
              activeOpacity={0.8}
            >
                <Icon name={isRecording ? 'stop-circle' : 'microphone'} size={20} color={isRecording ? '#EF4444' : textPrimary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <TouchableOpacity
          style={[styles.modernSendButton, !inputText.trim() && styles.modernSendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.modernSuggestionsContainer, { backgroundColor: bgColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScrollContent}>
          {[
            { text: 'Tháng này tôi chi bao nhiêu?', icon: 'cash-multiple' },
            { text: 'Tôi có chi tiêu quá đà không?', icon: 'alert-circle-outline' },
            { text: 'Danh mục nào tôi chi nhiều nhất?', icon: 'chart-pie' },
            { text: 'Phân tích chi tiêu tháng này', icon: 'chart-line' },
            { text: 'Gợi ý tiết kiệm cho tôi', icon: 'piggy-bank' },
            { text: 'Tôi nên tiết kiệm như thế nào?', icon: 'lightbulb-outline' },
          ].map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.modernSuggestionChip, { backgroundColor: chipBg, borderColor: chipBorder }]}
              onPress={() => setInputText(suggestion.text)}
            >
              <View style={styles.suggestionIconWrapper}>
                <Icon name={suggestion.icon} size={16} color="#6366F1" />
              </View>
              <Text style={[styles.modernSuggestionText, { color: textPrimary }]}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: surfaceColor }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNewChat}
            >
              <Icon name="plus-circle" size={18} color="#6366F1" />
              <Text style={[styles.menuItemText, { color: textPrimary }]}>Chat mới</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShowHistory}
            >
              <Icon name="history" size={18} color="#6366F1" />
              <Text style={[styles.menuItemText, { color: textPrimary }]}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={[styles.historyContainer, { backgroundColor: bgColor }]}>
          <View style={[styles.historyHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              style={styles.historyBackButton}
              onPress={() => setShowHistory(false)}
            >
              <Icon name="chevron-left" size={24} color={textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.historyTitle, { color: textPrimary }]}>Lịch sử chat</Text>
        <View style={styles.historyPlaceholder} />
          </View>

          {chatHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Icon name="history" size={48} color={textSecondary} />
              <Text style={[styles.emptyHistoryText, { color: textSecondary }]}>Chưa có lịch sử chat</Text>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.historyItem, { backgroundColor: surfaceColor, borderColor }]}
                  onPress={() => handleSelectHistory(item)}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={[styles.historyItemTitle, { color: textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.historyItemDate, { color: textSecondary }]}>{item.date}</Text>
                    <Text style={[styles.historyItemCount, { color: textSecondary }]}>{item.messageCount} tin nhắn</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.historyItemDelete}
                    onPress={() => handleDeleteHistoryItem(item.id)}
                  >
                    <Icon name="trash-can" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={[styles.historyList, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
            />
          )}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modernHeaderCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  modernHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modernMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  modernAiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  modernUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  modernMessageBubble: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modernUserBubble: {
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  modernAiBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {},
  aiText: {},
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  modernTypingBubble: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366F1",
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  modernInputContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  modernInputWrapper: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modernInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    fontWeight: '500',
  },
  modernVoiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  modernVoiceButtonActive: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  modernSendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  modernSendButtonDisabled: {
    backgroundColor: "rgba(99,102,241,0.3)",
    shadowOpacity: 0,
  },
  modernSuggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionsScrollContent: {
    paddingHorizontal: 4,
  },
  modernSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modernSuggestionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 8,
  },
  menuContainer: {
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    minWidth: 140,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
  },
  historyContainer: {
    flex: 1,
    paddingTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  historyList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyItemDate: {
    fontSize: 12,
    marginTop: 4,
  },
  historyItemCount: {
    fontSize: 12,
    marginTop: 2,
  },
  historyItemDelete: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 15,
  },
  historyPlaceholder: {
    width: 40,
  },
  footerSpacer: {
    height: 70,
  },
});