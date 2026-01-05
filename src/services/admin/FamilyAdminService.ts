/**
 * FamilyAdminService.ts
 * Service để quản lý dữ liệu tổng quan quản trị gia đình
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface AdminStats {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  savingRate: number;
  averageTransactionValue: number;
  highestSpender: string;
  highestSpenderToday: string; // Người chi nhiều nhất hôm nay
  highestSpenderTodayAmount: number; // Số tiền chi hôm nay
  averageTransactionValueToday: number; // TB giao dịch hôm nay
  todayTransactionCount: number; // Số giao dịch hôm nay
  // Today's financial stats
  todayIncome: number; // Thu nhập hôm nay
  todayExpense: number; // Chi tiêu hôm nay
  todaySaving: number; // Tiết kiệm hôm nay
  todaySavingRate: number; // Tỷ lệ tiết kiệm hôm nay
  spendingTrend: string;
  transactionCount: number;
  budgetUsage: number;
}

export interface MemberFinance {
  id: string;
  uid: string;
  name: string;
  avatar?: string;
  income: number;
  expense: number;
  saving: number;
  spendingPercent: number;
  transactionCount: number;
}

export interface CategoryAnalysis {
  id: string;
  name: string;
  icon: string;
  totalAmount: number;
  percentage: number;
  trend: string;
  transactionCount: number;
  topSpender: string;
}

export interface MemberCategoryAnalysis {
  userId: string;
  userName: string;
  userAvatar?: string;
  categories: CategoryAnalysis[];
  totalExpense: number;
}

export interface TodayTransaction {
  id: string;
  userId: string;
  memberName: string;
  amount: number;
  type: string;
  category?: string;
  description?: string;
  date: any;
  createdAt: any;
}

export interface AdminDashboardData {
  stats: AdminStats;
  members: MemberFinance[];
  categories: CategoryAnalysis[];
  memberCategories: MemberCategoryAnalysis[]; // Categories grouped by member
  todayTransactions: TodayTransaction[]; // All today's transactions for dropdown
  lastUpdated: Date;
}

export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

class FamilyAdminService {
  /**
   * Check if user has admin access
   */
  async hasAdminAccess(familyId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) return false;

      const familyData = familyDoc.data() as any;
      
      // Owner always has admin access
      if (familyData.ownerId === currentUser.uid) return true;

      // Check if user is admin in members list
      const memberData = familyData.members?.[currentUser.uid];
      return memberData?.role === 'admin';
    } catch (error) {
      console.error('❌ [FamilyAdminService] Error checking admin access:', error);
      return false;
    }
  }

  /**
   * Get admin dashboard data
   * @param filterByCurrentMonth - If false, will show all transactions (for debugging)
   * @param timePeriod - Time period to filter member data: 'day', 'week', 'month', 'year', 'all'
   * @param categoryPeriod - Time period to filter category data: 'day', 'week', 'month', 'year', 'all'
   */
  async getDashboardData(
    familyId: string, 
    filterByCurrentMonth: boolean = true,
    timePeriod: TimePeriod = 'month',
    categoryPeriod: TimePeriod = 'month'
  ): Promise<AdminDashboardData> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check admin access
      const hasAccess = await this.hasAdminAccess(familyId);
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }

      // Get current month range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get previous month range for trend calculation
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      console.log('📊 [FamilyAdminService] Fetching transactions for period:', {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
        previousMonthStart: startOfPreviousMonth.toISOString(),
        previousMonthEnd: endOfPreviousMonth.toISOString(),
        filterByCurrentMonth,
      });

      // Fetch family data first
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;

      // 🔍 Lấy danh sách members của family từ family_members collection
      const memberSnapshots = await firestore()
        .collection('family_members')
        .where('familyId', '==', familyId)
        .get();

      console.log('👥 [FamilyAdminService] Found members:', memberSnapshots.size);
      
      if (memberSnapshots.size === 0) {
        console.warn('⚠️ [FamilyAdminService] No members found in family_members collection for familyId:', familyId);
      }

      // Map userId -> name
      const memberNameMap = new Map<string, string>();
      memberSnapshots.docs.forEach((doc) => {
        const data = doc.data() as any;
        memberNameMap.set(data.userId, data.name || 'Unknown');
      });

      const memberIds = Array.from(memberNameMap.keys());
      console.log('📋 [FamilyAdminService] Member IDs:', memberIds);

      // 🔄 Lấy transactions của tất cả members từ /users/{userId}/transactions
      let allTransactions: any[] = [];
      
      for (const memberId of memberIds) {
        try {
          // Lấy TẤT CẢ transactions không filter date (giống FamilyTransactionService)
          const txSnapshot = await firestore()
            .collection('users')
            .doc(memberId)
            .collection('transactions')
            .get({ source: 'server' });

          console.log(`📝 [FamilyAdminService] Member ${memberId} transactions:`, txSnapshot.size);

          txSnapshot.docs.forEach(doc => {
            const data = doc.data();
            allTransactions.push({
              id: doc.id,
              userId: memberId,
              memberName: memberNameMap.get(memberId) || 'Unknown',
              ...data,
            });
          });
        } catch (error) {
          console.warn(`⚠️ [FamilyAdminService] Failed to fetch transactions for user ${memberId}:`, error);
          // Continue với member khác nếu member này bị lỗi
        }
      }

      console.log('💰 [FamilyAdminService] Total transactions found (before filter):', allTransactions.length);

      // � Lưu bản sao của tất cả transactions (không filter) để dùng cho today calculation
      const allTransactionsOriginal = [...allTransactions];

      // �📅 Filter theo tháng hiện tại và tháng trước
      const transactionsBeforeFilter = allTransactions.length;
      let previousMonthTransactions: any[] = [];
      
      if (filterByCurrentMonth) {
        // Lọc transactions tháng trước để tính xu hướng
        previousMonthTransactions = allTransactions.filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) return false;
          return txDate >= startOfPreviousMonth && txDate <= endOfPreviousMonth;
        });

        console.log('📊 [FamilyAdminService] Previous month transactions:', previousMonthTransactions.length);

        // Lọc transactions tháng hiện tại
        allTransactions = allTransactions.filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) {
            console.log('⚠️ Transaction without date:', tx.id, tx);
            return false;
          }
          const isInMonth = txDate >= startOfMonth && txDate <= endOfMonth;
          if (!isInMonth) {
            console.log('🚫 Transaction outside current month:', {
              id: tx.id,
              date: txDate.toISOString(),
              expected: `${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
            });
          } else {
            console.log('✅ Transaction in current month:', {
              id: tx.id,
              date: txDate,
              type: tx.type,
              amount: tx.amount,
            });
          }
          return isInMonth;
        });

        console.log('💰 [FamilyAdminService] Transactions after month filter:', allTransactions.length);
        console.log('📋 [FamilyAdminService] Filter removed', transactionsBeforeFilter - allTransactions.length, 'transactions');
      } else {
        console.log('⚠️ [FamilyAdminService] Showing ALL transactions (no month filter)');
      }

      if (allTransactions.length === 0) {
        console.warn('⚠️ [FamilyAdminService] No transactions found!');
        if (filterByCurrentMonth) {
          console.warn('📅 Current month range:', {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
          });
          console.warn('💡 Try setting filterByCurrentMonth=false to see all transactions');
        }
      }

      // Calculate stats (pass memberNameMap, previousMonthTransactions, và allTransactions gốc)
      const stats = this.calculateStats(
        allTransactions, 
        familyData, 
        memberNameMap, 
        previousMonthTransactions,
        allTransactionsOriginal // Pass unfiltered transactions for today calculation
      );

      // Calculate member finances (pass memberNameMap and timePeriod for filtering)
      const members = await this.calculateMemberFinances(
        familyId,
        allTransactions,
        familyData,
        memberNameMap,
        timePeriod
      );

      // Calculate category analysis (pass memberNameMap and categoryPeriod)
      const categories = this.calculateCategoryAnalysis(
        allTransactions,
        familyData,
        memberNameMap,
        categoryPeriod
      );

      // Calculate categories by member (grouped by each member)
      const memberCategories = await this.calculateCategoriesByMember(
        familyId,
        allTransactions,
        familyData,
        memberNameMap,
        categoryPeriod
      );

      // Get today's transactions for dropdown
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const todayTransactions = allTransactionsOriginal
        .filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) return false;
          return txDate >= startOfToday && txDate <= endOfToday;
        })
        .map(tx => ({
          id: tx.id,
          userId: tx.userId || tx.createdBy,
          memberName: tx.memberName,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          description: tx.description,
          date: tx.date,
          createdAt: tx.createdAt,
        }));

      console.log('✅ [FamilyAdminService] Dashboard data calculated:', {
        familyId,
        transactionCount: allTransactions.length,
        memberCount: members.length,
        categoryCount: categories.length,
        memberCategoryGroups: memberCategories.length,
        todayTransactionCount: todayTransactions.length,
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
      });

      return {
        stats,
        members,
        categories,
        memberCategories,
        todayTransactions,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('❌ [FamilyAdminService] Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate overall statistics
   */
  private calculateStats(
    transactions: any[], 
    familyData: any, 
    memberNameMap: Map<string, string>,
    previousMonthTransactions: any[] = [],
    allTransactionsOriginal: any[] = [] // All transactions for today calculation
  ): AdminStats {
    let totalIncome = 0;
    let totalExpense = 0;
    const spenderMap = new Map<string, number>();

    console.log('🧮 [FamilyAdminService] Calculating stats from transactions:', transactions.length);

    // Tính tổng thu chi từ transactions đã filter (tháng hiện tại)
    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount || 0);
      const type = transaction.type?.toLowerCase();

      if (type === 'income' || type === 'thu nhập') {
        totalIncome += amount;
      } else if (type === 'expense' || type === 'chi tiêu' || type === 'chi') {
        totalExpense += amount;
        
        // Track spender
        const userId = transaction.userId || transaction.createdBy;
        if (userId) {
          spenderMap.set(userId, (spenderMap.get(userId) || 0) + amount);
        }
      }
    });

    console.log('💵 Totals:', { totalIncome, totalExpense });

    const totalSaving = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? Math.round((totalSaving / totalIncome) * 100) : 0;
    const averageTransactionValue = transactions.length > 0 ? Math.round(totalExpense / transactions.length) : 0;
    
    // Tìm người chi tiêu nhiều nhất (tháng hiện tại) - Dùng memberNameMap từ family_members collection
    let highestSpender = 'Chưa có dữ liệu';
    let highestAmount = 0;
    
    spenderMap.forEach((amount, userId) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        const nameFromFamilyMembers = memberNameMap.get(userId);
        const memberData = familyData.members?.[userId];
        highestSpender = nameFromFamilyMembers 
          || memberData?.displayName 
          || memberData?.name 
          || 'Thành viên';
      }
    });

    // 🔥 TÍNH NGƯỜI CHI NHIỀU NHẤT HÔM NAY
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayTransactions = allTransactionsOriginal.filter(tx => {
      const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
      if (!txDate) return false;
      return txDate >= startOfToday && txDate <= endOfToday;
    });

    console.log('📅 [FamilyAdminService] Today transactions:', todayTransactions.length);

    let todayExpenseTotal = 0;
    let todayIncomeTotal = 0;
    const todaySpenderMap = new Map<string, number>();

    todayTransactions.forEach(tx => {
      const type = tx.type?.toLowerCase();
      const amount = Math.abs(tx.amount || 0);
      
      if (type === 'income' || type === 'thu nhập') {
        todayIncomeTotal += amount;
      } else if (type === 'expense' || type === 'chi tiêu' || type === 'chi') {
        todayExpenseTotal += amount;
        
        const userId = tx.userId || tx.createdBy;
        if (userId) {
          todaySpenderMap.set(userId, (todaySpenderMap.get(userId) || 0) + amount);
        }
      }
    });

    let highestSpenderToday = 'Chưa có chi tiêu hôm nay';
    let highestSpenderTodayAmount = 0;

    todaySpenderMap.forEach((amount, userId) => {
      if (amount > highestSpenderTodayAmount) {
        highestSpenderTodayAmount = amount;
        const nameFromFamilyMembers = memberNameMap.get(userId);
        const memberData = familyData.members?.[userId];
        highestSpenderToday = nameFromFamilyMembers 
          || memberData?.displayName 
          || memberData?.name 
          || 'Thành viên';
      }
    });

    console.log('👑 [FamilyAdminService] Today highest spender:', {
      name: highestSpenderToday,
      amount: highestSpenderTodayAmount,
      totalExpense: todayExpenseTotal,
      transactionCount: todayTransactions.length,
    });

    const averageTransactionValueToday = todayTransactions.length > 0 
      ? Math.round(todayExpenseTotal / todayTransactions.length) 
      : 0;

    // Calculate today's saving and saving rate
    const todaySaving = todayIncomeTotal - todayExpenseTotal;
    const todaySavingRate = todayIncomeTotal > 0 
      ? Math.round((todaySaving / todayIncomeTotal) * 100) 
      : 0;

    console.log('💰 [FamilyAdminService] Today financial summary:', {
      income: todayIncomeTotal,
      expense: todayExpenseTotal,
      saving: todaySaving,
      savingRate: todaySavingRate,
    });

    // Calculate spending trend (compare with previous month)
    let spendingTrend = '0%';
    if (previousMonthTransactions.length > 0) {
      // Tính tổng chi tiêu tháng trước
      let previousMonthExpense = 0;
      previousMonthTransactions.forEach(tx => {
        const type = tx.type?.toLowerCase();
        if (type === 'expense' || type === 'chi tiêu' || type === 'chi') {
          previousMonthExpense += Math.abs(tx.amount || 0);
        }
      });

      console.log('📊 Spending comparison:', {
        currentMonth: totalExpense,
        previousMonth: previousMonthExpense,
      });

      if (previousMonthExpense > 0) {
        const percentChange = ((totalExpense - previousMonthExpense) / previousMonthExpense) * 100;
        const roundedChange = Math.round(percentChange);
        spendingTrend = roundedChange > 0 ? `+${roundedChange}%` : `${roundedChange}%`;
      } else if (totalExpense > 0) {
        spendingTrend = '+100%'; // Tháng trước không có chi tiêu, tháng này có
      }
    } else if (totalExpense > 0) {
      spendingTrend = 'Mới'; // Không có dữ liệu tháng trước
    }

    const budgetUsage = familyData.monthlyBudget > 0
      ? Math.round((totalExpense / familyData.monthlyBudget) * 100)
      : 0;

    return {
      totalIncome,
      totalExpense,
      totalSaving,
      savingRate: Math.max(0, Math.min(100, savingRate)),
      averageTransactionValue,
      highestSpender,
      highestSpenderToday,
      highestSpenderTodayAmount,
      averageTransactionValueToday,
      todayTransactionCount: todayTransactions.length,
      todayIncome: todayIncomeTotal,
      todayExpense: todayExpenseTotal,
      todaySaving,
      todaySavingRate,
      spendingTrend,
      transactionCount: transactions.length,
      budgetUsage,
    };
  }

  /**
   * Calculate member finances
   * @param timePeriod - Filter transactions by time period for member calculation
   */
  private async calculateMemberFinances(
    familyId: string,
    transactions: any[],
    familyData: any,
    memberNameMap: Map<string, string>,
    timePeriod: TimePeriod = 'month'
  ): Promise<MemberFinance[]> {
    const memberMap = new Map<string, { income: number; expense: number; count: number }>();
    const memberFinances: MemberFinance[] = [];

    console.log('👥 [FamilyAdminService] Calculating member finances with period:', timePeriod);
    console.log('Members from familyData:', familyData.members);
    console.log('Members from family_members collection:', Array.from(memberNameMap.entries()));

    // Get time period range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    let shouldFilter = timePeriod !== 'all';

    if (shouldFilter) {
      switch (timePeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }

      console.log('📅 [FamilyAdminService] Period range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    }

    // Filter transactions by period if needed
    const periodTransactions = shouldFilter
      ? transactions.filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) return false;
          return txDate >= startDate! && txDate <= endDate;
        })
      : transactions;

    console.log('📊 [FamilyAdminService] Transactions for period:', periodTransactions.length, '/', transactions.length);

    // Initialize all members từ memberNameMap
    // Vì memberNameMap chứa tất cả members trong gia đình
    memberNameMap.forEach((name, uid) => {
      memberMap.set(uid, { income: 0, expense: 0, count: 0 });
    });

    // Calculate transactions per member (using period-filtered transactions)
    periodTransactions.forEach(transaction => {
      const userId = transaction.userId || transaction.createdBy;
      if (!userId) {
        console.log('⚠️ Transaction without userId:', transaction.id);
        return;
      }

      const memberData = memberMap.get(userId) || { income: 0, expense: 0, count: 0 };
      const amount = Math.abs(transaction.amount || 0);
      const type = transaction.type?.toLowerCase();

      if (type === 'income' || type === 'thu nhập') {
        memberData.income += amount;
      } else if (type === 'expense' || type === 'chi tiêu' || type === 'chi') {
        memberData.expense += amount;
      }
      memberData.count += 1;

      memberMap.set(userId, memberData);
    });

    // Build member finance list
    const members = familyData.members || {};
    
    memberMap.forEach((data, uid) => {
      // Lấy tên từ memberNameMap (family_members collection)
      const nameFromFamilyMembers = memberNameMap.get(uid);
      
      // Lấy avatar từ familyData.members nếu có
      const memberInfo = members[uid];
      
      console.log(`👤 Processing member ${uid}:`, {
        name: nameFromFamilyMembers,
        hasAvatar: !!memberInfo?.avatar,
        transactions: data.count,
        income: data.income,
        expense: data.expense,
      });

      const income = data.income;
      const expense = data.expense;
      const saving = income - expense;
      
      // Calculate spending percent based on total expense if no income
      let spendingPercent = 0;
      if (income > 0) {
        spendingPercent = Math.round((expense / income) * 100);
      } else if (expense > 0) {
        // If member only has expenses, show as 100%
        spendingPercent = 100;
      }

      // Only add members with transactions
      if (data.count > 0) {
        memberFinances.push({
          id: uid,
          uid,
          name: nameFromFamilyMembers || memberInfo?.displayName || memberInfo?.name || 'Thành viên',
          avatar: memberInfo?.avatar,
          income,
          expense,
          saving,
          spendingPercent: Math.min(spendingPercent, 100),
          transactionCount: data.count,
        });
      }
    });

    // Sort by expense descending
    memberFinances.sort((a, b) => b.expense - a.expense);

    console.log('✅ Member finances calculated:', memberFinances.length);

    return memberFinances;
  }

  /**
   * Calculate category analysis
   * @param categoryPeriod - Filter transactions by time period for category calculation
   */
  private calculateCategoryAnalysis(
    transactions: any[],
    familyData: any,
    memberNameMap: Map<string, string>,
    categoryPeriod: TimePeriod = 'month'
  ): CategoryAnalysis[] {
    const categoryMap = new Map<string, { amount: number; count: number; spenders: Map<string, number> }>();
    const categories: CategoryAnalysis[] = [];

    console.log('📊 [FamilyAdminService] Calculating category analysis with period:', categoryPeriod);

    // Get time period range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    let shouldFilter = categoryPeriod !== 'all';

    if (shouldFilter) {
      switch (categoryPeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }

      console.log('📅 [FamilyAdminService] Category period range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    }

    // Filter transactions by period if needed
    const periodTransactions = shouldFilter
      ? transactions.filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) return false;
          return txDate >= startDate! && txDate <= endDate;
        })
      : transactions;

    console.log('📊 [FamilyAdminService] Category transactions for period:', periodTransactions.length, '/', transactions.length);

    let totalExpense = 0;

    // Calculate per category (using period-filtered transactions)
    periodTransactions.forEach(transaction => {
      const type = transaction.type?.toLowerCase();
      if (type !== 'expense' && type !== 'chi tiêu' && type !== 'chi') return;

      const categoryId = (transaction.category || transaction.categoryId || 'other').toLowerCase();
      const amount = Math.abs(transaction.amount || 0);
      const userId = transaction.userId || transaction.createdBy;

      totalExpense += amount;

      const categoryData = categoryMap.get(categoryId) || {
        amount: 0,
        count: 0,
        spenders: new Map<string, number>(),
      };

      categoryData.amount += amount;
      categoryData.count += 1;
      
      if (userId) {
        categoryData.spenders.set(userId, (categoryData.spenders.get(userId) || 0) + amount);
      }

      categoryMap.set(categoryId, categoryData);
    });

    console.log('💰 Total expense for categories:', totalExpense);

    // Build category list
    categoryMap.forEach((data, categoryId) => {
      const categoryInfo = this.getCategoryInfo(categoryId);
      
      const percentage = totalExpense > 0
        ? Math.round((data.amount / totalExpense) * 100)
        : 0;

      // Find top spender for this category - Dùng memberNameMap
      let topSpender = 'Chưa có dữ liệu';
      let topAmount = 0;
      data.spenders.forEach((amount, userId) => {
        if (amount > topAmount) {
          topAmount = amount;
          // Ưu tiên dùng memberNameMap
          const nameFromFamilyMembers = memberNameMap.get(userId);
          const memberData = familyData.members?.[userId];
          topSpender = nameFromFamilyMembers 
            || memberData?.displayName 
            || memberData?.name 
            || 'Thành viên';
        }
      });

      // Calculate trend indicator based on percentage
      // (Simplified - in production, compare with previous month's category data)
      let trend = '~';
      if (percentage > 25) {
        trend = '↑↑'; // Very high
      } else if (percentage > 15) {
        trend = '↑'; // High
      } else if (percentage > 5) {
        trend = '→'; // Normal
      } else {
        trend = '↓'; // Low
      }

      categories.push({
        id: categoryId,
        name: categoryInfo.name,
        icon: categoryInfo.icon,
        totalAmount: data.amount,
        percentage,
        trend,
        transactionCount: data.count,
        topSpender,
      });
    });

    // Sort by amount descending
    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    console.log('✅ Categories analyzed:', categories.length);

    return categories.slice(0, 10); // Top 10 categories
  }

  /**
   * Calculate categories by member (grouped by each member)
   * @param categoryPeriod - Filter transactions by time period for category calculation
   */
  private async calculateCategoriesByMember(
    familyId: string,
    transactions: any[],
    familyData: any,
    memberNameMap: Map<string, string>,
    categoryPeriod: TimePeriod = 'month'
  ): Promise<MemberCategoryAnalysis[]> {
    console.log('👥 [FamilyAdminService] Calculating categories by member with period:', categoryPeriod);

    // Get time period range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    let shouldFilter = categoryPeriod !== 'all';

    if (shouldFilter) {
      switch (categoryPeriod) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }

      console.log('📅 [FamilyAdminService] Member category period range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    }

    // Filter transactions by period if needed
    const periodTransactions = shouldFilter
      ? transactions.filter(tx => {
          const txDate = tx.date?.toDate?.() || (tx.createdAt?.toDate ? tx.createdAt.toDate() : null);
          if (!txDate) return false;
          return txDate >= startDate! && txDate <= endDate;
        })
      : transactions;

    console.log('📊 [FamilyAdminService] Member category transactions for period:', periodTransactions.length, '/', transactions.length);

    // Map: userId -> Map<categoryKey, CategoryData>
    const memberCategoryMap = new Map<string, Map<string, { amount: number; count: number }>>();

    // Initialize for all members
    memberNameMap.forEach((name, uid) => {
      memberCategoryMap.set(uid, new Map());
    });

    // Process transactions by member
    periodTransactions.forEach(transaction => {
      const type = transaction.type?.toLowerCase();
      if (type !== 'expense' && type !== 'chi tiêu' && type !== 'chi') return;

      const userId = transaction.userId || transaction.createdBy;
      if (!userId) return;

      const categoryId = (transaction.category || transaction.categoryId || 'other').toLowerCase();
      const amount = Math.abs(transaction.amount || 0);

      if (!memberCategoryMap.has(userId)) {
        memberCategoryMap.set(userId, new Map());
      }

      const userCategories = memberCategoryMap.get(userId)!;
      const categoryData = userCategories.get(categoryId) || { amount: 0, count: 0 };
      categoryData.amount += amount;
      categoryData.count += 1;
      userCategories.set(categoryId, categoryData);
    });

    // Build member category list
    const memberCategories: MemberCategoryAnalysis[] = [];
    const members = familyData.members || {};

    memberCategoryMap.forEach((categoriesMap, uid) => {
      // Get member info
      const nameFromFamilyMembers = memberNameMap.get(uid);
      const memberInfo = members[uid];
      const userName = nameFromFamilyMembers || memberInfo?.displayName || memberInfo?.name || 'Thành viên';
      const userAvatar = memberInfo?.avatar;

      // Calculate total expense for this member
      let totalExpense = 0;
      categoriesMap.forEach(data => {
        totalExpense += data.amount;
      });

      // Build category list for this member
      const categories: CategoryAnalysis[] = [];
      categoriesMap.forEach((data, categoryId) => {
        const categoryInfo = this.getCategoryInfo(categoryId);
        const percentage = totalExpense > 0
          ? Math.round((data.amount / totalExpense) * 100)
          : 0;

        // Calculate trend indicator based on percentage
        let trend = '~';
        if (percentage > 25) {
          trend = '↑↑'; // Very high
        } else if (percentage > 15) {
          trend = '↑'; // High
        } else if (percentage > 5) {
          trend = '→'; // Normal
        } else {
          trend = '↓'; // Low
        }

        categories.push({
          id: `${uid}-${categoryId}`,
          name: categoryInfo.name,
          icon: categoryInfo.icon,
          totalAmount: data.amount,
          percentage,
          trend,
          transactionCount: data.count,
          topSpender: userName, // For member-specific categories, topSpender is the member
        });
      });

      // Sort categories by amount descending
      categories.sort((a, b) => b.totalAmount - a.totalAmount);

      // Only add members with categories
      if (categories.length > 0) {
        memberCategories.push({
          userId: uid,
          userName,
          userAvatar,
          categories: categories.slice(0, 10), // Top 10 categories per member
          totalExpense,
        });
      }
    });

    // Sort by total expense descending
    memberCategories.sort((a, b) => b.totalExpense - a.totalExpense);

    console.log('✅ [FamilyAdminService] Member categories calculated:', {
      memberCount: memberCategories.length,
      totalCategories: memberCategories.reduce((sum, m) => sum + m.categories.length, 0),
    });

    return memberCategories;
  }

  /**
   * Get category info
   */
  private getCategoryInfo(categoryId: string): { name: string; icon: string } {
    const normalizedId = categoryId.toLowerCase().trim();
    
    const categoryMap: Record<string, { name: string; icon: string }> = {
      'food': { name: 'Ăn uống', icon: 'food' },
      'ăn uống': { name: 'Ăn uống', icon: 'food' },
      'transport': { name: 'Giao thông', icon: 'car' },
      'giao thông': { name: 'Giao thông', icon: 'car' },
      'shopping': { name: 'Mua sắm', icon: 'shopping' },
      'mua sắm': { name: 'Mua sắm', icon: 'shopping' },
      'entertainment': { name: 'Giải trí', icon: 'gamepad-variant' },
      'giải trí': { name: 'Giải trí', icon: 'gamepad-variant' },
      'health': { name: 'Sức khỏe', icon: 'medical-bag' },
      'sức khỏe': { name: 'Sức khỏe', icon: 'medical-bag' },
      'education': { name: 'Giáo dục', icon: 'school' },
      'giáo dục': { name: 'Giáo dục', icon: 'school' },
      'bills': { name: 'Hóa đơn', icon: 'receipt' },
      'hóa đơn': { name: 'Hóa đơn', icon: 'receipt' },
      'utilities': { name: 'Tiện ích', icon: 'flash' },
      'tiện ích': { name: 'Tiện ích', icon: 'flash' },
      'rent': { name: 'Nhà ở', icon: 'home' },
      'nhà ở': { name: 'Nhà ở', icon: 'home' },
      'insurance': { name: 'Bảo hiểm', icon: 'shield-check' },
      'bảo hiểm': { name: 'Bảo hiểm', icon: 'shield-check' },
      'loan': { name: 'Vay nợ', icon: 'cash-refund' },
      'vay nợ': { name: 'Vay nợ', icon: 'cash-refund' },
      'savings': { name: 'Tiết kiệm', icon: 'piggy-bank' },
      'tiết kiệm': { name: 'Tiết kiệm', icon: 'piggy-bank' },
      'investment': { name: 'Đầu tư', icon: 'chart-line' },
      'đầu tư': { name: 'Đầu tư', icon: 'chart-line' },
      'gift': { name: 'Quà tặng', icon: 'gift' },
      'quà tặng': { name: 'Quà tặng', icon: 'gift' },
      'charity': { name: 'Từ thiện', icon: 'hand-heart' },
      'từ thiện': { name: 'Từ thiện', icon: 'hand-heart' },
      'personal': { name: 'Cá nhân', icon: 'account' },
      'cá nhân': { name: 'Cá nhân', icon: 'account' },
      'family': { name: 'Gia đình', icon: 'home-heart' },
      'gia đình': { name: 'Gia đình', icon: 'home-heart' },
      'other': { name: 'Khác', icon: 'dots-horizontal' },
      'khác': { name: 'Khác', icon: 'dots-horizontal' },
    };

    return categoryMap[normalizedId] || { name: categoryId || 'Khác', icon: 'help-circle' };
  }

  /**
   * Export admin report
   */
  async exportAdminReport(familyId: string): Promise<string> {
    try {
      const data = await this.getDashboardData(familyId);
      
      const report = {
        exportDate: new Date().toISOString(),
        familyId,
        stats: data.stats,
        members: data.members,
        categories: data.categories,
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('❌ [FamilyAdminService] Error exporting report:', error);
      throw error;
    }
  }
}

export default new FamilyAdminService();
