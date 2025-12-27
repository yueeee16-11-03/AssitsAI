import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTransactionData } from '../../hooks/useTransactionData';
import { useHabitStore } from '../../store/habitStore';
import { useGoalStore } from '../../store/goalStore';

type Props = NativeStackScreenProps<RootStackParamList, "MemberDetail">;

export default function MemberDetailScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [selectedTab, setSelectedTab] = useState<"finance" | "habits" | "goals">("finance");
  const theme = useTheme();
  const styles = getStyles(theme);

  // Get member ID from route params
  const memberId = (route.params as any)?.memberId || '';
  
  // Get transaction data from hook
  const txData = useTransactionData() as any;
  
  // Wrap transactions in useMemo to prevent dependency issues
  const transactions = React.useMemo(() => txData?.transactions || [], [txData?.transactions]);
  
  // Get habits and goals from stores
  const habits = useHabitStore((state: any) => state.habits);
  const goals = useGoalStore((state: any) => state.goals);
  const fetchHabits = useHabitStore((state: any) => state.fetchHabits);
  const fetchGoals = useGoalStore((state: any) => state.fetchGoals);

  const [isLoading, setIsLoading] = useState(true);

  // Calculate income and expense from transactions
  const { income, expense } = React.useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions?.forEach((trans: any) => {
      if (trans.type === 'income') totalIncome += trans.amount || 0;
      else if (trans.type === 'expense') totalExpense += trans.amount || 0;
    });
    return { income: totalIncome, expense: totalExpense };
  }, [transactions]);

  // 🎨 Color Variables - Chi tiết màu cho từng phần
  const colors = {
    // Background Colors
    containerBg: theme.colors.background,
    headerBg: theme.colors.surface,
    cardBg: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,137,123,0.08)',
    tabBg: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,137,123,0.1)',
    
    // Border Colors
    cardBorder: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.15)',
    progressBg: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,137,123,0.1)',
    
    // Text Colors
    primaryText: theme.colors.primary,
    secondaryText: theme.colors.secondary,
    labelText: theme.colors.onSurfaceVariant,
    mutedText: theme.dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    
    // Icon & Status Colors
    incomeColor: '#10B981',      // Xanh lá
    expenseColor: '#EF4444',     // Đỏ
    warningColor: '#F59E0B',     // Cam
    successColor: '#10B981',     // Xanh lá
    
    // Category Colors
    categoryFood: '#EC4899',     // Hồng
    categoryTravel: '#8B5CF6',   // Tím
    categoryHome: '#6366F1',     // Xanh dương
    categoryOther: '#10B981',    // Xanh lá
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Fetch habits and goals only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        // Fetch habits and goals in parallel
        await Promise.all([
          fetchHabits(),
          fetchGoals(),
        ]);
      } catch (error) {
        console.error('Error loading habits/goals:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadAllData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run only once on mount

  // Get member from currentFamily
  const member = React.useMemo(() => {
    return {
      name: "Thành viên gia đình",
      avatar: "account",
      role: "Thành viên",
      color: "#6366F1",
      userId: memberId,
    };
  }, [memberId]);

  // Calculate saving
  const saving = income - expense;

  // Format transactions for display
  const displayTransactions = React.useMemo(() => {
    return (transactions || []).slice(0, 5).map((trans: any) => ({
      id: trans.id || Math.random().toString(),
      type: trans.type || 'expense',
      amount: Math.abs(trans.amount || 0),
      category: trans.category || 'Khác',
      date: 'Hôm nay',
      icon: 'cash',
    }));
  }, [transactions]);

  // Group transactions by category
  const displayCategories = React.useMemo(() => {
    const categoryMap = new Map<string, any>();
    const categoryColors = ['#EC4899', '#8B5CF6', '#6366F1', '#10B981'];
    let idx = 0;
    (transactions || []).forEach((trans: any) => {
      if (trans.type === 'expense') {
        const cat = trans.category || 'Khác';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { name: cat, amount: 0, color: categoryColors[idx++ % categoryColors.length] });
        }
        categoryMap.get(cat)!.amount += Math.abs(trans.amount || 0);
      }
    });
    return Array.from(categoryMap.values()).slice(0, 4);
  }, [transactions]);

  // Format habits data
  const habitsData = React.useMemo(() => {
    return (habits || []).map((habit: any) => ({
      id: habit.id,
      name: habit.name || 'Thói quen',
      icon: habit.icon || 'check-circle',
      completed: habit.completedCount || 0,
      total: habit.targetCount || 0,
      streak: habit.streak || 0,
      progress: habit.progress || 0,
      color: habit.color || '#10B981',
    }));
  }, [habits]);

  // Format goals data
  const goalsData = React.useMemo(() => {
    return (goals || []).map((goal: any) => {
      // Handle Firebase Timestamp or Date conversion
      let deadlineStr = '31/12/2025';
      if (goal.deadline) {
        try {
          // If it's a Firebase Timestamp with toDate method
          if (goal.deadline.toDate) {
            deadlineStr = goal.deadline.toDate().toLocaleDateString('vi-VN');
          } 
          // If it's already a Date
          else if (goal.deadline instanceof Date) {
            deadlineStr = goal.deadline.toLocaleDateString('vi-VN');
          }
          // If it's a string
          else if (typeof goal.deadline === 'string') {
            deadlineStr = goal.deadline;
          }
        } catch (e) {
          console.warn('Error formatting deadline:', e);
          deadlineStr = '31/12/2025';
        }
      }
      
      return {
        id: goal.id,
        name: goal.title || goal.name || 'Mục tiêu',
        icon: goal.icon || 'target',
        target: goal.targetAmount || 0,
        current: goal.currentAmount || 0,
        deadline: deadlineStr,
        color: goal.color || '#8B5CF6',
      };
    });
  }, [goals]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.containerBg }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tabBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: colors.primaryText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Chi tiết thành viên</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="pencil" size={20} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {isLoading || !member ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.containerBg }]}>
          <ActivityIndicator size="large" color={colors.primaryText} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} 
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Member Profile */}
            <View style={[styles.profileCard, { borderTopColor: member.color, backgroundColor: colors.cardBg }]}>
              <View style={[styles.avatar, { backgroundColor: `${member.color}22` }]}>
                <Icon name={member.avatar as any} size={48} color={member.color} />
              </View>
              <Text style={[styles.memberName, { color: colors.primaryText }]}>{member.name}</Text>
              <Text style={[styles.memberRole, { color: colors.labelText }]}>{member.role}</Text>
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabSelector, { backgroundColor: colors.tabBg }]}>
              <TouchableOpacity
                style={[
                  styles.tab, 
                  selectedTab === "finance" && [styles.tabActive, { backgroundColor: colors.secondaryText }]
                ]}
                onPress={() => setSelectedTab("finance")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon 
                    name="currency-usd" 
                    size={16} 
                    color={selectedTab === "finance" ? "#FFFFFF" : colors.labelText} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.tabText, 
                    selectedTab === "finance" && [styles.tabTextActive, { color: '#FFFFFF' }],
                    selectedTab !== "finance" && { color: colors.labelText }
                  ]}>
                    Tài chính
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab, 
                  selectedTab === "habits" && [styles.tabActive, { backgroundColor: colors.secondaryText }]
                ]}
                onPress={() => setSelectedTab("habits")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon 
                    name="check-circle" 
                    size={16} 
                    color={selectedTab === "habits" ? "#FFFFFF" : colors.labelText} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.tabText, 
                    selectedTab === "habits" && [styles.tabTextActive, { color: '#FFFFFF' }],
                    selectedTab !== "habits" && { color: colors.labelText }
                  ]}>
                    Thói quen
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab, 
                  selectedTab === "goals" && [styles.tabActive, { backgroundColor: colors.secondaryText }]
                ]}
                onPress={() => setSelectedTab("goals")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon 
                    name="target" 
                    size={16} 
                    color={selectedTab === "goals" ? "#FFFFFF" : colors.labelText} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.tabText, 
                    selectedTab === "goals" && [styles.tabTextActive, { color: '#FFFFFF' }],
                    selectedTab !== "goals" && { color: colors.labelText }
                  ]}>
                    Mục tiêu
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Finance Tab */}
            {selectedTab === "finance" && (
              <View>
                <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: colors.labelText }]}>Thu nhập</Text>
                      <Text style={[styles.summaryValue, { color: colors.incomeColor }]}>
                        ₫{(income / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: colors.labelText }]}>Chi tiêu</Text>
                      <Text style={[styles.summaryValue, { color: colors.expenseColor }]}>
                        ₫{(expense / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: colors.labelText }]}>Tiết kiệm</Text>
                      <Text style={[styles.summaryValue, { color: colors.primaryText }]}>
                        ₫{(saving / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                  </View>
                </View>

                {displayCategories.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Chi tiêu theo danh mục</Text>
                    {displayCategories.map((cat: any, index: number) => {
                      const percent = expense > 0 ? (cat.amount / expense) * 100 : 0;
                      return (
                        <View key={index} style={[styles.categoryCard, { backgroundColor: colors.cardBg }]}>
                          <View style={styles.categoryHeader}>
                            <Text style={[styles.categoryName, { color: colors.primaryText }]}>{cat.name}</Text>
                            <Text style={[styles.categoryAmount, { color: colors.secondaryText }]}>₫{(cat.amount / 1000000).toFixed(1)}M</Text>
                          </View>
                          <View style={[styles.categoryProgress, { backgroundColor: colors.progressBg }]}>
                            <View style={[styles.categoryFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: cat.color }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {displayTransactions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Giao dịch gần đây</Text>
                    {displayTransactions.map((trans: any) => (
                      <View key={trans.id} style={[styles.transactionCard, { backgroundColor: colors.cardBg }]}>
                        <Icon 
                          name={trans.icon as any} 
                          size={20} 
                          color={trans.type === "income" ? colors.incomeColor : colors.expenseColor} 
                        />
                        <View style={styles.transInfo}>
                          <Text style={[styles.transCategory, { color: colors.primaryText }]}>{trans.category}</Text>
                          <Text style={[styles.transDate, { color: colors.labelText }]}>{trans.date}</Text>
                        </View>
                        <Text style={[
                          styles.transAmount, 
                          { color: trans.type === "income" ? colors.incomeColor : colors.expenseColor }
                        ]}>
                          {trans.type === "income" ? "+" : "-"}₫{(trans.amount / 1000).toFixed(0)}K
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {displayTransactions.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="history" size={48} color={colors.labelText} />
                    <Text style={[styles.emptyStateText, { color: colors.labelText }]}>Chưa có giao dịch</Text>
                  </View>
                )}
              </View>
            )}

            {/* Habits Tab */}
            {selectedTab === "habits" && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Thói quen</Text>
                {habitsData.length > 0 ? (
                  habitsData.map((habit: any) => (
                    <View key={habit.id} style={[styles.habitCard, { backgroundColor: colors.cardBg }]}>
                      <View style={styles.habitHeader}>
                        <Icon name={habit.icon as any} size={20} color={habit.color} />
                        <View style={styles.habitInfo}>
                          <Text style={[styles.habitName, { color: colors.primaryText }]}>{habit.name}</Text>
                          <Text style={[styles.habitMeta, { color: colors.labelText }]}>
                            {habit.completed}/{habit.total} ngày • <Icon name="fire" size={12} color={colors.warningColor} /> {habit.streak}
                          </Text>
                        </View>
                        <Text style={[styles.habitPercent, { color: colors.secondaryText }]}>{habit.progress}%</Text>
                      </View>
                      <View style={[styles.habitProgress, { backgroundColor: colors.progressBg }]}>
                        <View style={[styles.habitFill, { width: `${Math.min(habit.progress, 100)}%`, backgroundColor: habit.color }]} />
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="calendar-check" size={48} color={colors.labelText} />
                    <Text style={[styles.emptyStateText, { color: colors.labelText }]}>Chưa có thói quen</Text>
                  </View>
                )}
              </View>
            )}

            {/* Goals Tab */}
            {selectedTab === "goals" && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Mục tiêu tiết kiệm</Text>
                {goalsData.length > 0 ? (
                  goalsData.map((goal: any) => {
                    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                    return (
                      <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.cardBg }]}>
                        <View style={styles.goalHeader}>
                          <Icon name={goal.icon as any} size={20} color={goal.color} />
                          <View style={styles.goalInfo}>
                            <Text style={[styles.goalName, { color: colors.primaryText }]}>{goal.name}</Text>
                            <Text style={[styles.goalDeadline, { color: colors.labelText }]}>
                              <Icon name="calendar" size={12} color={colors.labelText} /> {goal.deadline}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.goalAmounts}>
                          <Text style={[styles.goalCurrent, { color: goal.color }]}>₫{(goal.current / 1000000).toFixed(1)}M</Text>
                          <Text style={[styles.goalTarget, { color: colors.labelText }]}>/ ₫{(goal.target / 1000000).toFixed(1)}M</Text>
                        </View>
                        <View style={[styles.goalProgress, { backgroundColor: colors.progressBg }]}>
                          <View style={[styles.goalFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }]} />
                        </View>
                        <Text style={[styles.goalPercent, { color: colors.labelText }]}>{progress.toFixed(0)}%</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="target" size={48} color={colors.labelText} />
                    <Text style={[styles.emptyStateText, { color: colors.labelText }]}>Chưa có mục tiêu tiết kiệm</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
          <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingTop: 12, 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  backIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  editButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 14, marginTop: 12, fontWeight: "600" },
  
  // Profile Card
  profileCard: { 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 20, 
    alignItems: "center", 
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)',
  },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  memberName: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  memberRole: { fontSize: 14 },
  
  // Tab Selector
  tabSelector: { borderRadius: 12, padding: 4, marginBottom: 20, flexDirection: "row", gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabTextActive: { },
  
  // Summary Card
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)' },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  
  // Category Card
  categoryCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)' },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: "700" },
  categoryAmount: { fontSize: 14, fontWeight: "700" },
  categoryProgress: { height: 6, borderRadius: 3, overflow: "hidden" },
  categoryFill: { height: "100%", borderRadius: 3 },
  
  // Transaction Card
  transactionCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)',
  },
  transInfo: { flex: 1, marginLeft: 12 },
  transCategory: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  transDate: { fontSize: 12 },
  transAmount: { fontSize: 15, fontWeight: "800" },
  
  // Habit Card
  habitCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)' },
  habitHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  habitInfo: { flex: 1, marginLeft: 12 },
  habitName: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  habitMeta: { fontSize: 12 },
  habitPercent: { fontSize: 18, fontWeight: "800" },
  habitProgress: { height: 6, borderRadius: 3, overflow: "hidden" },
  habitFill: { height: "100%", borderRadius: 3 },
  
  // Goal Card
  goalCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.1)' },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  goalInfo: { flex: 1, marginLeft: 12 },
  goalName: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  goalDeadline: { fontSize: 12 },
  goalAmounts: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  goalCurrent: { fontSize: 20, fontWeight: "900" },
  goalTarget: { fontSize: 14, marginLeft: 4 },
  goalProgress: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  goalFill: { height: "100%", borderRadius: 4 },
  goalPercent: { fontSize: 13, textAlign: "right" },
});
