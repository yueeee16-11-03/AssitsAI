import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AISetting">;

export default function AISettingScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Personality Settings
  const [friendliness, setFriendliness] = useState(70);
  const [formality, setFormality] = useState(50);
  const [creativity, setCreativity] = useState(60);
  
  // Voice Settings
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female" | "neutral">("female");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Language & Region
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi");
  const [autoDetect, setAutoDetect] = useState(false);
  
  // Advanced
  const [contextMemory, setContextMemory] = useState(true);
  const [proactiveMode, setProactiveMode] = useState(true);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const voices = [
    { id: "female", name: "Nữ", icon: "👩", description: "Giọng nữ nhẹ nhàng" },
    { id: "male", name: "Nam", icon: "👨", description: "Giọng nam trầm ấm" },
    { id: "neutral", name: "Trung tính", icon: "🤖", description: "Giọng AI chuẩn" },
  ];

  const languages = [
    { id: "vi", name: "Tiếng Việt", icon: "🇻🇳" },
    { id: "en", name: "English", icon: "🇬🇧" },
  ];

  const renderSlider = (
    value: number,
    onChange: (val: number) => void,
    min: string,
    max: string
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{min}</Text>
        <Text style={styles.sliderValue}>{value}%</Text>
        <Text style={styles.sliderLabel}>{max}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderThumb, { left: `${value}%` }]} />
      </View>
      <View style={styles.sliderButtons}>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onChange(Math.max(0, value - 10))}
        >
          <Text style={styles.sliderButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onChange(Math.min(100, value + 10))}
        >
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt AI</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* AI Preview */}
          <View style={styles.previewCard}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>AI</Text>
            </View>
            <Text style={styles.previewTitle}>Xin chào! Tôi là AI Assistant</Text>
            <Text style={styles.previewText}>
              Với cài đặt hiện tại, tôi sẽ giao tiếp một cách{" "}
              {friendliness > 70 ? "thân thiện" : friendliness > 40 ? "vừa phải" : "chuyên nghiệp"},{" "}
              {formality > 70 ? "trang trọng" : formality > 40 ? "cân bằng" : "thoải mái"} và{" "}
              {creativity > 70 ? "sáng tạo" : creativity > 40 ? "linh hoạt" : "logic"}.
            </Text>
          </View>

          {/* Personality Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Tính cách AI</Text>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Độ thân thiện</Text>
              <Text style={styles.settingDescription}>
                Mức độ thân thiện và gần gũi trong giao tiếp
              </Text>
              {renderSlider(friendliness, setFriendliness, "Nghiêm túc", "Thân thiện")}
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Độ trang trọng</Text>
              <Text style={styles.settingDescription}>
                Phong cách giao tiếp chính thức hay thoải mái
              </Text>
              {renderSlider(formality, setFormality, "Thoải mái", "Trang trọng")}
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Độ sáng tạo</Text>
              <Text style={styles.settingDescription}>
                Mức độ sáng tạo trong câu trả lời
              </Text>
              {renderSlider(creativity, setCreativity, "Logic", "Sáng tạo")}
            </View>
          </View>

          {/* Voice Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎤 Giọng nói</Text>
              <Switch
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            {voiceEnabled && (
              <>
                <View style={styles.voiceGrid}>
                  {voices.map((voice) => (
                    <TouchableOpacity
                      key={voice.id}
                      style={[
                        styles.voiceCard,
                        selectedVoice === voice.id && styles.voiceCardActive,
                      ]}
                      onPress={() => setSelectedVoice(voice.id as any)}
                    >
                      <Text style={styles.voiceIcon}>{voice.icon}</Text>
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      <Text style={styles.voiceDescription}>{voice.description}</Text>
                      {selectedVoice === voice.id && (
                        <View style={styles.checkMark}>
                          <Text style={styles.checkMarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.settingCard}>
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Tốc độ giọng nói</Text>
                    <Text style={styles.speedValue}>{voiceSpeed.toFixed(1)}x</Text>
                  </View>
                  <View style={styles.speedButtons}>
                    <TouchableOpacity
                      style={[styles.speedButton, voiceSpeed === 0.75 && styles.speedButtonActive]}
                      onPress={() => setVoiceSpeed(0.75)}
                    >
                      <Text style={[styles.speedButtonText, voiceSpeed === 0.75 && styles.speedButtonTextActive]}>
                        0.75x
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.speedButton, voiceSpeed === 1.0 && styles.speedButtonActive]}
                      onPress={() => setVoiceSpeed(1.0)}
                    >
                      <Text style={[styles.speedButtonText, voiceSpeed === 1.0 && styles.speedButtonTextActive]}>
                        1.0x
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.speedButton, voiceSpeed === 1.25 && styles.speedButtonActive]}
                      onPress={() => setVoiceSpeed(1.25)}
                    >
                      <Text style={[styles.speedButtonText, voiceSpeed === 1.25 && styles.speedButtonTextActive]}>
                        1.25x
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.speedButton, voiceSpeed === 1.5 && styles.speedButtonActive]}
                      onPress={() => setVoiceSpeed(1.5)}
                    >
                      <Text style={[styles.speedButtonText, voiceSpeed === 1.5 && styles.speedButtonTextActive]}>
                        1.5x
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Language Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Ngôn ngữ</Text>
            
            <View style={styles.languageGrid}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageCard,
                    selectedLanguage === lang.id && styles.languageCardActive,
                  ]}
                  onPress={() => setSelectedLanguage(lang.id as any)}
                >
                  <Text style={styles.languageIcon}>{lang.icon}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {selectedLanguage === lang.id && (
                    <View style={styles.checkMarkSmall}>
                      <Text style={styles.checkMarkTextSmall}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Tự động phát hiện ngôn ngữ</Text>
                <Text style={styles.toggleDescription}>
                  AI sẽ tự động nhận diện ngôn ngữ bạn sử dụng
                </Text>
              </View>
              <Switch
                value={autoDetect}
                onValueChange={setAutoDetect}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Advanced Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Nâng cao</Text>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Ghi nhớ ngữ cảnh</Text>
                <Text style={styles.toggleDescription}>
                  AI nhớ các cuộc hội thoại trước đó
                </Text>
              </View>
              <Switch
                value={contextMemory}
                onValueChange={setContextMemory}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Chế độ chủ động</Text>
                <Text style={styles.toggleDescription}>
                  AI sẽ chủ động đưa ra gợi ý và nhắc nhở
                </Text>
              </View>
              <Switch
                value={proactiveMode}
                onValueChange={setProactiveMode}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton}>
            <Text style={styles.resetIcon}>🔄</Text>
            <Text style={styles.resetText}>Đặt lại cài đặt mặc định</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#6366F1",
  },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  previewCard: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },
  aiAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(99,102,241,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aiAvatarText: { fontSize: 24, fontWeight: "800", color: "#6366F1" },
  previewTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 8 },
  previewText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  settingCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingLabel: { fontSize: 15, fontWeight: "700", color: "#00796B", marginBottom: 4 },
  settingDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderContainer: { marginTop: 8 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  sliderValue: { fontSize: 13, fontWeight: "700", color: "#6366F1" },
  sliderTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    position: "relative",
    marginBottom: 12,
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    top: -7,
    marginLeft: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sliderButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  sliderButtonText: { color: "#fff", fontWeight: "700" },
  voiceGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  voiceCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  voiceCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  voiceIcon: { fontSize: 32, marginBottom: 8 },
  voiceName: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4 },
  voiceDescription: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  checkMark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMarkText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  speedValue: { fontSize: 14, fontWeight: "700", color: "#6366F1" },
  speedButtons: { flexDirection: "row", gap: 8 },
  speedButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  speedButtonActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  speedButtonText: { color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  speedButtonTextActive: { color: "#fff" },
  languageGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  languageCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  languageCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  languageIcon: { fontSize: 32, marginBottom: 8 },
  languageName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  checkMarkSmall: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMarkTextSmall: { color: "#fff", fontSize: 12, fontWeight: "700" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 },
  toggleDescription: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  resetIcon: { fontSize: 20, marginRight: 8 },
  resetText: { color: "#EF4444", fontWeight: "700" },
});
