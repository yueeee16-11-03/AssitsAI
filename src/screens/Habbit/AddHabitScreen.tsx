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
  Alert,
  Animated,
  Modal,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "AddHabit">;

interface HabitSuggestion {
  id: string;
  name: string;
  icon: string;
  target: number;
  unit: string;
  category: string;
  description: string;
  benefits: string;
}

interface ScheduleItem {
  id: string;
  time: string; // HH:mm format
  daysOfWeek: number[]; // 0-6, 0=Sunday
  reminder: boolean;
}

export default function AddHabitScreen({ navigation }: Props) {
  const addHabit = useHabitStore((state) => state.addHabit);
  const isLoading = useHabitStore((state) => state.isLoading);

  const [habitName, setHabitName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedColor, setSelectedColor] = useState("#6366F1");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: "1", time: "06:00", daysOfWeek: [1, 2, 3, 4, 5, 6, 0], reminder: true },
  ]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState("06:00");
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // icon list removed — unused. If you want an icon picker UI, I can re-add and render it here.
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

  const categories = [
    { id: "health", name: "Sức khỏe", icon: 'arm-flex' },
    { id: "productivity", name: "Năng suất", icon: 'bullseye' },
    { id: "learning", name: "Học tập", icon: 'book-open-variant' },
    { id: "wellness", name: "Tinh thần", icon: 'meditation' },
  ];

  const suggestions: HabitSuggestion[] = [
    {
      id: "1",
      name: "Đọc sách mỗi sáng",
      icon: 'book-open-variant',
      target: 10,
      unit: "phút",
      category: "learning",
      description: "Đọc 10 phút mỗi sáng",
      benefits: "Tăng kiến thức, cải thiện tập trung",
    },
    {
      id: "2",
      name: "Uống đủ nước",
      icon: 'water',
      target: 8,
      unit: "cốc",
      category: "health",
      description: "Uống 8 cốc nước mỗi ngày",
      benefits: "Tốt cho sức khỏe, da dẻ",
    },
    {
      id: "3",
      name: "Thiền buổi tối",
      icon: 'meditation',
      target: 15,
      unit: "phút",
      category: "wellness",
      description: "Thiền 15 phút trước khi ngủ",
      benefits: "Giảm stress, ngủ ngon hơn",
    },
    {
      id: "4",
      name: "Tập thể dục",
      icon: 'arm-flex',
      target: 30,
      unit: "phút",
      category: "health",
      description: "Tập luyện 30 phút mỗi ngày",
      benefits: "Cải thiện sức khỏe, năng lượng",
    },
    {
      id: "5",
      name: "Viết nhật ký",
      icon: 'pencil',
      target: 5,
      unit: "phút",
      category: "wellness",
      description: "Ghi lại suy nghĩ cuối ngày",
      benefits: "Tự nhận thức, giảm lo âu",
    },
    {
      id: "6",
      name: "Đi bộ sau bữa tối",
      icon: 'walk',
      target: 20,
      unit: "phút",
      category: "health",
      description: "Đi bộ nhẹ 20 phút",
      benefits: "Tiêu hóa tốt, thư giãn",
    },
  ];

  const handleSelectSuggestion = (suggestion: HabitSuggestion) => {
    setHabitName(suggestion.name);
    setTarget(suggestion.target.toString());
    setUnit(suggestion.unit);
    setSelectedIcon(suggestion.icon);
    setSelectedCategory(suggestion.category);
  };

  const daysOfWeekName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const toggleDayOfWeek = (dayIndex: number, scheduleId: string) => {
    setSchedule(
      schedule.map((s) => {
        if (s.id !== scheduleId) return s;
        const newDays = s.daysOfWeek.includes(dayIndex)
          ? s.daysOfWeek.filter((d) => d !== dayIndex)
          : [...s.daysOfWeek, dayIndex];
        return { ...s, daysOfWeek: newDays.sort() };
      })
    );
  };

  const addSchedule = () => {
    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      time: "06:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      reminder: true,
    };
    setSchedule([...schedule, newSchedule]);
  };

  const removeSchedule = (scheduleId: string) => {
    setSchedule(schedule.filter((s) => s.id !== scheduleId));
  };

  const handleSaveSchedule = (scheduleId: string) => {
    setSchedule(
      schedule.map((s) =>
        s.id === scheduleId ? { ...s, time: tempTime } : s
      )
    );
    setEditingScheduleId(null);
  };

  const handleSave = async () => {
    if (!habitName.trim() || !target || !unit.trim() || !selectedCategory) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (schedule.length === 0) {
      Alert.alert("Thông báo", "Vui lòng thêm ít nhất một lịch trình");
      return;
    }

    try {
      await addHabit({
        name: habitName,
        icon: selectedIcon,
        color: selectedColor,
        category: selectedCategory,
        target: parseInt(target, 10),
        unit,
        schedule,
        description: "",
      });

      Alert.alert("Thành công", "Đã thêm thói quen mới!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTile} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thói quen</Text>
        <TouchableOpacity style={styles.headerTile} onPress={handleSave}>
          <Icon name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>


          {/* Habit Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin thói quen</Text>

            {/* AI Suggestions */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Icon name="robot" size={24} color="#8B5CF6" style={styles.iconMarginRight} />
                <Text style={styles.aiTitle}>Gợi ý từ AI</Text>
              </View>
              <Text style={styles.aiText}>
                Dựa trên mục tiêu của bạn, AI gợi ý các thói quen sau:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={styles.suggestionCard}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    activeOpacity={0.8}
                  >
                    <Icon name={suggestion.icon} size={32} color="#8B5CF6" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                    <View style={styles.suggestionBadge}>
                      <Text style={styles.suggestionBenefits}>{suggestion.benefits}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Target & Unit */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>Mục tiêu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="#999"
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>Đơn vị</Text>
                <TextInput
                  style={styles.input}
                  placeholder="phút"
                  placeholderTextColor="#999"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Màu sắc</Text>
              <View style={styles.colorsGrid}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Icon name={category.icon} size={20} color={selectedCategory === category.id ? selectedColor : '#9CA3AF'} style={styles.iconMarginRight} />
                    <Text
                      style={[
                        styles.categoryName,
                        selectedCategory === category.id && styles.categoryNameActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Schedule Section */}
            <View style={styles.inputContainer}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.label}>Lịch trình sinh hoạt</Text>
                <TouchableOpacity
                  style={styles.addScheduleButton}
                  onPress={addSchedule}
                >
                  <Text style={styles.addScheduleText}>+ Thêm</Text>
                </TouchableOpacity>
              </View>

              {schedule.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có lịch trình. Hãy thêm một.</Text>
              ) : (
                schedule.map((item) => (
                  <View key={item.id} style={styles.scheduleCard}>
                    {/* Time */}
                    <View style={styles.scheduleTimeRow}>
                      <TouchableOpacity
                        style={styles.timeDisplay}
                        onPress={() => {
                          setEditingScheduleId(item.id);
                          setTempTime(item.time);
                          setShowScheduleModal(true);
                        }}
                      >
                        <Icon name="clock-outline" size={16} color="#00796B" />
                        <Text style={[styles.timeText, styles.ml8]}>{item.time}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteScheduleButton}
                        onPress={() => removeSchedule(item.id)}
                      >
                        <Icon name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Days of Week */}
                    <View style={styles.daysGrid}>
                      {daysOfWeekName.map((dayName, dayIndex) => (
                        <TouchableOpacity
                          key={dayIndex}
                          style={[
                            styles.dayButton,
                            item.daysOfWeek.includes(dayIndex) &&
                              styles.dayButtonActive,
                          ]}
                          onPress={() => toggleDayOfWeek(dayIndex, item.id)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              item.daysOfWeek.includes(dayIndex) &&
                                styles.dayTextActive,
                            ]}
                          >
                            {dayName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Reminder */}
                    <TouchableOpacity
                      style={styles.reminderToggle}
                      onPress={() =>
                        setSchedule(
                          schedule.map((s) =>
                            s.id === item.id
                              ? { ...s, reminder: !s.reminder }
                              : s
                          )
                        )
                      }
                    >
                      <Icon name={item.reminder ? 'bell' : 'bell-off'} size={16} color="#10B981" />
                      <Text style={[styles.reminderText, styles.ml8]}>Nhắc nhở</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Xem trước</Text>
            <View style={[styles.previewHabit, { borderColor: selectedColor }]}>
              <View style={[styles.previewIconContainer, { backgroundColor: `${selectedColor}22` }]}>
                <Icon name={selectedIcon} size={24} color={selectedColor} />
              </View>
              <View style={styles.previewDetails}>
                <Text style={styles.previewName}>{habitName || "Tên thói quen"}</Text>
                <Text style={styles.previewTarget}>
                  0/{target || "0"} {unit || "đơn vị"}
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              styles.createButtonActive,
              isLoading ? styles.disabledOpacity : null,
            ]}
            onPress={handleSave}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? "Đang lưu..." : "Tạo thói quen"}
            </Text>
            <Icon name="check" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn giờ</Text>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Giờ</Text>
                <TextInput
                  style={styles.timeInputField}
                  placeholder="00"
                  placeholderTextColor="#999"
                  maxLength={2}
                  keyboardType="number-pad"
                  value={tempTime.split(":")[0]}
                  onChangeText={(value) => {
                    const minutes = tempTime.split(":")[1];
                    const hour = value.padStart(2, "0");
                    if (parseInt(hour, 10) <= 23) {
                      setTempTime(`${hour}:${minutes}`);
                    }
                  }}
                />
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Phút</Text>
                <TextInput
                  style={styles.timeInputField}
                  placeholder="00"
                  placeholderTextColor="#999"
                  maxLength={2}
                  keyboardType="number-pad"
                  value={tempTime.split(":")[1]}
                  onChangeText={(value) => {
                    const hour = tempTime.split(":")[0];
                    const minute = value.padStart(2, "0");
                    if (parseInt(minute, 10) <= 59) {
                      setTempTime(`${hour}:${minute}`);
                    }
                  }}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={() => {
                  handleSaveSchedule(editingScheduleId!);
                  setShowScheduleModal(false);
                }}
              >
                <Text style={styles.modalButtonTextWhite}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#10B981" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00796B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  saveButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#10B981', borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center' },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  aiCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#000000" },
  aiText: { fontSize: 14, color: "#333333", marginBottom: 16 },
  suggestionsScroll: { marginHorizontal: -20 },
  suggestionCard: { width: 180, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginLeft: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  suggestionIconOld: { fontSize: 32, marginBottom: 8 },
  suggestionName: { fontSize: 14, fontWeight: "800", color: "#000000", marginBottom: 4 },
  suggestionDescription: { fontSize: 12, color: "#333333", marginBottom: 8 },
  suggestionBadge: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 6 },
  suggestionBenefits: { fontSize: 10, color: "#8B5CF6", fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#000000", marginBottom: 8 },
  input: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, color: "#000000", fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", gap: 12 },
  iconsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  iconButton: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  iconButtonActive: { borderColor: "#6366F1", backgroundColor: "#F3F4F6" },
  colorsGrid: { flexDirection: "row", gap: 12 },
  colorButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: "transparent" },
  colorButtonActive: { borderColor: "#00897B" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 2, borderColor: "transparent" },
  categoryButtonActive: { borderColor: "#6366F1", backgroundColor: "#F3F4F6" },
  categoryIcon: { fontSize: 24, marginRight: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#333333" },
  categoryNameActive: { color: "#000000" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addScheduleButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#6366F1", borderRadius: 8 },
  addScheduleText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" },
  scheduleCard: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  scheduleTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeDisplay: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  timeText: { color: "#000000", fontWeight: "700", fontSize: 14, marginLeft: 6 },
  deleteScheduleButton: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteScheduleText: { fontSize: 18 },
  daysGrid: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "space-between" },
  dayButton: { width: "13%", paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  dayButtonActive: { backgroundColor: "rgba(99,102,241,0.2)", borderColor: "#6366F1" },
  dayText: { color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 11 },
  dayTextActive: { color: "#00796B" },
  reminderToggle: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  reminderText: { color: "#10B981", fontWeight: "700", fontSize: 13, marginLeft: 6 },
  previewCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  previewTitle: { fontSize: 14, fontWeight: "700", color: "#333333", marginBottom: 12 },
  previewHabit: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E5E7EB' },
  previewIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12 },
  previewIcon: { fontSize: 24 },
  previewDetails: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 4 },
  previewTarget: { fontSize: 13, color: "#333333" },
  createButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 16, padding: 18 },
  createButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginRight: 8 },
  createButtonIcon: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  iconMarginRight: { marginRight: 8 },
  suggestionIcon: { marginBottom: 8 },
  flex1: { flex: 1 },
  ml8: { marginLeft: 8 },
  createButtonActive: { backgroundColor: '#10B981', borderWidth: 1, borderColor: '#10B981' },
  disabledOpacity: { opacity: 0.6 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#1A1F3A", borderRadius: 16, padding: 24, width: "80%", maxWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#00796B", marginBottom: 20, textAlign: "center" },
  timePickerContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 24 },
  timeInput: { alignItems: "center" },
  timeLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: "700" },
  timeInputField: { width: 60, height: 50, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#333333", fontSize: 20, fontWeight: "700", textAlign: "center" },
  timeSeparator: { fontSize: 24, color: "#00796B", fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButtonCancel: { flex: 1, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, alignItems: "center" },
  modalButtonSave: { flex: 1, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 8, alignItems: "center" },
  modalButtonText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 14 },
  modalButtonTextWhite: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
