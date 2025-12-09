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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAIChatStore } from '../../store/aiChatStore';
import ChatApi from '../../api/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;

export default function AIChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
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

    // Send to Gemini AI
    const response = await ChatApi.sendMessage(userMessage);
    
    if (response.message) {
      addMessage(response.message);
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
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Icon name="dots-vertical" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
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
                <View style={styles.aiAvatar}>
                  <Icon name="robot" size={16} color="#6366F1" />
                </View>
              )}
              <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                  {message.text}
                </Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {isUser && (
                <View style={styles.userAvatar}>
                  <Icon name="account" size={16} color="#8B5CF6" />
                </View>
              )}
            </View>
          );
        })}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.aiAvatar}>
              <Icon name="robot" size={16} color="#6366F1" />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
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

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={handleVoice}
              activeOpacity={0.8}
            >
                <Icon name={isRecording ? 'stop-circle' : 'microphone'} size={18} color={isRecording ? '#EF4444' : '#111827'} />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Icon name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ChatApi.getSuggestions().map((suggestion, index) => {
            const iconMap = ChatApi.getSuggestionIconMap();
            const iconName = iconMap[suggestion] || 'lightbulb';
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => setInputText(suggestion)}
              >
                <Icon name={iconName} size={14} color="#9CA3AF" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            );
          })}
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
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNewChat}
            >
              <Icon name="plus-circle" size={18} color="#6366F1" />
              <Text style={styles.menuItemText}>Chat mới</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShowHistory}
            >
              <Icon name="history" size={18} color="#6366F1" />
              <Text style={styles.menuItemText}>Lịch sử</Text>
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
        <SafeAreaView style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <TouchableOpacity
              style={styles.historyBackButton}
              onPress={() => setShowHistory(false)}
            >
              <Icon name="chevron-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.historyTitle}>Lịch sử chat</Text>
        <View style={styles.historyPlaceholder} />
          </View>

          {chatHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Icon name="history" size={48} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>Chưa có lịch sử chat</Text>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => handleSelectHistory(item)}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemTitle}>{item.title}</Text>
                    <Text style={styles.historyItemDate}>{item.date}</Text>
                    <Text style={styles.historyItemCount}>{item.messageCount} tin nhắn</Text>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#111827",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 24,
    color: "#111827",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6366F1",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8B5CF6",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#EEF2FF",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#111827",
  },
  aiText: {
    color: "#111827",
  },
  timestamp: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B7280",
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    maxHeight: 100,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  voiceButtonActive: {
    backgroundColor: "#FEE2E2",
  },
  voiceIcon: {
    fontSize: 18,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(16,185,129,0.3)",
  },
  sendIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  suggestionChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionIcon: {
    marginRight: 6,
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
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
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
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  historyItemCount: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#9CA3AF',
  },
  historyPlaceholder: {
    width: 40,
  },
  footerSpacer: {
    height: 70,
  },
});