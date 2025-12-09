import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { generateGeminiText } from "../../services/GeminiAIService";

type Props = NativeStackScreenProps<RootStackParamList, "GeminiTest">;

export default function GeminiTestScreen({ navigation }: Props) {
  const [prompt, setPrompt] = useState("Chào bạn, bạn là ai?");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;

  const handleTest = async () => {
    if (!prompt.trim()) {
      setError("Vui lòng nhập prompt");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      console.log("🚀 [GEMINI_TEST] Gọi Gemini API...");
      console.log("📝 [GEMINI_TEST] Prompt:", prompt);

      const result = await generateGeminiText(prompt);

      console.log("✅ [GEMINI_TEST] Gemini trả về:", result);
      setResponse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      console.error("❌ [DEEPSEEK_TEST] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setResponse("");
    setError("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Gemini API</Text>
        <Text style={styles.headerSubtitle}>Model: gemini-1.5-flash</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        {/* API Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, styles.statusActive]}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusText}>API Key: Đã cấu hình</Text>
          </View>
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhập Prompt</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi hoặc yêu cầu..."
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            editable={!loading}
          />
          <Text style={styles.charCount}>
            {prompt.length} ký tự
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.testButton, loading && styles.buttonDisabled]}
            onPress={handleTest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>🚀 Gửi</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={loading}
          >
            <Text style={styles.buttonTextClear}>🗑️ Xóa</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>❌ Lỗi</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Response */}
        {response && (
          <View style={styles.responseSection}>
            <Text style={styles.responseTitle}>✅ Phản hồi từ Gemini</Text>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>{response}</Text>
            </View>
            <Text style={styles.responseLength}>
              {response.length} ký tự
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Thông tin</Text>
          <Text style={styles.infoText}>
            • Model: gemini-1.5-flash{"\n"}
            • API Key: Hardcoded{"\n"}
            • API: https://ai.google.dev{"\n"}
            • Response time: ~1-3 giây
          </Text>
        </View>

        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#6C63FF",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Status
  statusSection: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
    borderLeftColor: "#4CAF50",
  },
  statusDot: {
    fontSize: 16,
    color: "#4CAF50",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    textAlign: "right",
    fontStyle: "italic",
  },

  // Buttons
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  testButton: {
    backgroundColor: "#6C63FF",
  },
  clearButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonTextClear: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  // Error
  errorSection: {
    marginBottom: 20,
    backgroundColor: "#FFEBEE",
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
    borderRadius: 8,
    padding: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C62828",
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: "#D32F2F",
    lineHeight: 20,
  },

  // Response
  responseSection: {
    marginBottom: 20,
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 10,
  },
  responseBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    marginBottom: 8,
  },
  responseText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  responseLength: {
    fontSize: 12,
    color: "#558B2F",
    fontStyle: "italic",
    textAlign: "right",
  },

  // Info
  infoSection: {
    marginBottom: 20,
    backgroundColor: "#E3F2FD",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#0D47A1",
    lineHeight: 18,
  },

  spacer: {
    height: 20,
  },
});
