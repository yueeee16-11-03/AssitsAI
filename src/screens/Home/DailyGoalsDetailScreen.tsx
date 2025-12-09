import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyGoalsDetail'>;

interface DailyGoal {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'finance' | 'habit' | 'learning' | 'other';
  targetValue?: number;
  currentValue: number;
  unit?: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  dueTime?: string;
}

export default function DailyGoalsDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [goals, setGoals] = useState<DailyGoal[]>([
    {
      id: '1',
      title: 'Tiết kiệm 500,000 VND',
      description: 'Tiết kiệm từ chi tiêu hôm nay',
      category: 'finance',
      targetValue: 500000,
      currentValue: 250000,
      unit: 'VND',
      isCompleted: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
      dueTime: '23:59',
    },
    {
      id: '2',
      title: 'Tập thể dục 30 phút',
      description: 'Chạy bộ hoặc tập gym',
      category: 'health',
      targetValue: 30,
      currentValue: 15,
      unit: 'phút',
      isCompleted: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
      dueTime: '18:00',
    },
    {
      id: '3',
      title: 'Đọc sách 20 trang',
      description: 'Đọc sách phát triển bản thân',
      category: 'learning',
      targetValue: 20,
      currentValue: 0,
      unit: 'trang',
      isCompleted: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      dueTime: '21:00',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DailyGoal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<DailyGoal['category']>('other');
  const [newGoalPriority, setNewGoalPriority] = useState<DailyGoal['priority']>('medium');

  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const completedCount = goals.filter(g => g.isCompleted).length;
  const completionRate = goals.length ? Math.round((completedCount / goals.length) * 100) : 0;

  const getCategoryIcon = (category: DailyGoal['category']) => {
    const icons: Record<DailyGoal['category'], string> = {
      health: 'run',
      finance: 'cash',
      habit: 'sparkles',
      learning: 'book-open-variant',
      other: 'target',
    };
    return icons[category];
  };

  const getCategoryLabel = (category: DailyGoal['category']) => {
    const labels: Record<DailyGoal['category'], string> = {
      health: 'Sức khỏe',
      finance: 'Tài chính',
      habit: 'Thói quen',
      learning: 'Học tập',
      other: 'Khác',
    };
    return labels[category];
  };

  const getPriorityColor = (priority: DailyGoal['priority']) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const toggleGoalCompletion = useCallback((goalId: string) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
      )
    );
  }, []);

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mục tiêu');
      return;
    }

    const newGoal: DailyGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      description: newGoalDesc,
      category: newGoalCategory,
      currentValue: 0,
      isCompleted: false,
      priority: newGoalPriority,
      createdAt: new Date().toISOString(),
    };

    setGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalCategory('other');
    setNewGoalPriority('medium');
    setShowAddModal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Xóa mục tiêu',
      'Bạn chắc chắn muốn xóa mục tiêu này?',
      [
        { text: 'Hủy', onPress: () => {} },
        {
          text: 'Xóa',
          onPress: () => {
            setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditGoal = (goal: DailyGoal) => {
    setEditingGoal(goal);
    setNewGoalTitle(goal.title);
    setNewGoalDesc(goal.description);
    setNewGoalCategory(goal.category);
    setNewGoalPriority(goal.priority);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingGoal || !newGoalTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mục tiêu');
      return;
    }

    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === editingGoal.id
          ? {
              ...goal,
              title: newGoalTitle,
              description: newGoalDesc,
              category: newGoalCategory,
              priority: newGoalPriority,
            }
          : goal
      )
    );

    setEditingGoal(null);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalCategory('other');
    setNewGoalPriority('medium');
    setShowEditModal(false);
  };

  const renderGoalCard = ({ item: goal }: { item: DailyGoal }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[styles.goalCard, goal.isCompleted && styles.goalCardCompleted]}
        onPress={() => toggleGoalCompletion(goal.id)}
        activeOpacity={0.7}
      >
        <View style={styles.goalHeader}>
            <View style={styles.goalCheckbox}>
            <View
              style={[
                styles.checkboxInner,
                goal.isCompleted && styles.checkboxChecked,
              ]}
            >
              {goal.isCompleted && (
                <Icon name="check" size={14} color="#FFFFFF" />
              )}
            </View>
          </View>

          <View style={styles.goalInfo}>
            <View style={styles.goalTitleRow}>
                <View style={styles.rowCenter}>
                  <Icon name={getCategoryIcon(goal.category)} size={14} color="#6366F1" style={styles.iconMarginRight} />
                  <Text style={styles.goalCategory}>{getCategoryLabel(goal.category)}</Text>
                </View>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(goal.priority) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {goal.priority === 'high' ? 'Cao' : goal.priority === 'medium' ? 'Trung' : 'Thấp'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.goalTitle,
                goal.isCompleted && styles.goalTitleCompleted,
              ]}
            >
              {goal.title}
            </Text>

            {goal.description && (
              <Text style={styles.goalDescription}>{goal.description}</Text>
            )}

            {goal.targetValue && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`,
                      },
                      goal.isCompleted ? styles.progressFillColorCompleted : styles.progressFillColor,
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </Text>
              </View>
            )}

            {goal.dueTime && (
              <View style={styles.rowCenterMarginTop6}>
                <Icon name="clock-outline" size={14} color="#F59E0B" />
                <Text style={[styles.dueTime, styles.dueTimeMarginLeft]}>Hạn chót: {goal.dueTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditGoal(goal)}
            >
              <Icon name="pencil" size={16} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteGoal(goal.id)}
            >
              <Icon name="trash-can-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.rowCenter}>
            <Icon name="chevron-left" size={18} color="#111827" />
            <Text style={styles.backIconText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu hôm nay</Text>
        <TouchableOpacity
          style={styles.addButtonContainer}
          onPress={() => setShowAddModal(true)}
        >
          <View style={[styles.addButtonBubble, styles.addButtonBubbleTransparent]}>
            <Icon name="plus" size={20} color="#111827" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng mục tiêu</Text>
          <Text style={styles.statValue}>{goals.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Hoàn thành</Text>
          <Text style={styles.statValue}>{completedCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tiến độ</Text>
          <Text style={[styles.statValue, styles.statValueColor]}>
            {completionRate}%
          </Text>
        </View>
      </View>

      {/* Progress Circle */}
      <View style={styles.progressCircleContainer}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleValue}>{completionRate}%</Text>
          <Text style={styles.progressCircleLabel}>Hoàn thành</Text>
        </View>
      </View>

      {/* Goals List */}
      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={renderGoalCard}
        contentContainerStyle={[styles.goalsList, { paddingBottom: Math.max(24, insets.bottom + TAB_BAR_HEIGHT) }]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Icon name="close" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm mục tiêu mới</Text>
            <TouchableOpacity onPress={handleAddGoal}>
              <Text style={styles.modalSaveText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên mục tiêu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập tên mục tiêu..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Mô tả chi tiết (tùy chọn)..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={newGoalDesc}
                onChangeText={setNewGoalDesc}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Danh mục</Text>
              <View style={styles.categoryGrid}>
                {(['health', 'finance', 'habit', 'learning', 'other'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      newGoalCategory === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setNewGoalCategory(cat)}
                  >
                    <Icon name={getCategoryIcon(cat)} size={20} color={newGoalCategory === cat ? '#FFFFFF' : '#10B981'} style={styles.categoryIconMarginBottom} />
                    <Text style={[styles.categoryButtonLabel, newGoalCategory === cat && styles.categoryButtonLabelActive]}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mức độ ưu tiên</Text>
              <View style={styles.priorityGroup}>
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newGoalPriority === priority && styles.priorityButtonActive,
                      { borderColor: getPriorityColor(priority) },
                    ]}
                    onPress={() => setNewGoalPriority(priority)}
                  >
                    <Text style={[styles.priorityButtonLabel, newGoalPriority === priority && styles.priorityButtonLabelActive]}>
                      {priority === 'high' ? 'Cao' : priority === 'medium' ? 'Trung' : 'Thấp'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Icon name="close" size={20} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa mục tiêu</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalSaveText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên mục tiêu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập tên mục tiêu..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Mô tả chi tiết (tùy chọn)..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={newGoalDesc}
                onChangeText={setNewGoalDesc}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Danh mục</Text>
              <View style={styles.categoryGrid}>
                {(['health', 'finance', 'habit', 'learning', 'other'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      newGoalCategory === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setNewGoalCategory(cat)}
                  >
                    <Icon name={getCategoryIcon(cat)} size={20} color={newGoalCategory === cat ? '#FFFFFF' : '#10B981'} style={styles.categoryIconMarginBottom} />
                    <Text style={[styles.categoryButtonLabel, newGoalCategory === cat && styles.categoryButtonLabelActive]}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mức độ ưu tiên</Text>
              <View style={styles.priorityGroup}>
                {(['high', 'medium', 'low'] as const).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newGoalPriority === priority && styles.priorityButtonActive,
                      { borderColor: getPriorityColor(priority) },
                    ]}
                    onPress={() => setNewGoalPriority(priority)}
                  >
                    <Text style={[styles.priorityButtonLabel, newGoalPriority === priority && styles.priorityButtonLabelActive]}>
                      {priority === 'high' ? 'Cao' : priority === 'medium' ? 'Trung' : 'Thấp'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    flex: 1,
  },
  backIconText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addIcon: {
    fontSize: 28,
    color: '#111827',
    fontWeight: 'bold',
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addButtonBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressCircleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    borderWidth: 3,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  progressCircleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  goalsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalCardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: '#ECFDF5',
  },
  goalHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  goalCheckbox: {
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalCategory: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  goalDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dueTime: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 0,
  },
  goalActions: {
    justifyContent: 'flex-start',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#111827',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 15,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '30%',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  categoryButtonIcon: {
    fontSize: 24,
  },
  categoryButtonLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  categoryButtonLabelActive: {
    color: '#FFFFFF',
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  priorityButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  priorityButtonLabel: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 13,
  },
  priorityButtonLabelActive: {
    color: '#FFFFFF',
  },
  progressFillColor: {
    backgroundColor: '#6366F1',
  },
  progressFillColorCompleted: {
    backgroundColor: '#10B981',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCenterMarginTop6: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconMarginRight: {
    marginRight: 8,
  },
  dueTimeMarginLeft: {
    marginLeft: 8,
  },
  addButtonBubbleTransparent: {
    backgroundColor: 'transparent',
  },
  categoryIconMarginBottom: {
    marginBottom: 6,
  },
  statValueColor: {
    color: '#6366F1',
  },
});
