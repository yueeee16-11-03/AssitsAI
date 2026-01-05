import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from "../../store/familyStore";

// Color System
const COLORS = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    secondary: '#10B981',
    accent: '#8B5CF6',
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      tertiary: '#94A3B8',
    },
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#38BDF8',
    primaryDark: '#0EA5E9',
    secondary: '#34D399',
    accent: '#A78BFA',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      tertiary: '#64748B',
    },
    border: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
  contributor: {
    blue: '#3B82F6',
    pink: '#EC4899',
    green: '#10B981',
    orange: '#F59E0B',
  },
  gradient: {
    primary: ['#0EA5E9', '#0284C7'],
    secondary: ['#10B981', '#059669'],
    accent: ['#8B5CF6', '#7C3AED'],
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(0, 0, 0, 0.05)',
  },
};

type Props = NativeStackScreenProps<RootStackParamList, "SharedGoal">;

interface SharedGoal {
  id: string;
  title: string;
  icon: string;
  target: number;
  current: number;
  deadline: string;
  contributors: Contributor[];
  category: string;
}

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  contribution: number;
  suggested: number;
  color: string;
}

export default function SharedGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [fadeAnim] = useState(new Animated.Value(0));
  const theme = useTheme();
  const isDark = theme.dark;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const styles = getStyles(colors);
  const { currentFamily } = useFamilyStore();

  // Form state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SharedGoal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    icon: 'target',
    target: '',
    deadline: '',
    category: '',
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const sharedGoals: SharedGoal[] = [
    {
      id: "1",
      title: "Du lịch Đà Lạt gia đình",
      icon: "airplane",
      target: 30000000,
      current: 18000000,
      deadline: "01/06/2025",
      category: "Giải trí",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 10000000, suggested: 12000000, color: COLORS.contributor.blue },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 8000000, suggested: 10000000, color: COLORS.contributor.pink },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 4000000, color: COLORS.contributor.green },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 4000000, color: COLORS.contributor.orange },
      ],
    },
    {
      id: "2",
      title: "Quỹ học phí con",
      icon: "school",
      target: 100000000,
      current: 45000000,
      deadline: "01/09/2025",
      category: "Giáo dục",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 25000000, suggested: 30000000, color: COLORS.contributor.blue },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 20000000, suggested: 25000000, color: COLORS.contributor.pink },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 0, color: COLORS.contributor.green },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 0, color: COLORS.contributor.orange },
      ],
    },
    {
      id: "3",
      title: "Sửa chữa nhà cửa",
      icon: "home-variant",
      target: 50000000,
      current: 15000000,
      deadline: "31/12/2024",
      category: "Gia đình",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 10000000, suggested: 20000000, color: COLORS.contributor.blue },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 5000000, suggested: 15000000, color: COLORS.contributor.pink },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 0, color: COLORS.contributor.green },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 0, color: COLORS.contributor.orange },
      ],
    },
  ];

  const totalTarget = sharedGoals.reduce((sum, g) => sum + g.target, 0);
  const totalCurrent = sharedGoals.reduce((sum, g) => sum + g.current, 0);

  // Handler functions
  const handleAddGoal = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      icon: 'target',
      target: '',
      deadline: '',
      category: '',
    });
    setIsModalVisible(true);
  };

  const handleEditGoal = (goal: SharedGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      icon: goal.icon,
      target: goal.target.toString(),
      deadline: goal.deadline,
      category: goal.category,
    });
    setIsModalVisible(true);
  };

  const handleDeleteGoal = (goal: SharedGoal) => {
    Alert.alert(
      'Xóa mục tiêu',
      `Bạn có chắc muốn xóa mục tiêu "${goal.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete logic with Firebase
            Alert.alert('Thành công', 'Đã xóa mục tiêu');
          },
        },
      ]
    );
  };

  const handleSaveGoal = () => {
    if (!formData.title || !formData.target || !formData.deadline || !formData.category) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const targetAmount = parseInt(formData.target.replace(/[^0-9]/g, ''));
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Lỗi', 'Số tiền mục tiêu không hợp lệ');
      return;
    }

    if (editingGoal) {
      // TODO: Implement update logic with Firebase
      Alert.alert('Thành công', 'Đã cập nhật mục tiêu');
    } else {
      // TODO: Implement create logic with Firebase
      Alert.alert('Thành công', 'Đã thêm mục tiêu mới');
    }

    setIsModalVisible(false);
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu chung</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng mục tiêu gia đình</Text>
            <Text style={styles.summaryAmount}>₫{totalTarget.toLocaleString("vi-VN")}</Text>
            <View style={styles.summaryProgress}>
              <View style={[styles.summaryProgressFill, { width: `${(totalCurrent / totalTarget) * 100}%` }]} />
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.statLabel}>Đã góp</Text>
                <Text style={[styles.statValue, { color: colors.secondary }]}>₫{(totalCurrent / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.statLabel}>Còn lại</Text>
                <Text style={[styles.statValue, { color: colors.text.secondary }]}>₫{((totalTarget - totalCurrent) / 1000000).toFixed(1)}M</Text>
              </View>
            </View>
          </View>

          {/* AI Allocation Card */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Icon name="robot" size={18} color={colors.accent} style={styles.iconMarginRight} />
              <Text style={styles.aiTitle}>Gợi ý phân bổ AI</Text>
            </View>
            <Text style={styles.aiText}>
              AI đã phân tích thu nhập và chi tiêu của từng thành viên. Dưới đây là gợi ý đóng góp công bằng cho mỗi mục tiêu:
            </Text>
            <View style={styles.aiInsight}>
              <Icon name="lightbulb-on" size={16} color={colors.warning} style={styles.iconMarginRight} />
              <Text style={styles.aiInsightText}>
                Bố và Mẹ nên đóng góp nhiều hơn vì thu nhập ổn định. Con cái có thể đóng góp từ tiền lì xì hoặc học bổng.
              </Text>
            </View>
          </View>

          {/* Shared Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mục tiêu ({sharedGoals.length})</Text>
            {sharedGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const remaining = goal.target - goal.current;
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Icon name={goal.icon as any} size={24} color={colors.primary} />
                      <View style={styles.goalDetails}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalCategory}>{goal.category} • <Icon name="calendar" size={12} color={colors.text.tertiary} /> {goal.deadline}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.goalAmounts}>
                    <Text style={styles.goalCurrent}>₫{(goal.current / 1000000).toFixed(1)}M</Text>
                    <Text style={styles.goalTarget}>/ ₫{(goal.target / 1000000).toFixed(1)}M</Text>
                  </View>

                  <View style={styles.goalProgress}>
                    <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.goalPercent}>{progress.toFixed(0)}% • Còn ₫{(remaining / 1000000).toFixed(1)}M</Text>

                  {/* Contributors */}
                  <View style={styles.contributorsSection}>
                    <Text style={styles.contributorsTitle}>Đóng góp thành viên</Text>
                    {goal.contributors.map((contributor) => (
                      <View key={contributor.id} style={styles.contributorRow}>
                        <View style={styles.contributorInfo}>
                          <View style={[styles.contributorAvatar, { backgroundColor: `${contributor.color}22` }]}>
                            <Icon name={contributor.avatar as any} size={20} color={contributor.color} />
                          </View>
                          <Text style={styles.contributorName}>{contributor.name}</Text>
                        </View>
                        <View style={styles.contributorAmounts}>
                          <View style={styles.amountColumn}>
                            <Text style={styles.amountLabel}>Đã góp</Text>
                            <Text style={styles.amountValue}>₫{(contributor.contribution / 1000000).toFixed(1)}M</Text>
                          </View>
                          <View style={styles.amountColumn}>
                            <Text style={styles.amountLabel}>AI gợi ý</Text>
                            <Text style={[styles.amountValue, { color: contributor.color }]}>
                              ₫{(contributor.suggested / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.goalActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Đóng góp", `Thêm tiền vào "${goal.title}"`)}>
                      <Icon name="currency-usd" size={16} color={colors.surface} style={styles.iconMarginRight} />
                      <Text style={styles.actionBtnText}>Đóng góp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnEdit]} onPress={() => handleEditGoal(goal)}>
                      <Icon name="pencil" size={16} color={colors.primary} style={styles.iconMarginRight} />
                      <Text style={styles.actionBtnEditText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => handleDeleteGoal(goal)}>
                      <Icon name="delete" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("GoalTracking")}>
              <Icon name="target" size={32} color={colors.secondary} style={styles.iconMarginBottom} />
              <Text style={styles.actionText}>Mục tiêu cá nhân</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("FamilyOverview", { familyId: currentFamily?.id || "" })}>
              <Icon name="account-group" size={32} color={colors.secondary} style={styles.iconMarginBottom} />
              <Text style={styles.actionText}>Tổng quan gia đình</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Sửa mục tiêu' : 'Thêm mục tiêu mới'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tên mục tiêu *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="VD: Du lịch Đà Lạt"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Danh mục *</Text>
                <View style={styles.categoryButtons}>
                  {['Giải trí', 'Giáo dục', 'Gia đình', 'Sức khỏe', 'Khác'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        formData.category === cat && styles.categoryBtnActive,
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          formData.category === cat && styles.categoryBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số tiền mục tiêu *</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>₫</Text>
                  <TextInput
                    style={styles.formInputCurrency}
                    placeholder="0"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                    value={formatCurrency(formData.target)}
                    onChangeText={(text) => setFormData({ ...formData, target: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hạn hoàn thành *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.deadline}
                  onChangeText={(text) => setFormData({ ...formData, deadline: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Icon</Text>
                <View style={styles.iconButtons}>
                  {['airplane', 'school', 'home-variant', 'car', 'gift', 'heart'].map((iconName) => (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconBtn,
                        formData.icon === iconName && styles.iconBtnActive,
                      ]}
                      onPress={() => setFormData({ ...formData, icon: iconName })}
                    >
                      <Icon
                        name={iconName as any}
                        size={24}
                        color={formData.icon === iconName ? colors.primary : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalBtnSaveText}>
                  {editingGoal ? 'Cập nhật' : 'Thêm mục tiêu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingTop: 12, 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.background, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: { 
    fontSize: 20, 
    color: colors.text.primary,
    fontWeight: "600",
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  addButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.primary, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addIcon: { 
    fontSize: 24, 
    color: colors.surface, 
    fontWeight: "600",
  },
  content: { 
    padding: 20,
  },
  summaryCard: { 
    backgroundColor: colors.surface,
    borderRadius: 24, 
    padding: 28, 
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: { 
    fontSize: 14, 
    color: colors.text.secondary, 
    marginBottom: 8, 
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  summaryAmount: { 
    fontSize: 36, 
    fontWeight: "800", 
    color: colors.text.primary, 
    marginBottom: 20, 
    textAlign: "center",
    letterSpacing: -1,
  },
  summaryProgress: { 
    height: 10, 
    backgroundColor: colors.background, 
    borderRadius: 5, 
    overflow: "hidden", 
    marginBottom: 20,
  },
  summaryProgressFill: { 
    height: "100%", 
    backgroundColor: colors.primary, 
    borderRadius: 5,
  },
  summaryStats: { 
    flexDirection: "row", 
    justifyContent: "space-around",
  },
  summaryStat: { 
    alignItems: "center",
  },
  statLabel: { 
    fontSize: 13, 
    color: colors.text.secondary, 
    marginBottom: 6,
    fontWeight: "500",
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statDivider: { 
    width: 1, 
    height: 40, 
    backgroundColor: colors.border,
  },
  aiCard: { 
    backgroundColor: colors.surface,
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
  },
  aiIcon: { 
    fontSize: 24, 
    marginRight: 8,
  },
  aiTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  aiText: { 
    fontSize: 14, 
    color: colors.text.secondary, 
    lineHeight: 22, 
    marginBottom: 16,
  },
  aiInsight: { 
    flexDirection: "row", 
    backgroundColor: colors.background,
    borderRadius: 12, 
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  aiInsightIcon: { 
    fontSize: 20, 
    marginRight: 8,
  },
  aiInsightText: { 
    flex: 1, 
    fontSize: 13, 
    color: colors.text.secondary, 
    lineHeight: 20,
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconMarginBottom: {
    marginBottom: 8,
  },
  section: { 
    marginBottom: 24,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: colors.text.primary, 
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  goalCard: { 
    backgroundColor: colors.surface,
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHeader: { 
    marginBottom: 16,
  },
  goalInfo: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  goalIcon: { 
    fontSize: 32, 
    marginRight: 12,
  },
  goalDetails: { 
    flex: 1,
  },
  goalTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: colors.text.primary, 
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  goalCategory: { 
    fontSize: 13, 
    color: colors.text.secondary,
    fontWeight: "500",
  },
  goalAmounts: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
  },
  goalCurrent: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: colors.primary,
    letterSpacing: -0.5,
  },
  goalTarget: { 
    fontSize: 16, 
    color: colors.text.tertiary, 
    marginLeft: 6,
    fontWeight: "600",
  },
  goalProgress: { 
    height: 8, 
    backgroundColor: colors.background, 
    borderRadius: 4, 
    overflow: "hidden", 
    marginBottom: 10,
  },
  goalProgressFill: { 
    height: "100%", 
    backgroundColor: colors.primary, 
    borderRadius: 4,
  },
  goalPercent: { 
    fontSize: 13, 
    color: colors.text.secondary, 
    marginBottom: 20,
    fontWeight: "600",
  },
  contributorsSection: { 
    marginBottom: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  contributorsTitle: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: colors.text.secondary, 
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contributorRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 12, 
    paddingVertical: 8,
  },
  contributorInfo: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  contributorAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 12,
  },
  contributorAvatarText: { 
    fontSize: 16,
  },
  contributorName: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: colors.text.primary,
  },
  contributorAmounts: { 
    flexDirection: "row", 
    gap: 20,
  },
  amountColumn: { 
    alignItems: "flex-end",
  },
  amountLabel: { 
    fontSize: 11, 
    color: colors.text.tertiary, 
    marginBottom: 3,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  amountValue: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: colors.text.primary,
  },
  goalActions: { 
    flexDirection: "row", 
    gap: 8,
  },
  actionBtn: { 
    flex: 1, 
    backgroundColor: colors.primary, 
    borderRadius: 12, 
    paddingVertical: 12, 
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: { 
    color: colors.surface, 
    fontWeight: "700", 
    fontSize: 14,
  },
  actionBtnSecondary: { 
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  actionBtnTextSecondary: { 
    color: colors.text.primary, 
    fontWeight: "700", 
    fontSize: 14,
  },
  actionBtnEdit: {
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  actionBtnEditText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  actionBtnDelete: {
    flex: 0,
    width: 44,
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  actionsGrid: { 
    flexDirection: "row", 
    gap: 16,
  },
  actionCard: { 
    flex: 1, 
    backgroundColor: colors.surface,
    borderRadius: 20, 
    padding: 24, 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: { 
    fontSize: 32, 
    marginBottom: 8,
  },
  actionText: { 
    fontSize: 13, 
    color: colors.text.secondary, 
    fontWeight: "600", 
    textAlign: "center",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text.primary,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: 8,
  },
  formInputCurrency: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text.primary,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryBtnTextActive: {
    color: colors.surface,
  },
  iconButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.background,
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBtnSave: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalBtnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
