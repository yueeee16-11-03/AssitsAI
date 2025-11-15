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
  Modal,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "EditHabit">;

interface ScheduleItem {
  id: string;
  time: string;
  daysOfWeek: number[];
  reminder: boolean;
}

const daysOfWeekName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function EditHabitScreen({ navigation, route }: Props) {
  const { habitId } = route.params as { habitId: string };

  const habits = useHabitStore((state) => state.habits);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const isLoading = useHabitStore((state) => state.isLoading);

  const [habit, setHabit] = useState<any>(null);
  const [habitName, setHabitName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedColor, setSelectedColor] = useState("#6366F1");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState("06:00");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lấy thói quen từ store
  useFocusEffect(
    React.useCallback(() => {
      console.log("📄 [EDIT-HABIT] Screen focused - loading habit:", habitId);
      const foundHabit = habits.find((h: any) => h.id === habitId);
      if (foundHabit) {
        setHabit(foundHabit);
        setHabitName(foundHabit.name);
        setTarget(foundHabit.target?.toString() || "");
        setUnit(foundHabit.unit || "");
        setSelectedIcon(foundHabit.icon || "⭐");
        setSelectedColor(foundHabit.color || "#6366F1");
        setSelectedCategory(foundHabit.category || "");
        setSchedule(foundHabit.schedule || []);
      }
    }, [habitId, habits])
  );

  const icons = [
    "water",
    "walk",
    "book-open-variant",
    "meditation",
    "arm-flex",
    "food-apple",
    "weather-night",
    "bullseye",
    "pencil",
    "music",
    "run",
    "brain",
  ];
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
  const categories = [
    { id: "health", name: "Sức khỏe", icon: "arm-flex" },
    { id: "productivity", name: "Năng suất", icon: "bullseye" },
    { id: "learning", name: "Học tập", icon: "book-open-variant" },
    { id: "wellness", name: "Tinh thần", icon: "meditation" },
  ];

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
      await updateHabit(habitId, {
        name: habitName,
        icon: selectedIcon,
        color: selectedColor,
        category: selectedCategory,
        target: parseInt(target, 10),
        unit,
        schedule,
      });

      Alert.alert("Thành công", "Đã cập nhật thói quen!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    console.log("🗑️ [EDIT-HABIT] Deleting habit:", habitId);

    try {
      await deleteHabit(habitId);

      console.log("✅ [EDIT-HABIT] Habit deleted successfully");

      Alert.alert("Thành công", "Đã xóa thói quen!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("❌ [EDIT-HABIT] Error deleting habit:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  if (!habit) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa thói quen</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa thói quen</Text>
        <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Icon name="trash-can-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          {/* Icon Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Biểu tượng</Text>
            <View style={styles.iconsGrid}>
              {icons.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconButton, selectedIcon === ic && styles.iconButtonActive]}
                  onPress={() => setSelectedIcon(ic)}
                >
                  <Icon name={ic} size={28} color={selectedIcon === ic ? "#FFFFFF" : "#111827"} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Habit Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên thói quen</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Đọc sách mỗi sáng"
              placeholderTextColor="#999"
              value={habitName}
              onChangeText={setHabitName}
            />
          </View>

          {/* Target & Unit */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
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
            <View style={[styles.inputContainer, { flex: 1 }]}>
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
                  <Icon name={category.icon} size={20} color={selectedCategory === category.id ? selectedColor : "#111827"} style={{ marginRight: 8 }} />
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
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="clock-outline" size={16} color={selectedColor} />
                      <Text style={[styles.timeText, { marginLeft: 8 }]}>{item.time}</Text>
                    </View>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name={item.reminder ? 'bell' : 'bell-off'} size={16} color="#10B981" />
                    <Text style={[styles.reminderText, { marginLeft: 8 }]}>{"Nhắc nhở"}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Stats */}
        {habit && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Thống kê</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{habit.currentStreak || 0}</Text>
                <Text style={styles.statLabel}>Chuỗi hiện tại</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{habit.bestStreak || 0}</Text>
                <Text style={styles.statLabel}>Chuỗi tốt nhất</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{habit.completedDates?.length || 0}</Text>
                <Text style={styles.statLabel}>Lần hoàn thành</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: selectedColor, opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="content-save" size={18} color="#FFFFFF" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="trash-can-outline" size={16} color="#EF4444" />
              <Text style={[styles.deleteButtonText, { marginLeft: 8 }]}>Xóa thói quen</Text>
            </View>
          </TouchableOpacity>
        </View>
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Xóa thói quen?</Text>
            <Text style={styles.confirmMessage}>
              Bạn có chắc muốn xóa thói quen "{habitName}"? Hành động này không thể hoàn tác.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmDelete, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                disabled={isLoading}
              >
                <Text style={styles.confirmDeleteText}>
                  {isLoading ? "Đang xóa..." : "Xóa"}
                </Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#10B981", borderBottomWidth: 0 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  deleteHeaderButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  deleteHeaderIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", flex: 1, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#6B7280", fontSize: 16 },
  content: { padding: 16, backgroundColor: "#FFFFFF" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },
  input: { backgroundColor: "#F3F4F6", borderRadius: 12, padding: 16, color: "#111827", fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", gap: 12 },
  iconsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  iconButton: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  iconButtonActive: { borderColor: "#6366F1", backgroundColor: "#6366F1" },
  iconText: { fontSize: 28 },
  colorsGrid: { flexDirection: "row", gap: 12 },
  colorButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: "transparent" },
  colorButtonActive: { borderColor: "#10B981" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, borderWidth: 2, borderColor: "transparent" },
  categoryButtonActive: { borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  categoryIcon: { fontSize: 24, marginRight: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  categoryNameActive: { color: "#111827" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addScheduleButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#6366F1", borderRadius: 8 },
  addScheduleText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "#6B7280", fontSize: 13, fontStyle: "italic" },
  scheduleCard: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  scheduleTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeDisplay: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#EEF2FF", borderRadius: 8 },
  timeText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  deleteScheduleButton: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteScheduleText: { fontSize: 18 },
  daysGrid: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "space-between" },
  dayButton: { width: "13%", paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  dayButtonActive: { backgroundColor: "#EEF2FF", borderColor: "#6366F1" },
  dayText: { color: "#6B7280", fontWeight: "700", fontSize: 11 },
  dayTextActive: { color: "#111827" },
  reminderToggle: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#ECFDF5", borderRadius: 8, alignItems: "center" },
  reminderText: { color: "#10B981", fontWeight: "700", fontSize: 13 },
  statsSection: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" },
  statsTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#EEF2FF", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  statNumber: { fontSize: 24, fontWeight: "800", color: "#6366F1", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  buttonGroup: { gap: 12, marginBottom: 24 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  deleteButton: { paddingVertical: 16, backgroundColor: "#FFF1F2", borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#FEE2E2" },
  deleteButtonText: { color: "#EF4444", fontSize: 16, fontWeight: "700" },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, width: "80%", maxWidth: 300, borderWidth: 1, borderColor: "#E5E7EB" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 20, textAlign: "center" },
  timePickerContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 24 },
  timeInput: { alignItems: "center" },
  timeLabel: { fontSize: 12, color: "#6B7280", marginBottom: 6, fontWeight: "700" },
  timeInputField: { width: 60, height: 50, backgroundColor: "#F3F4F6", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", color: "#111827", fontSize: 20, fontWeight: "700", textAlign: "center" },
  timeSeparator: { fontSize: 24, color: "#111827", fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButtonCancel: { flex: 1, paddingVertical: 12, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center" },
  modalButtonSave: { flex: 1, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 8, alignItems: "center" },
  modalButtonText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  modalButtonTextWhite: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  // Confirm modal
  confirmModal: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, width: "85%", maxWidth: 320, borderWidth: 1, borderColor: "#E5E7EB" },
  confirmTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 12 },
  confirmMessage: { fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 20 },
  confirmButtons: { flexDirection: "row", gap: 12 },
  confirmCancel: { flex: 1, paddingVertical: 12, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center" },
  confirmDelete: { flex: 1, paddingVertical: 12, backgroundColor: "#EF4444", borderRadius: 8, alignItems: "center" },
  confirmCancelText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  confirmDeleteText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
