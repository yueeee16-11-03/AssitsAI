import React, { useState } from "react";
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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "FamilyChat">;

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  text: string;
  timestamp: Date;
  type: "message" | "ai-suggestion";
}

export default function FamilyChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: { id: "ai", name: "AI Assistant", avatar: "🤖", color: "#8B5CF6" },
      text: "Chào cả nhà! Tôi là AI Assistant. Tôi có thể giúp gia đình lên kế hoạch chung. Hãy thử hỏi tôi nhé!",
      timestamp: new Date(Date.now() - 3600000),
      type: "ai-suggestion",
    },
    {
      id: "2",
      sender: { id: "1", name: "Bố", avatar: "👨", color: "#6366F1" },
      text: "Cuối tuần này chúng ta đi du lịch Đà Lạt nhé!",
      timestamp: new Date(Date.now() - 3000000),
      type: "message",
    },
    {
      id: "3",
      sender: { id: "2", name: "Mẹ", avatar: "👩", color: "#EC4899" },
      text: "Ý kiến hay đấy! Nhưng chúng ta có đủ ngân sách không nhỉ?",
      timestamp: new Date(Date.now() - 2400000),
      type: "message",
    },
    {
      id: "4",
      sender: { id: "ai", name: "AI Assistant", avatar: "🤖", color: "#8B5CF6" },
      text: "💡 AI gợi ý: Du lịch Đà Lạt cần khoảng ₫30M. Hiện quỹ chung có ₫18M. Mỗi người đóng góp thêm:\n• Bố: ₫8M\n• Mẹ: ₫6M\n• Con: ₫4M/người\nDự kiến hoàn thành sau 2 tháng!",
      timestamp: new Date(Date.now() - 1800000),
      type: "ai-suggestion",
    },
    {
      id: "5",
      sender: { id: "3", name: "Con trai", avatar: "👦", color: "#10B981" },
      text: "Em đồng ý! Em sẽ cố gắng tiết kiệm tiền lì xì",
      timestamp: new Date(Date.now() - 1200000),
      type: "message",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: { id: "current", name: "Bạn", avatar: "👤", color: "#6366F1" },
      text: inputText.trim(),
      timestamp: new Date(),
      type: "message",
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate AI response for planning keywords
    const planningKeywords = ["kế hoạch", "lên kế hoạch", "du lịch", "mua", "tiết kiệm", "chi tiêu"];
    if (planningKeywords.some(keyword => inputText.toLowerCase().includes(keyword))) {
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: { id: "ai", name: "AI Assistant", avatar: "🤖", color: "#8B5CF6" },
          text: "💡 Tôi có thể giúp gia đình lên kế hoạch chi tiết! Hãy cho tôi biết:\n1. Mục tiêu là gì?\n2. Ngân sách dự kiến?\n3. Thời gian thực hiện?",
          timestamp: new Date(),
          type: "ai-suggestion",
        };
        setMessages(prev => [...prev, aiResponse]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1500);
    }
  };

  const aiSuggestions = [
    { icon: "✈️", text: "Lên kế hoạch du lịch" },
    { icon: "💰", text: "Phân bổ ngân sách" },
    { icon: "🎯", text: "Tạo mục tiêu chung" },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat gia đình</Text>
          <Text style={styles.headerSubtitle}>4 thành viên • Online</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Text style={styles.infoIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === "ai-suggestion" && styles.aiMessageContainer,
              ]}
            >
              {message.type === "ai-suggestion" ? (
                <View style={styles.aiSuggestionCard}>
                  <View style={styles.aiSuggestionHeader}>
                    <Text style={styles.aiAvatar}>{message.sender.avatar}</Text>
                    <Text style={styles.aiName}>{message.sender.name}</Text>
                  </View>
                  <Text style={styles.aiSuggestionText}>{message.text}</Text>
                  <View style={styles.aiActions}>
                    <TouchableOpacity
                      style={styles.aiActionButton}
                      onPress={() => navigation.navigate("SharedGoal")}
                    >
                      <Text style={styles.aiActionText}>Tạo mục tiêu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.aiActionButton, styles.aiActionButtonSecondary]}>
                      <Text style={styles.aiActionTextSecondary}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.messageWrapper}>
                  <View style={[styles.avatar, { backgroundColor: `${message.sender.color}22` }]}>
                    <Text style={styles.avatarText}>{message.sender.avatar}</Text>
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={styles.senderName}>{message.sender.name}</Text>
                    <View style={styles.messageBubble}>
                      <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                    <Text style={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* AI Suggestions Bar */}
      <View style={styles.suggestionsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {aiSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => setInputText(suggestion.text)}
            >
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  infoButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  infoIcon: { fontSize: 20 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageContainer: { marginBottom: 16 },
  aiMessageContainer: { alignItems: "center" },
  messageWrapper: { flexDirection: "row", maxWidth: "85%" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 8 },
  avatarText: { fontSize: 18 },
  messageContent: { flex: 1 },
  senderName: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  messageBubble: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: "#333333", lineHeight: 20 },
  timestamp: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  aiSuggestionCard: { backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 16, padding: 16, maxWidth: "90%", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  aiSuggestionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiAvatar: { fontSize: 24, marginRight: 8 },
  aiName: { fontSize: 14, fontWeight: "800", color: "#8B5CF6" },
  aiSuggestionText: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 12 },
  aiActions: { flexDirection: "row", gap: 8 },
  aiActionButton: { flex: 1, backgroundColor: "#8B5CF6", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  aiActionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  aiActionButtonSecondary: { backgroundColor: "rgba(255,255,255,0.1)" },
  aiActionTextSecondary: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
  suggestionsBar: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  suggestionChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  suggestionIcon: { fontSize: 14, marginRight: 4 },
  suggestionText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  inputContainer: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  attachButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  attachIcon: { fontSize: 20 },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#333333", fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { backgroundColor: "rgba(99,102,241,0.3)" },
  sendIcon: { fontSize: 20, color: "#00897B", fontWeight: "700" },
});
