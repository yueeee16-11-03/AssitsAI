import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "HelpCenter">;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function HelpCenterScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý hướng dẫn. Bạn cần giúp đỡ gì?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const categories = [
    { id: "all", name: "Tất cả", icon: "📚" },
    { id: "finance", name: "Tài chính", icon: "💰" },
    { id: "habits", name: "Thói quen", icon: "✓" },
    { id: "ai", name: "AI", icon: "🤖" },
    { id: "family", name: "Gia đình", icon: "👨‍👩‍👧‍👦" },
  ];

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "Làm sao để thêm giao dịch tài chính?",
      answer: "Vào màn hình Tài chính → Nhấn nút '+' → Chọn loại giao dịch (Thu/Chi) → Nhập số tiền và danh mục → Lưu",
      category: "finance",
    },
    {
      id: "2",
      question: "AI phân tích chi tiêu như thế nào?",
      answer: "AI sẽ phân tích lịch sử chi tiêu của bạn, so sánh với ngân sách và đưa ra gợi ý tiết kiệm phù hợp. Bạn có thể xem phân tích chi tiết tại màn hình AI Insights.",
      category: "ai",
    },
    {
      id: "3",
      question: "Cách tạo thói quen mới?",
      answer: "Vào Thói quen → Nhấn '+' → Chọn icon và tên → Đặt mục tiêu (số lần/ngày) → Chọn thời gian nhắc nhở → Lưu",
      category: "habits",
    },
    {
      id: "4",
      question: "Làm sao để chia sẻ mục tiêu với gia đình?",
      answer: "Vào Gia đình → Mục tiêu chung → Nhấn '+' → Nhập thông tin mục tiêu → Chọn thành viên đóng góp → AI sẽ tự động gợi ý phân bổ công bằng",
      category: "family",
    },
    {
      id: "5",
      question: "Tùy chỉnh giọng nói AI ở đâu?",
      answer: "Vào Cài đặt → Cài đặt AI → Chọn giọng nói (Nam/Nữ/Trung tính) → Điều chỉnh tốc độ → Lưu",
      category: "ai",
    },
    {
      id: "6",
      question: "Làm sao xem báo cáo chi tiêu tháng?",
      answer: "Vào Tài chính → Báo cáo → Chọn tháng → Xem chi tiết theo danh mục, biểu đồ và AI insights",
      category: "finance",
    },
  ];

  const quickActions = [
    { icon: "🎯", title: "Hướng dẫn bắt đầu", description: "Thiết lập tài khoản lần đầu" },
    { icon: "💡", title: "Mẹo sử dụng", description: "Tips & tricks hữu ích" },
    { icon: "🎥", title: "Video hướng dẫn", description: "Xem video demo" },
    { icon: "📞", title: "Liên hệ hỗ trợ", description: "Chat với team support" },
  ];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        isBot: true,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, botResponse]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    if (input.includes("chi tiêu") || input.includes("giao dịch")) {
      return "Để thêm giao dịch: Vào Tài chính → Nhấn '+' → Nhập thông tin → Lưu. Bạn có thể dùng giọng nói để nhập nhanh!";
    }
    if (input.includes("thói quen") || input.includes("habit")) {
      return "Tạo thói quen mới: Thói quen → '+' → Chọn icon → Đặt mục tiêu. AI sẽ gợi ý thời gian tối ưu!";
    }
    if (input.includes("ai") || input.includes("trợ lý")) {
      return "AI Assistant có thể: Phân tích chi tiêu, gợi ý tiết kiệm, nhắc nhở thói quen, dự đoán ngân sách. Hãy thử hỏi tôi bất cứ điều gì!";
    }
    return "Cảm ơn câu hỏi! Bạn có thể xem FAQ bên dưới hoặc liên hệ support để được hỗ trợ chi tiết hơn.";
  };

  const filteredFAQs = selectedCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp</Text>
        <TouchableOpacity style={styles.chatToggle} onPress={() => setShowChat(!showChat)}>
          <Text style={styles.chatToggleIcon}>{showChat ? "📚" : "💬"}</Text>
        </TouchableOpacity>
      </View>

      {showChat ? (
        // Chat Interface
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {chatMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
                  ]}
                >
                  {message.isBot && <Text style={styles.botAvatar}>🤖</Text>}
                  <View
                    style={[
                      styles.messageBubble,
                      message.isBot ? styles.botBubble : styles.userBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isBot ? styles.botText : styles.userText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Nhập câu hỏi..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // FAQ Interface
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Quick Actions */}
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity key={index} style={styles.quickActionCard}>
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* FAQ List */}
            <View style={styles.faqSection}>
              <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
              {filteredFAQs.map((faq) => (
                <View key={faq.id} style={styles.faqCard}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              ))}
            </View>

            {/* Contact Support */}
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportIcon}>💬</Text>
              <Text style={styles.supportText}>Chat với chatbot hướng dẫn</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  chatToggle: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  chatToggleIcon: { fontSize: 20 },
  content: { padding: 16 },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  quickActionCard: { flex: 1, minWidth: "45%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  quickActionIcon: { fontSize: 32, marginBottom: 8 },
  quickActionTitle: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 4, textAlign: "center" },
  quickActionDescription: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  categoriesScroll: { paddingBottom: 16 },
  categoryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  categoryChipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  categoryTextActive: { color: "#FFFFFF" },
  faqSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  faqCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: "#6366F1" },
  faqQuestion: { fontSize: 15, fontWeight: "700", color: "#00796B", marginBottom: 8 },
  faqAnswer: { fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 },
  supportButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  supportIcon: { fontSize: 24, marginRight: 8 },
  supportText: { color: "#8B5CF6", fontSize: 16, fontWeight: "700" },
  chatContainer: { flex: 1 },
  chatMessages: { flex: 1 },
  chatMessagesContent: { padding: 16 },
  messageContainer: { marginBottom: 16, flexDirection: "row", alignItems: "flex-end" },
  botMessageContainer: { justifyContent: "flex-start" },
  userMessageContainer: { justifyContent: "flex-end" },
  botAvatar: { fontSize: 28, marginRight: 8 },
  messageBubble: { maxWidth: "75%", borderRadius: 16, padding: 12 },
  botBubble: { backgroundColor: "rgba(139,92,246,0.2)", borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: "#6366F1", borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  botText: { color: "rgba(255,255,255,0.9)" },
  userText: { color: "#FFFFFF" },
  chatInputContainer: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  chatInput: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#333333", fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { backgroundColor: "rgba(99,102,241,0.3)" },
  sendIcon: { fontSize: 20, color: "#FFFFFF", fontWeight: "700" },
});
