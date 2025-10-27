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
  const [selectedIcon, setSelectedIcon] = useState("⭐");
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

  const icons = ["💧", "🚶", "📚", "🧘", "💪", "🥗", "😴", "🎯", "✍️", "🎵", "🏃", "🧠"];
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
  const categories = [
    { id: "health", name: "Sức khỏe", icon: "💪" },
    { id: "productivity", name: "Năng suất", icon: "🎯" },
    { id: "learning", name: "Học tập", icon: "📚" },
    { id: "wellness", name: "Tinh thần", icon: "🧘" },
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
            <Text style={styles.backIcon}>←</Text>
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa thói quen</Text>
        <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Text style={styles.deleteHeaderIcon}>🗑️</Text>
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
              {icons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconButton, selectedIcon === icon && styles.iconButtonActive]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
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
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
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
                    <Text style={styles.timeText}>⏰ {item.time}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteScheduleButton}
                    onPress={() => removeSchedule(item.id)}
                  >
                    <Text style={styles.deleteScheduleText}>🗑️</Text>
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
                  <Text style={styles.reminderText}>
                    {item.reminder ? "🔔" : "🔕"} Nhắc nhở
                  </Text>
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
            <Text style={styles.saveButtonText}>
              {isLoading ? "Đang lưu..." : "💾 Lưu thay đổi"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>🗑️ Xóa thói quen</Text>
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
  container: { flex: 1, backgroundColor: "#0A0E27" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#fff" },
  deleteHeaderButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" },
  deleteHeaderIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 16 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  row: { flexDirection: "row", gap: 12 },
  iconsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  iconButton: { width: 56, height: 56, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  iconButtonActive: { borderColor: "#6366F1", backgroundColor: "rgba(99,102,241,0.1)" },
  iconText: { fontSize: 28 },
  colorsGrid: { flexDirection: "row", gap: 12 },
  colorButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: "transparent" },
  colorButtonActive: { borderColor: "#fff" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, borderWidth: 2, borderColor: "transparent" },
  categoryButtonActive: { borderColor: "#6366F1", backgroundColor: "rgba(99,102,241,0.1)" },
  categoryIcon: { fontSize: 24, marginRight: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  categoryNameActive: { color: "#fff" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addScheduleButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#6366F1", borderRadius: 8 },
  addScheduleText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" },
  scheduleCard: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  scheduleTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeDisplay: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 8 },
  timeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  deleteScheduleButton: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteScheduleText: { fontSize: 18 },
  daysGrid: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "space-between" },
  dayButton: { width: "13%", paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  dayButtonActive: { backgroundColor: "rgba(99,102,241,0.2)", borderColor: "#6366F1" },
  dayText: { color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 11 },
  dayTextActive: { color: "#fff" },
  reminderToggle: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 8, alignItems: "center" },
  reminderText: { color: "#10B981", fontWeight: "700", fontSize: 13 },
  statsSection: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, marginBottom: 24 },
  statsTitle: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "rgba(99,102,241,0.1)", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  statNumber: { fontSize: 24, fontWeight: "800", color: "#6366F1", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  buttonGroup: { gap: 12, marginBottom: 24 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteButton: { paddingVertical: 16, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  deleteButtonText: { color: "#EF4444", fontSize: 16, fontWeight: "700" },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#1A1F3A", borderRadius: 16, padding: 24, width: "80%", maxWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 20, textAlign: "center" },
  timePickerContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 24 },
  timeInput: { alignItems: "center" },
  timeLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: "700" },
  timeInputField: { width: 60, height: 50, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  timeSeparator: { fontSize: 24, color: "#fff", fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButtonCancel: { flex: 1, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, alignItems: "center" },
  modalButtonSave: { flex: 1, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 8, alignItems: "center" },
  modalButtonText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 14 },
  modalButtonTextWhite: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Confirm modal
  confirmModal: { backgroundColor: "#1A1F3A", borderRadius: 16, padding: 24, width: "85%", maxWidth: 320 },
  confirmTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 12 },
  confirmMessage: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 24, lineHeight: 20 },
  confirmButtons: { flexDirection: "row", gap: 12 },
  confirmCancel: { flex: 1, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, alignItems: "center" },
  confirmDelete: { flex: 1, paddingVertical: 12, backgroundColor: "#EF4444", borderRadius: 8, alignItems: "center" },
  confirmCancelText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 14 },
  confirmDeleteText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
