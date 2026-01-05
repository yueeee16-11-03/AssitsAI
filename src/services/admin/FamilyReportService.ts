/**
 * FamilyReportService.ts
 * Service để quản lý báo cáo tài chính gia đình
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  savingRate: number;
  transactionCount: number;
  averageDaily: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  type: 'income' | 'expense';
  total: number;
  count: number;
  percentage: number;
  icon: string;
  color: string;
}

export interface MemberReport {
  userId: string;
  userName: string;
  userEmail?: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  topCategories: CategoryBreakdown[];
}

export interface TrendData {
  month: string;
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  savingRate: number;
}

export interface ReportSummary {
  id: string;
  title: string;
  icon: string;
  color: string;
  date: string;
  description: string;
  type: 'monthly' | 'trend' | 'category' | 'member' | 'goal';
}

class FamilyReportService {
  /**
   * Lấy thống kê tháng cho gia đình
   */
  async getMonthlyStats(
    familyId: string,
    month: number,
    year: number
  ): Promise<MonthlyStats> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Lấy thông tin family
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data();
      const memberIds = familyData?.memberIds || [];
      const ownerId = familyData?.ownerId;

      // Kiểm tra membership
      const isMember = ownerId === currentUser.uid || memberIds.includes(currentUser.uid);
      if (!isMember) {
        throw new Error('Bạn không phải thành viên của gia đình này');
      }

      // Tạo danh sách tất cả member IDs
      const allMemberIds = [ownerId, ...memberIds].filter(
        (id, index, self) => id && self.indexOf(id) === index
      );

      // Tính start và end date của tháng
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      let totalIncome = 0;
      let totalExpense = 0;
      let transactionCount = 0;

      // Lấy transactions của tất cả members trong tháng
      const transactionPromises = allMemberIds.map(async (userId) => {
        try {
          const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

          return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              type: data.type || 'expense',
              amount: data.amount || 0,
            };
          });
        } catch (error) {
          console.error(`Error fetching transactions for user ${userId}:`, error);
          return [];
        }
      });

      const allTransactionsArrays = await Promise.all(transactionPromises);
      const allTransactions = allTransactionsArrays.flat();

      // Tính toán
      allTransactions.forEach((tx) => {
        transactionCount++;
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
        }
      });

      const totalSaving = totalIncome - totalExpense;
      const savingRate = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0;
      const daysInMonth = new Date(year, month, 0).getDate();
      const averageDaily = totalExpense / daysInMonth;

      return {
        totalIncome,
        totalExpense,
        totalSaving,
        savingRate: Math.round(savingRate * 10) / 10,
        transactionCount,
        averageDaily: Math.round(averageDaily),
      };
    } catch (error) {
      console.error('❌ [FamilyReportService] Error getting monthly stats:', error);
      throw error;
    }
  }

  /**
   * Phân tích xu hướng chi tiêu qua nhiều tháng
   */
  async getTrendAnalysis(
    familyId: string,
    monthCount: number = 3
  ): Promise<TrendData[]> {
    try {
      const now = new Date();
      const trends: TrendData[] = [];

      for (let i = monthCount - 1; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = targetDate.getMonth() + 1;
        const year = targetDate.getFullYear();

        const stats = await this.getMonthlyStats(familyId, month, year);

        trends.push({
          month: `T${month}`,
          monthYear: `${month}/${year}`,
          totalIncome: stats.totalIncome,
          totalExpense: stats.totalExpense,
          savingRate: stats.savingRate,
        });
      }

      return trends;
    } catch (error) {
      console.error('❌ [FamilyReportService] Error getting trend analysis:', error);
      throw error;
    }
  }

  /**
   * Phân tích chi tiêu theo danh mục
   */
  async getCategoryBreakdown(
    familyId: string,
    month: number,
    year: number
  ): Promise<CategoryBreakdown[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) throw new Error('Family not found');

      const familyData = familyDoc.data();
      const memberIds = familyData?.memberIds || [];
      const ownerId = familyData?.ownerId;
      const allMemberIds = [ownerId, ...memberIds].filter(
        (id, index, self) => id && self.indexOf(id) === index
      );

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Map để lưu categories
      const categoryMap = new Map<
        string,
        { type: 'income' | 'expense'; total: number; count: number }
      >();
      let totalAmount = 0;

      // Lấy transactions
      const transactionPromises = allMemberIds.map(async (userId) => {
        try {
          const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

          return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              category: data.category || 'Khác',
              type: (data.type || 'expense') as 'income' | 'expense',
              amount: data.amount || 0,
            };
          });
        } catch {
          return [];
        }
      });

      const allTransactionsArrays = await Promise.all(transactionPromises);
      const allTransactions = allTransactionsArrays.flat();

      // Xử lý categories
      allTransactions.forEach((tx) => {
        const cleanCategory = this.extractCategoryName(tx.category);
        const key = `${cleanCategory}-${tx.type}`;

        if (categoryMap.has(key)) {
          const existing = categoryMap.get(key)!;
          existing.total += tx.amount;
          existing.count += 1;
        } else {
          categoryMap.set(key, {
            type: tx.type,
            total: tx.amount,
            count: 1,
          });
        }

        if (tx.type === 'expense') {
          totalAmount += tx.amount;
        }
      });

      // Chuyển đổi thành array và tính percentage
      const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
        ([key, data]) => {
          const categoryName = key.split('-')[0];
          return {
            categoryName,
            type: data.type,
            total: data.total,
            count: data.count,
            percentage:
              data.type === 'expense' && totalAmount > 0
                ? Math.round((data.total / totalAmount) * 100 * 10) / 10
                : 0,
            icon: this.getCategoryIcon(categoryName),
            color: this.getCategoryColor(categoryName, data.type),
          };
        }
      );

      // Sort theo total giảm dần
      breakdown.sort((a, b) => b.total - a.total);

      return breakdown;
    } catch (error) {
      console.error('❌ [FamilyReportService] Error getting category breakdown:', error);
      throw error;
    }
  }

  /**
   * Báo cáo chi tiêu theo từng thành viên
   */
  async getMemberReports(
    familyId: string,
    month: number,
    year: number
  ): Promise<MemberReport[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) throw new Error('Family not found');

      const familyData = familyDoc.data();
      const memberIds = familyData?.memberIds || [];
      const ownerId = familyData?.ownerId;
      const familyMembers = familyData?.members || {};

      const allMemberIds = [ownerId, ...memberIds].filter(
        (id, index, self) => id && self.indexOf(id) === index
      );

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const memberReports: MemberReport[] = [];

      for (const userId of allMemberIds) {
        try {
          const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

          let totalIncome = 0;
          let totalExpense = 0;
          const categoryMap = new Map<string, { total: number; count: number }>();

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const amount = data.amount || 0;
            const type = data.type || 'expense';
            const category = this.extractCategoryName(data.category || 'Khác');

            if (type === 'income') {
              totalIncome += amount;
            } else {
              totalExpense += amount;
              // Track expense categories
              if (categoryMap.has(category)) {
                const existing = categoryMap.get(category)!;
                existing.total += amount;
                existing.count += 1;
              } else {
                categoryMap.set(category, { total: amount, count: 1 });
              }
            }
          });

          // Top 3 expense categories
          const topCategories: CategoryBreakdown[] = Array.from(categoryMap.entries())
            .map(([categoryName, data]) => ({
              categoryName,
              type: 'expense' as const,
              total: data.total,
              count: data.count,
              percentage:
                totalExpense > 0
                  ? Math.round((data.total / totalExpense) * 100 * 10) / 10
                  : 0,
              icon: this.getCategoryIcon(categoryName),
              color: this.getCategoryColor(categoryName, 'expense'),
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);

          // Get user info
          let userName = 'Unknown';
          let userEmail: string | undefined;

          if (userId === currentUser.uid) {
            userName = currentUser.displayName || currentUser.email || 'Bạn';
            userEmail = currentUser.email || undefined;
          } else if (userId === ownerId) {
            const memberInfo = familyMembers[userId];
            userName = memberInfo?.displayName || 'Chủ gia đình';
            userEmail = memberInfo?.email;
          } else if (familyMembers[userId]) {
            const memberInfo = familyMembers[userId];
            userName =
              memberInfo.displayName ||
              memberInfo.email ||
              `User ${userId.substring(0, 8)}`;
            userEmail = memberInfo.email;
          }

          memberReports.push({
            userId,
            userName,
            userEmail,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            transactionCount: snapshot.size,
            topCategories,
          });
        } catch (err) {
          console.error(`Error processing member ${userId}:`, err);
        }
      }

      // Sort by total expense descending
      memberReports.sort((a, b) => b.totalExpense - a.totalExpense);

      return memberReports;
    } catch (error) {
      console.error('❌ [FamilyReportService] Error getting member reports:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách báo cáo có sẵn
   */
  async getAvailableReports(_familyId: string): Promise<ReportSummary[]> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      const reports: ReportSummary[] = [
        {
          id: 'monthly',
          title: `Báo cáo tài chính tháng ${currentMonth}`,
          icon: 'file-chart',
          color: '#FF6B6B',
          date: now.toISOString().split('T')[0],
          description: 'Tổng quan chi tiêu, thu nhập và tiết kiệm',
          type: 'monthly',
        },
        {
          id: 'trend',
          title: 'Xu hướng chi tiêu',
          icon: 'trending-down',
          color: '#4ECDC4',
          date: now.toISOString().split('T')[0],
          description: 'So sánh chi tiêu 3 tháng gần nhất',
          type: 'trend',
        },
        {
          id: 'category',
          title: 'Phân tích danh mục',
          icon: 'chart-pie',
          color: '#FFD93D',
          date: now.toISOString().split('T')[0],
          description: 'Tỷ lệ chi tiêu theo từng danh mục',
          type: 'category',
        },
        {
          id: 'member',
          title: 'Báo cáo thành viên',
          icon: 'account-multiple',
          color: '#6BCF7F',
          date: now.toISOString().split('T')[0],
          description: 'Chi tiêu và tiết kiệm của từng thành viên',
          type: 'member',
        },
      ];

      return reports;
    } catch (error) {
      console.error('❌ [FamilyReportService] Error getting available reports:', error);
      throw error;
    }
  }

  // Helper methods
  private extractCategoryName(category: string): string {
    return category
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .trim();
  }

  private getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('lương') || name.includes('salary')) return 'cash-multiple';
    if (name.includes('thưởng') || name.includes('bonus')) return 'gift';
    if (name.includes('đầu tư') || name.includes('invest')) return 'trending-up';
    if (name.includes('kinh doanh') || name.includes('business')) return 'briefcase';
    if (name.includes('ăn') || name.includes('food')) return 'silverware-fork-knife';
    if (name.includes('uống') || name.includes('drink')) return 'coffee';
    if (name.includes('xe') || name.includes('car') || name.includes('giao thông'))
      return 'car';
    if (name.includes('xăng') || name.includes('gas')) return 'gas-station';
    if (name.includes('mua') || name.includes('shop')) return 'shopping';
    if (name.includes('nhà') || name.includes('home')) return 'home';
    if (name.includes('điện') || name.includes('electric')) return 'flash';
    if (name.includes('internet') || name.includes('wifi')) return 'wifi';
    if (name.includes('sức khỏe') || name.includes('health')) return 'hospital-box';
    if (name.includes('học') || name.includes('education')) return 'book';
    if (name.includes('giải trí') || name.includes('entertainment'))
      return 'gamepad-variant';
    if (name.includes('du lịch') || name.includes('travel')) return 'airplane';
    return 'receipt';
  }

  private getCategoryColor(categoryName: string, type: 'income' | 'expense'): string {
    if (type === 'income') return '#10B981';
    const name = categoryName.toLowerCase();
    if (name.includes('ăn') || name.includes('food')) return '#FF6B6B';
    if (name.includes('xe') || name.includes('car')) return '#4ECDC4';
    if (name.includes('mua') || name.includes('shop')) return '#FFD93D';
    if (name.includes('giải trí')) return '#95E1D3';
    if (name.includes('sức khỏe')) return '#FF85C0';
    if (name.includes('học')) return '#B5EAD7';
    if (name.includes('điện')) return '#FFD6BA';
    if (name.includes('internet')) return '#C7CEEA';
    if (name.includes('nhà')) return '#E2A76F';
    return '#6366F1';
  }
}

export default new FamilyReportService();
