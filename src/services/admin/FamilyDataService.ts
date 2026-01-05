import { FamilyMember } from '../FamilyMemberService';
import firestore from '@react-native-firebase/firestore';

/**
 * Service to handle family overview data and member statistics
 */

export interface MemberFinanceData {
  income: number;
  expense: number;
  saving: number;
}

export interface MemberHabitsData {
  completed: number;
  total: number;
  streak: number;
}

export interface FamilyMemberWithStats extends FamilyMember {
  finance?: MemberFinanceData;
  habits?: MemberHabitsData;
  goals?: number;
}

export interface FamilyOverviewStats {
  totalMembers: number;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  walletBalance: number;
  totalGoals: number;
  completedHabits: number;
  totalHabits: number;
  habitCompletionRate: number;
}

export class FamilyDataService {
  /**
   * Calculate family overview statistics from members
   */
  static calculateFamilyStats(members: FamilyMemberWithStats[]): FamilyOverviewStats {
    const totalIncome = members.reduce((sum, m) => sum + (m.finance?.income || 0), 0);
    const totalExpense = members.reduce((sum, m) => sum + (m.finance?.expense || 0), 0);
    const totalSaving = members.reduce((sum, m) => sum + (m.finance?.saving || 0), 0);
    const totalGoals = members.reduce((sum, m) => sum + (m.goals || 0), 0);
    const completedHabits = members.reduce((sum, m) => sum + (m.habits?.completed || 0), 0);
    const totalHabits = members.reduce((sum, m) => sum + (m.habits?.total || 0), 0);

    return {
      totalMembers: members.length,
      totalIncome,
      totalExpense,
      totalSaving,
      walletBalance: totalIncome - totalExpense,
      totalGoals,
      completedHabits,
      totalHabits,
      habitCompletionRate: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0,
    };
  }

