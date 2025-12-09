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
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import NotificationService from '../../services/NotificationService';
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
  const [isDaily, setIsDaily] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState("08:00");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState("06:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
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
        // Only keep the first schedule entry (app uses single-schedule mode)
        setSchedule(foundHabit.schedule && foundHabit.schedule.length > 0 ? [foundHabit.schedule[0]] : []);
        // Prefer explicit isDaily flag if present; otherwise infer from schedule having all 7 days
        const firstSchedule = foundHabit.schedule?.[0];
        const inferredIsDaily = !!(firstSchedule && Array.isArray(firstSchedule.daysOfWeek) && firstSchedule.daysOfWeek.length === 7);
        setIsDaily(foundHabit.isDaily ?? inferredIsDaily);
        if (firstSchedule && firstSchedule.daysOfWeek?.length === 7) {
          setDailyReminderTime(firstSchedule.time || "08:00");
        }
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

  // (single schedule mode: use schedule[0] or empty)

  const removeSchedule = (scheduleId: string) => {
    setSchedule(schedule.filter((s) => s.id !== scheduleId));
  };

  // schedule updated directly by native DateTimePicker

  const handleSave = async () => {
    if (!habitName.trim() || !target || !unit.trim() || !selectedCategory) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!isDaily && schedule.length === 0) {
      Alert.alert("Thông báo", "Vui lòng thêm ít nhất một lịch trình");
      return;
    }

    try {
      // Nếu là Hàng ngày, tạo schedule mặc định với giờ đã chọn
      const finalSchedule = isDaily
        ? [{ id: "1", time: dailyReminderTime, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], reminder: true }]
        : schedule;

      console.log('EditHabitScreen: isDaily=', isDaily, 'finalSchedule=', JSON.stringify(finalSchedule));

      // Determine reminder metadata from schedule
      const reminders = finalSchedule.filter(s => s.reminder);
      const hasReminder = reminders.length > 0;
      const reminderTime = hasReminder ? reminders[0].time : null;

      // Call updateHabit which returns result containing updatedId and freshData
      const result = await updateHabit(habitId, {
        name: habitName,
        icon: selectedIcon,
        color: selectedColor,
        category: selectedCategory,
        target: parseInt(target, 10),
        unit,
        schedule: finalSchedule,
        isDaily,
        hasReminder,
        reminderTime,
      });

      const savedId = (result && result.updatedId) ? result.updatedId : habitId;

      // Update notifications: cancel then reschedule if needed
      try {
        // Always cancel existing trigger for this habit id first to avoid duplicates
        await NotificationService.cancelReminder(savedId);

        if (hasReminder) {
          await NotificationService.requestPermission();
          for (const r of reminders) {
            // When editing an existing habit, schedule reminders for the exact user time
            // Pass daysOfWeek to schedule weekly triggers for selected days
            await NotificationService.scheduleHabitReminder({
              id: savedId,
              name: habitName,
              reminderTime: r.time,
              daysOfWeek: r.daysOfWeek,
              timeZone: 'Asia/Ho_Chi_Minh',
            });
          }
        }
      } catch (e) {
        console.warn('EditHabitScreen: notification update failed', e);
      }

      Alert.alert("Thành công", "Đã cập nhật thói quen!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : (error?.message || "Có lỗi xảy ra"));
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
    } catch (error: any) {
      console.error("❌ [EDIT-HABIT] Error deleting habit:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : (error?.message || 'Có lỗi xảy ra'));
    }
  };

  if (!habit) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="chevron-left" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa thói quen</Text>
          <View style={styles.deleteHeaderButton} />
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
          <Icon name="chevron-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa thói quen</Text>
          <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Icon name="trash-can-outline" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]} showsVerticalScrollIndicator={false}>
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
                  <Icon name={category.icon} size={20} color={selectedCategory === category.id ? selectedColor : "#111827"} style={styles.iconMarginRight} />
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tần suất</Text>
            <View style={styles.frequencyToggle}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  isDaily && styles.frequencyButtonActive,
                ]}
                onPress={() => {
                  setIsDaily(true);
                  // Không cần xóa schedule vì edit có thể giữ lại dữ liệu cũ
                }}
              >
                <Icon name="calendar-today" size={16} color={isDaily ? "#10B981" : "#999999"} style={styles.iconMarginRight} />
                <Text style={[
                  styles.frequencyButtonText,
                  isDaily && styles.frequencyButtonTextActive,
                ]}>
                  Hàng ngày
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  !isDaily && styles.frequencyButtonActive,
                ]}
                onPress={() => {
                  setIsDaily(false);
                  // Nếu chưa có schedule nào, tạo một cái mặc định
                  if (schedule.length === 0) {
                    setSchedule([{
                      id: "1",
                      time: "08:00",
                      daysOfWeek: [1, 2, 3, 4, 5], // T2-T6
                      reminder: true,
                    }]);
                  }
                }}
              >
                <Icon name="calendar-check" size={16} color={!isDaily ? "#10B981" : "#999999"} style={styles.iconMarginRight} />
                <Text style={[
                  styles.frequencyButtonText,
                  !isDaily && styles.frequencyButtonTextActive,
                ]}>
                  Ngày cụ thể
                </Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Details */}
            {isDaily ? (
              <>
                <View style={styles.dailyScheduleInfo}>
                  <Icon name="information" size={16} color="#10B981" style={styles.iconMarginRight} />
                  <Text style={styles.dailyScheduleText}>Mỗi ngày, cả tuần</Text>
                </View>
                <TouchableOpacity
                  style={styles.timeDisplay}
                  onPress={() => {
                    setEditingScheduleId('daily');
                    setTempTime(dailyReminderTime);
                    setShowTimePicker(true);
                  }}
                >
                  <View style={styles.flexRow}>
                    <Icon name="clock-outline" size={16} color={selectedColor} />
                    <Text style={[styles.timeText, styles.iconMarginRight]}>{dailyReminderTime}</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.scheduleSubtitle}>Chọn những ngày bạn muốn thực hiện thói quen</Text>

                {schedule.length === 0 ? (
                  <View style={styles.scheduleCard}>
                    <Text style={styles.emptyText}>Chưa có lịch trình. Chọn "Ngày cụ thể" để thiết lập.</Text>
                  </View>
                ) : (
                  (() => {
                    const item = schedule[0];
                    return (
                      <View key={item.id} style={styles.scheduleCard}>
                {/* Time */}
                <View style={styles.scheduleTimeRow}>
                  <TouchableOpacity
                    style={styles.timeDisplay}
                    onPress={() => {
                      setEditingScheduleId(item.id);
                      setTempTime(item.time);
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.flexRow}>
                      <Icon name="clock-outline" size={16} color={selectedColor} />
                      <Text style={[styles.timeText, styles.iconMarginRight]}>{item.time}</Text>
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
                <View style={styles.daysSelectionContainer}>
                  <Text style={styles.daysLabel}>Ngày trong tuần ({item.daysOfWeek.length}/7)</Text>
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
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={item.daysOfWeek.includes(dayIndex) ? "check-circle" : "circle-outline"}
                          size={12}
                          color={item.daysOfWeek.includes(dayIndex) ? "#FFFFFF" : "#D1D5DB"}
                          style={styles.dayIcon}
                        />
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
                  <View style={styles.flexRow}>
                    <Icon name={item.reminder ? 'bell' : 'bell-off'} size={16} color="#10B981" />
                    <Text style={[styles.reminderText, styles.iconMarginRight]}>{"Nhắc nhở"}</Text>
                  </View>
                </TouchableOpacity>
              </View>
                    );
                  })()
                )}
              </>
            )}
          </View>
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
            style={[styles.saveButton, { backgroundColor: selectedColor }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <View style={styles.flexRow}>
              <Icon name="content-save" size={18} color="#FFFFFF" />
              <Text style={[styles.saveButtonText, styles.iconMarginRight]}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isLoading && styles.disabledOpacity]}
            onPress={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            <View style={styles.flexRow}>
              <Icon name="trash-can-outline" size={16} color="#EF4444" />
              <Text style={[styles.deleteButtonText, styles.iconMarginRight]}>Xóa thói quen</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Native TimePicker */}
      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const [hh, mm] = (tempTime || '06:00').split(':').map(Number);
            const d = new Date();
            d.setHours(hh, mm, 0, 0);
            return d;
          })()}
          mode="time"
          is24Hour={true}
          display={'spinner'}
          onChange={(event: any, selectedDate?: Date) => {
            if (event?.type === 'dismissed') {
              setShowTimePicker(false);
              setEditingScheduleId(null);
              return;
            }
            if (!selectedDate) return;
            const hh = String(selectedDate.getHours()).padStart(2, '0');
            const mm = String(selectedDate.getMinutes()).padStart(2, '0');
            const newTime = `${hh}:${mm}`;
            
            if (editingScheduleId === 'daily') {
              setDailyReminderTime(newTime);
            } else {
              setSchedule((prev) => prev.map((s) => s.id === editingScheduleId ? { ...s, time: newTime } : s));
            }
            
            setTempTime(newTime);
            setShowTimePicker(false);
            setEditingScheduleId(null);
          }}
        />
      )}

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
                style={[styles.confirmDelete, isLoading && styles.disabledOpacity]}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  deleteHeaderButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  deleteHeaderIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827", flex: 1, textAlign: "center" },
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
  colorsGrid: { flexDirection: "row", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  colorButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "transparent" },
  colorButtonActive: { borderColor: "#10B981" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, borderWidth: 2, borderColor: "transparent" },
  categoryButtonActive: { borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  categoryIcon: { fontSize: 24, marginRight: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  categoryNameActive: { color: "#111827" },
  frequencyToggle: { flexDirection: "row", gap: 8, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 12 },
  frequencyButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", flexDirection: "row" },
  frequencyButtonActive: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#10B981" },
  frequencyButtonText: { fontSize: 13, fontWeight: "700", color: "#999999" },
  frequencyButtonTextActive: { color: "#10B981" },
  dailyScheduleInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F9FF", borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: "#10B981", marginBottom: 12 },
  dailyScheduleText: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 },
  addScheduleButton: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#6366F1", borderRadius: 10, flexDirection: "row", alignItems: "center" },
  addScheduleText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  scheduleSubtitle: { fontSize: 12, color: "#666666", marginTop: 4, fontStyle: "italic" },
  emptyText: { color: "#6B7280", fontSize: 13, fontStyle: "italic" },
  scheduleCard: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  scheduleTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeDisplay: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#EEF2FF", borderRadius: 8 },
  timeText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  deleteScheduleButton: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteScheduleText: { fontSize: 18 },
  daysGrid: { flexDirection: "row", gap: 4, marginBottom: 12 },
  daysSelectionContainer: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  daysLabel: { fontSize: 13, fontWeight: "700", color: "#333333", marginBottom: 10 },
  dayButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, backgroundColor: "#FFFFFF", borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#E5E7EB" },
  dayButtonActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  dayText: { color: "#666666", fontWeight: "600", fontSize: 10 },
  dayTextActive: { color: "#FFFFFF" },
  dayIcon: { marginBottom: 1 },
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
  iconMarginRight: { marginRight: 8 },
  flexRow: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  disabledOpacity: { opacity: 0.6 },
});
