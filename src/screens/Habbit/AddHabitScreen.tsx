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
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import AIHabitSuggestionService from "../../services/AIHabitSuggestionService";
import NotificationService from '../../services/NotificationService';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const isLoading = useHabitStore((state) => state.isLoading);

  const [habitName, setHabitName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedColor, setSelectedColor] = useState("#6366F1");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isMeasurable, setIsMeasurable] = useState(true); // Toggle: Yes/No hoặc Measurable
  const [isDaily, setIsDaily] = useState(true); // Toggle: Hàng ngày hay chọn ngày cụ thể
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: "1", time: "06:00", daysOfWeek: [1, 2, 3, 4, 5, 6, 0], reminder: true },
  ]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState("06:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedFromSuggestion, setSelectedFromSuggestion] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Generate AI suggestions khi category thay đổi
  const [suggestionsState, setSuggestionsState] = useState<HabitSuggestion[]>([]);

  React.useEffect(() => {
    if (selectedCategory) {
      setSuggestionsLoading(true);
      AIHabitSuggestionService.generateSuggestions(selectedCategory)
        .then((suggestions) => {
          setSuggestionsState(suggestions);
        })
        .catch((error) => {
          console.error("Lỗi load suggestions:", error);
          setSuggestionsState([]);
        })
        .finally(() => {
          setSuggestionsLoading(false);
        });
    } else {
      setSuggestionsState([]);
    }
  }, [selectedCategory]);

  // Request notification permission on screen mount
  React.useEffect(() => {
    NotificationService.requestPermission().catch(() => {});
  }, []);

  const suggestions = suggestionsState;

  // icon list removed — unused. If you want an icon picker UI, I can re-add and render it here.
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

  const categories = [
    { id: "health", name: "Sức khỏe", icon: 'arm-flex' },
    { id: "productivity", name: "Năng suất", icon: 'bullseye' },
    { id: "learning", name: "Học tập", icon: 'book-open-variant' },
    { id: "wellness", name: "Tinh thần", icon: 'meditation' },
  ];

  const handleSelectSuggestion = (suggestion: HabitSuggestion) => {
    setHabitName(suggestion.name);
    setTarget(suggestion.target.toString());
    setUnit(suggestion.unit);
    setSelectedIcon(suggestion.icon);
    setSelectedCategory(suggestion.category);
    setSelectedFromSuggestion(true); // Đánh dấu đã chọn từ suggestion
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

  // handleSaveSchedule removed - schedule is updated directly by DateTimePicker

  const handleSave = async () => {
    // Validation: Tên thói quen, danh mục luôn bắt buộc
    if (!habitName.trim() || !selectedCategory) {
      Alert.alert("Thông báo", "Vui lòng nhập tên thói quen và chọn danh mục");
      return;
    }

    // Validation: Nếu là Measurable, cần có mục tiêu và đơn vị
    if (isMeasurable && (!target || !unit.trim())) {
      Alert.alert("Thông báo", "Vui lòng nhập mục tiêu và đơn vị");
      return;
    }

    // Validation: Nếu là Ngày cụ thể, cần có lịch trình
    if (!isDaily && schedule.length === 0) {
      Alert.alert("Thông báo", "Vui lòng thêm ít nhất một lịch trình");
      return;
    }

    try {
      // Nếu là Hàng ngày, tạo schedule mặc định (nhắc nhở bật)
      const finalSchedule = isDaily
        ? [{ id: "1", time: "06:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], reminder: true }]
        : schedule;

      // Nếu không đo lường, set target = 1 và unit = "lần"
      const finalTarget = isMeasurable ? parseInt(target, 10) : 1;
      const finalUnit = isMeasurable ? unit : "lần";

      // create an id for the habit so we can schedule notifications using it
      const habitId = Date.now().toString();

      // Determine reminder metadata
      const reminders = finalSchedule.filter(s => s.reminder);
      const hasReminder = reminders.length > 0;
      const reminderTime = hasReminder ? reminders[0].time : null;

      // Save habit and get authoritative ID from backend
      const result = await addHabit({
        id: habitId,
        name: habitName,
        icon: selectedIcon,
        color: selectedColor,
        category: selectedCategory,
        target: finalTarget,
        unit: finalUnit,
        schedule: finalSchedule,
        description: "",
        isMeasurable,
        isDaily,
        hasReminder,
        reminderTime,
      });

      const savedId = (result && result.addedId) ? result.addedId : habitId;

      // Schedule notifications for reminder entries (if any) using savedId
      let scheduledIds: any[] = [];
      try {
        if (hasReminder) {
          await NotificationService.requestPermission();
          for (const r of reminders) {
            try {
              // Pass daysOfWeek so NotificationService can schedule weekly triggers
              const res = await NotificationService.scheduleHabitReminder({
                id: savedId,
                name: habitName,
                reminderTime: r.time,
                daysOfWeek: r.daysOfWeek,
                timeZone: 'Asia/Ho_Chi_Minh',
              });
              if (Array.isArray(res)) scheduledIds.push(...res);
              else if (res) scheduledIds.push(res);
            } catch (innerErr) {
              console.warn('AddHabitScreen: failed to schedule reminder for schedule', r, innerErr);
            }
          }

          // Persist scheduledIds into habit document so we can cancel later
          if (scheduledIds.length > 0) {
            try {
              await updateHabit(savedId, { notificationIds: scheduledIds });
            } catch (updateErr) {
              console.warn('AddHabitScreen: failed to save notificationIds to habit', updateErr);
            }
          }
        }
      } catch (e) {
        console.warn('AddHabitScreen: scheduling reminders failed', e);
      }

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
          <Icon name="chevron-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thói quen</Text>
        <View style={styles.headerTile} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>


          {/* Habit Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin thói quen</Text>

            {/* Habit Name Input - BẮT BUỘC */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên thói quen <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đọc sách, Uống 2 lít nước"
                placeholderTextColor="#999"
                value={habitName}
                onChangeText={setHabitName}
              />
            </View>

            {/* Category Selection - Moved below habit name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Danh mục <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.categoryButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setSelectedIcon(category.icon);
                    }}
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

            {/* AI Suggestions */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Icon name="robot" size={24} color="#8B5CF6" style={styles.iconMarginRight} />
                <Text style={styles.aiTitle}>Gợi ý từ AI</Text>
              </View>
              
              {selectedCategory ? (
                <>
                  <Text style={styles.aiText}>
                    Dựa trên danh mục <Text style={styles.aiHighlight}>"{categories.find(c => c.id === selectedCategory)?.name}"</Text>, AI gợi ý:
                  </Text>
                  {suggestionsLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#8B5CF6" />
                      <Text style={styles.loadingText}>Đang tạo gợi ý từ AI...</Text>
                    </View>
                  ) : suggestions.length > 0 ? (
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
                  ) : (
                    <View style={styles.noSuggestionsContainer}>
                      <Text style={styles.noSuggestionsText}>Hiện chưa có gợi ý cho danh mục này</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noSuggestionsContainer}>
                  <Icon name="information-outline" size={32} color="#D1D5DB" style={styles.infoIcon} />
                  <Text style={styles.noSuggestionsText}>Vui lòng chọn danh mục để nhận gợi ý từ AI</Text>
                </View>
              )}
            </View>

            {/* Tracking Mode Toggle */}
            {!selectedFromSuggestion && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cách theo dõi</Text>
                <View style={styles.trackingModeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.trackingModeButton,
                      !isMeasurable && styles.trackingModeButtonActive,
                    ]}
                    onPress={() => setIsMeasurable(false)}
                  >
                    <Text
                      style={[
                        styles.trackingModeButtonText,
                        !isMeasurable && styles.trackingModeButtonTextActive,
                      ]}
                    >
                      Hoàn thành
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.trackingModeButton,
                      isMeasurable && styles.trackingModeButtonActive,
                    ]}
                    onPress={() => setIsMeasurable(true)}
                  >
                    <Text
                      style={[
                        styles.trackingModeButtonText,
                        isMeasurable && styles.trackingModeButtonTextActive,
                      ]}
                    >
                      Đo lường
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.trackingModeDescription}>
                  {isMeasurable
                    ? "Theo dõi số lượng (ví dụ: 20 trang, 8 cốc nước)"
                    : "Chỉ cần đánh dấu đã hoàn thành (ví dụ: thiền, tập thể dục)"}
                </Text>
              </View>
            )}

            {/* Target & Unit (Chỉ hiện khi Measurable và không chọn suggestion) */}
            {!selectedFromSuggestion && isMeasurable && (
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
            )}

            {/* Color Selection */}
            {!selectedFromSuggestion && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Màu sắc</Text>
                <View style={styles.colorsGridContainer}>
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
              </View>
            )}

            {/* Icon Selection */}
            {!selectedFromSuggestion && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Icon thói quen</Text>
                <View style={styles.iconsGrid}>
                  {[
                    'star', 'heart', 'check-circle', 'arm-flex', 'water', 'book-open-variant',
                    'meditation', 'run', 'dumbbell', 'yoga', 'swimming', 'biking',
                    'soccer', 'violin', 'guitar', 'palette', 'camera', 'laptop',
                    'code', 'lightbulb-on-outline', 'chef-hat', 'apple', 'leaf',
                    'weather-sunny', 'weather-moon', 'bed', 'coffee', 'utensils',
                    'clock', 'briefcase', 'pencil', 'book', 'newspaper', 'phone'
                  ].map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        selectedIcon === icon && styles.iconButtonActive,
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Icon name={icon} size={24} color={selectedIcon === icon ? selectedColor : '#9CA3AF'} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.trackingModeDescription}>
                  {selectedIcon && `Icon được chọn: ${selectedIcon}`}
                </Text>
              </View>
            )}

            {/* Schedule Section */}
            <View style={styles.inputContainer}>
              {/* Edit Button - Only show when selected from suggestion */}
              {selectedFromSuggestion && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setSelectedFromSuggestion(false)}
                >
                  <Icon name="pencil" size={16} color="#8B5CF6" style={styles.iconMarginRight} />
                  <Text style={styles.editButtonText}>Chỉnh sửa chi tiết</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Tần suất</Text>
              <View style={styles.frequencyToggle}>
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      isDaily && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setIsDaily(true)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        isDaily && styles.frequencyButtonTextActive,
                      ]}
                    >
                      Hàng ngày
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      !isDaily && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setIsDaily(false)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        !isDaily && styles.frequencyButtonTextActive,
                      ]}
                    >
                      Ngày cụ thể
                    </Text>
                </TouchableOpacity>
              </View>

              {/* Schedule Details */}
              {isDaily ? (
                <View style={styles.dailyScheduleInfo}>
                  <Icon name="check-circle" size={20} color="#10B981" style={styles.iconMarginRight} />
                  <Text style={styles.dailyScheduleText}>Mỗi ngày, cả tuần</Text>
                </View>
              ) : (
                <>
                  <View style={styles.scheduleHeader}>
                    <View>
                      <Text style={styles.label}>Lựa chọn ngày</Text>
                      <Text style={styles.scheduleSubtitle}>Chọn những ngày bạn muốn thực hiện thói quen</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addScheduleButton}
                      onPress={addSchedule}
                    >
                      <Icon name="plus" size={16} color="#FFFFFF" style={styles.iconMarginRight} />
                      <Text style={styles.addScheduleText}>Thêm lịch</Text>
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
                              setShowTimePicker(true);
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
                          <Icon name={item.reminder ? 'bell' : 'bell-off'} size={16} color="#10B981" />
                          <Text style={[styles.reminderText, styles.ml8]}>Nhắc nhở</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </>
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
            // On Android, onChange is called once and picker closes; on iOS it's called repeatedly
            if (event?.type === 'dismissed') {
              setShowTimePicker(false);
              setEditingScheduleId(null);
              return;
            }
            if (!selectedDate) return;
            const hh = String(selectedDate.getHours()).padStart(2, '0');
            const mm = String(selectedDate.getMinutes()).padStart(2, '0');
            const newTime = `${hh}:${mm}`;
            setSchedule((prev) => prev.map((s) => s.id === editingScheduleId ? { ...s, time: newTime } : s));
            setTempTime(newTime);
            setShowTimePicker(false);
            setEditingScheduleId(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00796B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  headerTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  saveButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#10B981', borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center' },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  aiCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#000000" },
  aiText: { fontSize: 14, color: "#333333", marginBottom: 16 },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  suggestionsScroll: { marginHorizontal: -20 },
  suggestionCard: { width: 180, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginLeft: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  loadingContainer: { paddingVertical: 30, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666666", fontStyle: "italic" },
  noSuggestionsContainer: { paddingVertical: 20, alignItems: "center", justifyContent: "center" },
  noSuggestionsText: { fontSize: 14, color: "#999999", fontStyle: "italic", textAlign: "center" },
  infoIcon: { marginBottom: 8 },
  suggestionIconOld: { fontSize: 32, marginBottom: 8 },
  suggestionName: { fontSize: 14, fontWeight: "800", color: "#000000", marginBottom: 4 },
  suggestionDescription: { fontSize: 12, color: "#333333", marginBottom: 8 },
  suggestionBadge: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 6 },
  suggestionBenefits: { fontSize: 10, color: "#8B5CF6", fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#000000", marginBottom: 8 },
  requiredStar: { color: "#EF4444", fontWeight: "700" },
  input: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, color: "#000000", fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", gap: 12 },
  trackingModeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  trackingModeToggle: { flexDirection: "row", gap: 8, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 12 },
  trackingModeButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  trackingModeButtonActive: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#6366F1" },
  trackingModeButtonText: { fontSize: 13, fontWeight: "700", color: "#999999" },
  trackingModeButtonTextActive: { color: "#6366F1" },
  trackingModeDescription: { fontSize: 12, color: "#666666", fontStyle: "italic", marginTop: 8 },
  frequencyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  frequencyToggle: { flexDirection: "row", gap: 8, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 12 },
  frequencyButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  frequencyButtonActive: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#10B981" },
  frequencyButtonText: { fontSize: 13, fontWeight: "700", color: "#999999" },
  frequencyButtonTextActive: { color: "#10B981" },
  dailyScheduleInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F9FF", borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: "#10B981" },
  dailyScheduleText: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  iconsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  iconButton: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  iconButtonActive: { borderColor: "#6366F1", backgroundColor: "#F3F4F6" },
  colorsGridContainer: { justifyContent: "center", alignItems: "center", marginVertical: 8 },
  colorsGrid: { flexDirection: "row", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  colorButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: "transparent" },
  colorButtonActive: { borderColor: "#00897B" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 2, borderColor: "transparent" },
  categoryButtonActive: { borderColor: "#6366F1", backgroundColor: "#F3F4F6" },
  categoryIcon: { fontSize: 24, marginRight: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#333333" },
  categoryNameActive: { color: "#000000" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 },
  addScheduleButton: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#6366F1", borderRadius: 10, flexDirection: "row", alignItems: "center" },
  addScheduleText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  scheduleSubtitle: { fontSize: 12, color: "#666666", marginTop: 4, fontStyle: "italic" },
  editButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 2, borderColor: "#8B5CF6" },
  editButtonText: { color: "#8B5CF6", fontWeight: "700", fontSize: 14 },
  emptyText: { color: "#999999", fontSize: 13, fontStyle: "italic" },
  scheduleCard: { backgroundColor: "#F9F9F9", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  scheduleTimeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timeDisplay: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  timeText: { color: "#000000", fontWeight: "700", fontSize: 14, marginLeft: 6 },
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
  timeInputField: { width: 60, height: 50, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" },
  timeSeparator: { fontSize: 24, color: "#00796B", fontWeight: "700", marginBottom: 8 },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButtonCancel: { flex: 1, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, alignItems: "center" },
  modalButtonSave: { flex: 1, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 8, alignItems: "center" },
  modalButtonText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 14 },
  modalButtonTextWhite: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