  /**
   * Format currency to display format (e.g., 12.5M, 1.2B)
   */
  static formatCurrency(amount: number): string {
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1_000_000_000) {
      return `₫${(amount / 1_000_000_000).toFixed(1)}B`;
    } else if (absAmount >= 1_000_000) {
      return `₫${(amount / 1_000_000).toFixed(1)}M`;
    } else if (absAmount >= 1_000) {
      return `₫${(amount / 1_000).toFixed(1)}K`;
    } else {
      return `₫${amount.toFixed(0)}`;
    }
  }

  /**
   * Enrich members with mock finance and habits data
   * TODO: Replace with real API data when available
   */
  static enrichMembersWithMockData(members: FamilyMember[]): FamilyMemberWithStats[] {
    return members.map(member => {
      const memberWithStats = member as any;
      return {
        ...member,
        finance: memberWithStats.finance || {
          income: Math.random() * 50_000_000,
          expense: Math.random() * 30_000_000,
          saving: Math.random() * 20_000_000,
        },
        habits: memberWithStats.habits || {
          completed: Math.floor(Math.random() * 10),
          total: 10,
          streak: Math.floor(Math.random() * 30),
        },
        goals: memberWithStats.goals || Math.floor(Math.random() * 5),
      };
    });
  }

  /**
   * Calculate habit completion rate for a member
   */
  static calculateMemberHabitRate(member: FamilyMemberWithStats): number {
    if (!member.habits || member.habits.total === 0) return 0;
    return (member.habits.completed / member.habits.total) * 100;
  }

  /**
   * Get member role display text with emoji
   */
  static getMemberRoleDisplay(role: string): string {
    switch (role) {
      case 'owner':
        return '👑 Chủ nhóm';
      case 'admin':
        return '⭐ Quản trị viên';
      case 'child':
        return '👶 Con em';
      default:
        return '👤 Thành viên';
    }
  }

  /**
   * Get member avatar icon based on role
   */
  static getMemberAvatarIcon(role: string): string {
    return role === 'owner' ? 'account' : 'account-outline';
  }

  /**
   * Calculate financial health score (0-100)
   */
  static calculateFinancialHealth(member: FamilyMemberWithStats): number {
    if (!member.finance) return 0;
    
    const { income, expense, saving } = member.finance;
    if (income === 0) return 0;

    const savingRate = (saving / income) * 100;
    const expenseRate = (expense / income) * 100;

    // Good: High saving rate (>20%), Low expense rate (<70%)
    const savingScore = Math.min(savingRate * 2.5, 50); // Max 50 points
    const expenseScore = Math.max(0, 50 - (expenseRate * 0.5)); // Max 50 points

    return Math.round(savingScore + expenseScore);
  }

  /**
   * Get financial health status
   */
  static getFinancialHealthStatus(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Xuất sắc', color: '#10B981' };
    if (score >= 60) return { label: 'Tốt', color: '#3B82F6' };
    if (score >= 40) return { label: 'Trung bình', color: '#F59E0B' };
    return { label: 'Cần cải thiện', color: '#EF4444' };
  }

  /**
   * Sort members by different criteria
   */
  static sortMembers(
    members: FamilyMemberWithStats[],
    sortBy: 'income' | 'expense' | 'saving' | 'habits' | 'goals' | 'name'
  ): FamilyMemberWithStats[] {
    const sorted = [...members];

    switch (sortBy) {
      case 'income':
        return sorted.sort((a, b) => (b.finance?.income || 0) - (a.finance?.income || 0));
      case 'expense':
        return sorted.sort((a, b) => (b.finance?.expense || 0) - (a.finance?.expense || 0));
      case 'saving':
        return sorted.sort((a, b) => (b.finance?.saving || 0) - (a.finance?.saving || 0));
      case 'habits':
        return sorted.sort((a, b) => {
          const rateA = this.calculateMemberHabitRate(a);
          const rateB = this.calculateMemberHabitRate(b);
          return rateB - rateA;
        });
      case 'goals':
        return sorted.sort((a, b) => (b.goals || 0) - (a.goals || 0));
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return sorted;
    }
  }

  /**
   * Filter members by role
   */
  static filterMembersByRole(
    members: FamilyMemberWithStats[],
    role: 'owner' | 'admin' | 'member' | 'child' | 'all'
  ): FamilyMemberWithStats[] {
    if (role === 'all') return members;
    return members.filter(m => m.role === role);
  }

  /**
   * Get shared wallet balance for family
   */
  static async getSharedWalletBalance(familyId: string): Promise<number> {
    try {
      const walletsSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedWallets')
        .get();

      const totalBalance = walletsSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.balance || 0);
      }, 0);

      return totalBalance;
    } catch (error) {
      console.error('Error fetching shared wallet balance:', error);
      return 0;
    }
  }

  /**
   * Get total family goals count (aggregate from all members)
   */
  static async getFamilyGoalsCount(familyId: string, members: FamilyMember[]): Promise<number> {
    try {
      // Goals are stored per user, not at family level
      // Aggregate goals from all family members
      const goalCounts = await Promise.all(
        members.map(async (member) => {
          try {
            const goalsSnapshot = await firestore()
              .collection('users')
              .doc(member.userId)
              .collection('goals')
              .where('isCompleted', '==', false)
              .get();
            return goalsSnapshot.size;
          } catch (error) {
            console.warn(`Error fetching goals for member ${member.userId}:`, error);
            return 0;
          }
        })
      );

      return goalCounts.reduce((sum, count) => sum + count, 0);
    } catch (error) {
      console.error('Error fetching family goals:', error);
      return 0;
    }
  }

  /**
   * Get member's monthly financial data (current month)
   */
  static async getMemberMonthlyFinance(userId: string): Promise<MemberFinanceData> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const transactionsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('createdAt', '>=', firestore.Timestamp.fromDate(firstDayOfMonth))
        .where('createdAt', '<=', firestore.Timestamp.fromDate(lastDayOfMonth))
        .get();

      let income = 0;
      let expense = 0;

      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        
        if (data.type === 'income') {
          income += amount;
        } else if (data.type === 'expense') {
          expense += amount;
        }
      });

      const saving = income - expense;

      return { income, expense, saving };
    } catch (error) {
      console.error(`Error fetching monthly finance for user ${userId}:`, error);
      return { income: 0, expense: 0, saving: 0 };
    }
  }

  /**
   * Get member's habit statistics
   */
  static async getMemberHabits(userId: string): Promise<MemberHabitsData> {
    try {
      const habitsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('habits')
        .get();

      let completed = 0;
      let total = habitsSnapshot.size;
      let maxStreak = 0;

      habitsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isCompleted || data.completedToday) {
          completed++;
        }
        if (data.streak && data.streak > maxStreak) {
          maxStreak = data.streak;
        }
      });

      return {
        completed,
        total,
        streak: maxStreak,
      };
    } catch (error) {
      console.error(`Error fetching habits for user ${userId}:`, error);
      return { completed: 0, total: 0, streak: 0 };
    }
  }

  /**
   * Get member's active goals count
   */
  static async getMemberGoalsCount(userId: string): Promise<number> {
    try {
      const goalsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('goals')
        .where('isCompleted', '==', false)
        .get();

      return goalsSnapshot.size;
    } catch (error) {
      console.error(`Error fetching goals for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Enrich members with REAL finance and habits data from Firebase
   */
  static async enrichMembersWithRealData(members: FamilyMember[]): Promise<FamilyMemberWithStats[]> {
    try {
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const [finance, habits, goalsCount] = await Promise.all([
            this.getMemberMonthlyFinance(member.userId),
            this.getMemberHabits(member.userId),
            this.getMemberGoalsCount(member.userId),
          ]);

          return {
            ...member,
            finance,
            habits,
            goals: goalsCount,
          };
        })
      );

      return enrichedMembers;
    } catch (error) {
      console.error('Error enriching members with real data:', error);
      // Fallback to mock data if real data fails
      return this.enrichMembersWithMockData(members);
    }
  }
}
