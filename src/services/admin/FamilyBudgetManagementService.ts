/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                       FAMILY BUDGET MANAGEMENT SERVICE                     ║
 * ║                   Service quản lý ngân sách gia đình chuyên nghiệp          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * * 📌 Mục đích:
 * Service này quản lý toàn bộ logic ngân sách gia đình:
 * - Tạo/cập nhật/xóa ngân sách gia đình
 * - Phân bổ ngân sách cho các danh mục chi tiêu
 * - Theo dõi chi tiêu vs dự tính (budget vs actual)
 * - Quản lý hạn mức chi tiêu cho từng thành viên
 * - Cảnh báo vượt hạn mức (alert & notification)
 * - Báo cáo chi tiêu theo danh mục & thành viên
 * - Tính toán dự đoán (forecast) cho tháng tiếp theo
 * - Audit logs cho tất cả thay đổi ngân sách
 * * 📊 Firestore Structure:
 * - families/{familyId}/budgets/{budgetId}
 * - family_members/{memberId} (chứa spendingLimit)
 * - transactions/{transactionId}
 * - budget_alerts/{alertId}
 * - audit_logs/{logId}
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

/**
 * 💰 Ngân sách gia đình (Family Budget)
 */
export interface FamilyBudget {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  
  // Thông tin ngân sách
  allocatedAmount: number; // Số tiền dự định
  spentAmount: number; // Số tiền đã chi
  remainingAmount: number; // Số tiền còn lại
  
  // Cấu hình
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  resetDay?: number; // Ngày reset mỗi tháng (1-31)
  
  // Cảnh báo
  alertThreshold?: number; // % (ví dụ: 80% = cảnh báo khi vượt 80%)
  alertEnabled: boolean;
  alertNotifications: string[]; // userId được thông báo
  
  // Phân bổ theo thành viên
  memberAllocations?: Array<{
    userId: string;
    memberName: string;
    allocatedAmount: number;
    spentAmount: number;
  }>;
  
  // Trạng thái
  isActive: boolean;
  isLocked?: boolean; // Không thể sửa nếu đã khóa
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * 📋 Chi tiết ngân sách với thống kê
 */
export interface BudgetDetail extends FamilyBudget {
  percentageUsed: number; // %
  percentageRemaining: number; // %
  transactionCount: number;
  averageTransactionAmount: number;
  lastTransactionDate?: Date;
  daysSinceStart: number;
  projectedMonthEndSpending?: number; // Dự đoán chi tiêu cuối tháng
  status: 'safe' | 'warning' | 'critical'; // Safe: < 50%, Warning: 50-80%, Critical: > 80%
}

/**
 * 👤 Hạn mức chi tiêu thành viên
 */
export interface MemberSpendingLimit {
  userId: string;
  memberName: string;
  role: string;
  
  // Hạn mức
  monthlyLimit: number;
  currentMonthSpent: number;
  remainingAmount: number;
  
  // Cảnh báo
  alertThreshold?: number;
  alertEnabled: boolean;
  
  // Thống kê
  transactionCount: number;
  averageTransactionAmount: number;
  lastSpentDate?: Date;
  
  // Trạng thái
  isOverLimit: boolean;
  percentageUsed: number;
}

/**
 * 📊 Báo cáo ngân sách
 */
export interface BudgetReport {
  period: string; // "Dec 2025"
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentageUsed: number;
  
  // Chi tiết theo danh mục
  budgets: Array<{
    id: string;
    name: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'critical';
  }>;
  
  // Chi tiết theo thành viên
  memberSpending: Array<{
    userId: string;
    memberName: string;
    totalSpent: number;
    percentageOfTotal: number;
    topCategories: Array<{
      category: string;
      amount: number;
    }>;
  }>;
  
  // Cảnh báo
  alerts: Array<{
    type: 'member_limit' | 'budget_limit' | 'unusual_spending';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedUser?: string;
    affectedBudget?: string;
  }>;
}

/**
 * ⚙️ Cấu hình mặc định
 */
export const DEFAULT_BUDGET_CONFIG = {
  alertThreshold: 80, // %
  currency: 'VND',
  period: 'monthly' as const,
  resetDay: 1, // Ngày 1 mỗi tháng
};

// ════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ════════════════════════════════════════════════════════════════════════════

class FamilyBudgetManagementService {
  private readonly LOG_PREFIX = '💰 [FamilyBudgetManagementService]';

  // ─────────────────────────────────────────────────────────────────
  // FIRESTORE REFERENCES
  // ─────────────────────────────────────────────────────────────────

  private getFamiliesRef() {
    return firestore().collection('families');
  }

  private getBudgetsRef(familyId: string) {
    return this.getFamiliesRef().doc(familyId).collection('budgets');
  }

  private getTransactionsRef() {
    return firestore().collection('transactions');
  }

  private getFamilyMembersRef() {
    return firestore().collection('family_members');
  }

  private getAuditLogsRef() {
    return firestore().collection('audit_logs');
  }

  private getUsersRef() {
    return firestore().collection('users');
  }

  private getCurrentUser() {
    const user = auth().currentUser;
    if (!user) throw new Error('❌ Vui lòng đăng nhập');
    return user;
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGGING & UTILITIES
  // ─────────────────────────────────────────────────────────────────

  private log(message: string, data?: any) {
    console.log(`${this.LOG_PREFIX} ${message}`, data || '');
  }

  private logError(message: string, error?: any) {
    console.error(`${this.LOG_PREFIX} ❌ ${message}`, error || '');
  }

  private formatBudgetData(data: any): FamilyBudget {
    return {
      ...data,
      startDate: data.startDate?.toDate?.() ?? new Date(data.startDate),
      endDate: data.endDate?.toDate?.() ? data.endDate.toDate() : undefined,
      createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt),
    };
  }

  private calculateBudgetStatus(percentageUsed: number): 'safe' | 'warning' | 'critical' {
    if (percentageUsed < 50) return 'safe';
    if (percentageUsed < 80) return 'warning';
    return 'critical';
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // ─────────────────────────────────────────────────────────────────
  // 1. FETCH OPERATIONS - LẤY DỮ LIỆU
  // ─────────────────────────────────────────────────────────────────

  /**
   * 📖 Lấy danh sách ngân sách của gia đình
   */
  async getFamilyBudgets(
    familyId: string,
    options?: {
      includeInactive?: boolean;
      orderBy?: 'createdAt' | 'spentAmount' | 'allocatedAmount';
      orderDir?: 'asc' | 'desc';
    }
  ): Promise<BudgetDetail[]> {
    try {
      this.log(`📖 Fetching budgets for family: ${familyId}`);

      let query: any = this.getBudgetsRef(familyId);

      if (!options?.includeInactive) {
        query = query.where('isActive', '==', true);
      }

      const orderBy = options?.orderBy ?? 'createdAt';
      const orderDir = options?.orderDir ?? 'desc';
      query = query.orderBy(orderBy, orderDir);

      const snapshot = await query.get();

      // Fetch transactions để tính spent amount
      const transactions = await this.getMonthlyTransactions(familyId);
      const txByCategory = this.groupTransactionsByCategory(transactions);

      const budgets = snapshot.docs.map((doc: any) => {
        const budget = this.formatBudgetData(doc.data() as any);
        const txForBudget = txByCategory[budget.category] || [];
        const spent = txForBudget.reduce((sum, tx) => sum + tx.amount, 0);

        const percentageUsed = budget.allocatedAmount > 0
          ? (spent / budget.allocatedAmount) * 100
          : 0;

        const detail: BudgetDetail = {
          ...budget,
          spentAmount: spent,
          remainingAmount: Math.max(0, budget.allocatedAmount - spent),
          percentageUsed: Math.min(percentageUsed, 100),
          percentageRemaining: Math.max(0, 100 - percentageUsed),
          transactionCount: txForBudget.length,
          averageTransactionAmount: txForBudget.length > 0
            ? txForBudget.reduce((sum, tx) => sum + tx.amount, 0) / txForBudget.length
            : 0,
          lastTransactionDate: txForBudget.length > 0
            ? txForBudget.sort((a, b) => {
                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                return timeB - timeA;
              })[0].date
            : undefined,
          daysSinceStart: Math.floor(
            (Date.now() - new Date(budget.startDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
          status: this.calculateBudgetStatus(percentageUsed),
        };

        return detail;
      });

      this.log(`✅ Fetched ${budgets.length} budgets`);
      return budgets;
    } catch (error) {
      this.logError('Fetching budgets failed', error);
      throw error;
    }
  }

  /**
   * 💵 Lấy chi tiết ngân sách cụ thể
   */
  async getBudgetDetail(
    familyId: string,
    budgetId: string
  ): Promise<BudgetDetail> {
    try {
      this.log(`💵 Getting budget detail: ${budgetId}`);

      const doc = await this.getBudgetsRef(familyId).doc(budgetId).get();

      if (!doc.exists) {
        throw new Error('❌ Ngân sách không tồn tại');
      }

      const budget = this.formatBudgetData(doc.data() as any);

      // Tính spent amount
      const transactions = await this.getMonthlyTransactions(familyId);
      const txForBudget = transactions.filter((tx) => tx.category === budget.category);
      const spent = txForBudget.reduce((sum, tx) => sum + tx.amount, 0);

      const percentageUsed = budget.allocatedAmount > 0
        ? (spent / budget.allocatedAmount) * 100
        : 0;

      const detail: BudgetDetail = {
        ...budget,
        spentAmount: spent,
        remainingAmount: Math.max(0, budget.allocatedAmount - spent),
        percentageUsed: Math.min(percentageUsed, 100),
        percentageRemaining: Math.max(0, 100 - percentageUsed),
        transactionCount: txForBudget.length,
        averageTransactionAmount: txForBudget.length > 0
          ? spent / txForBudget.length
          : 0,
        lastTransactionDate: txForBudget.length > 0
          ? txForBudget.reduce((latest, current) => {
              const latestTime = new Date(latest.date).getTime();
              const currentTime = new Date(current.date).getTime();
              return currentTime > latestTime ? current : latest;
            }).date
          : undefined,
        daysSinceStart: Math.floor(
          (Date.now() - new Date(budget.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
        status: this.calculateBudgetStatus(percentageUsed),
      };

      this.log(`✅ Got budget detail: ${budget.name}`);
      return detail;
    } catch (error) {
      this.logError('Getting budget detail failed', error);
      throw error;
    }
  }

  /**
   * 📖 Lấy budgets cá nhân của một member trong gia đình
   * Dùng cho Family Budget Screen hiển thị budgets của từng member
   * ✅ Query từ /users/{memberId}/budgets và filter theo familyId
   */
  async getMemberPersonalBudgets(
    familyId: string,
    memberId: string,
    year?: number,
    month?: number
  ): Promise<Array<{
    id: string;
    category: string;
    budget: number;
    spent: number;
    predicted: number;
    createdAt?: any;
    updatedAt?: any;
    isActive?: boolean;
  }>> {
    try {
      const currentYear = typeof year === 'number' ? year : new Date().getFullYear();
      const currentMonth = typeof month === 'number' ? month : new Date().getMonth();

      this.log(`📋 Fetching personal budgets for member ${memberId} in family ${familyId}`);

      // 1. Lấy TẤT CẢ budgets từ /users/{memberId}/budgets
      // 📝 Note: Không filter familyId vì subcollection này đã thuộc user cụ thể
      //         Nếu muốn filter theo family thì sẽ filter trong code
      const budgetsSnapshot = await firestore()
        .collection('users')
        .doc(memberId)
        .collection('budgets')
        .get({ source: 'server' });

      console.log(`🔍 [DEBUG] Raw budgets snapshot for ${memberId}:`, {
        size: budgetsSnapshot.size,
        empty: budgetsSnapshot.empty,
        docs: budgetsSnapshot.docs.map(d => ({ id: d.id, data: d.data() }))
      });

      const budgets = budgetsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.log(`   Found ${budgets.length} budgets for member ${memberId} in family ${familyId}`);

      // 2. Lấy transactions từ /users/{memberId}/transactions
      let allTransactions: any[] = [];
      try {
        const transactionsSnapshot = await firestore()
          .collection('users')
          .doc(memberId)
          .collection('transactions')
          .orderBy('createdAt', 'desc')
          .get({ source: 'server' });

        console.log(`🔍 [DEBUG] Raw transactions snapshot for ${memberId}:`, {
          size: transactionsSnapshot.size,
          empty: transactionsSnapshot.empty,
        });

        transactionsSnapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          // ⚠️ Không filter theo familyId nữa vì có thể transactions cũ không có field này
          allTransactions.push({
            id: doc.id,
            type: data.type || 'expense',
            categoryId: (data.categoryId || '').toString(),
            category: data.category,
            amount: data.amount || 0,
            date: data.date,
            createdAt: data.createdAt,
            familyId: data.familyId, // Keep for reference
          });
        });

        this.log(`   Found ${allTransactions.length} transactions for member ${memberId}`);
      } catch (txError) {
        this.log(`   ⚠️ Could not fetch transactions for member ${memberId}:`, (txError as Error).message);
        allTransactions = [];
      }

      // Helper: Convert Firestore Timestamp to Date
      const toDate = (field: any): Date => {
        if (!field) return new Date();
        if (typeof field.toDate === 'function') return field.toDate();
        if (field instanceof Date) return field;
        return new Date(field);
      };

      // 3. Tính spent cho mỗi budget
      const budgetsWithSpending = budgets.map((budget: any): any => {
        let spent = 0;
        for (let i = 0; i < allTransactions.length; i++) {
          const t: any = allTransactions[i];
          // Match by categoryId or category name
          const categoryMatch = (t.categoryId === budget.categoryId || 
                                t.categoryId === String(budget.categoryId) ||
                                t.category === budget.category);
          if (categoryMatch && t.type === 'expense') {
            const txDate = toDate(t.date || t.createdAt);
            if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
              spent += t.amount || 0;
            }
          }
        }

        const predicted = spent; // Placeholder logic

        return {
          id: budget.id,
          category: budget.category || 'Unknown',
          // Support multiple field names: allocatedAmount, budget, amount
          budget: budget.allocatedAmount || budget.budget || budget.amount || 0,
          spent: spent || 0,
          predicted: predicted || 0,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
          isActive: budget.isActive !== undefined ? budget.isActive : true,
        };
      });

      this.log(`✅ Calculated spending for ${budgetsWithSpending.length} budgets of member ${memberId}`, {
        budgets: budgetsWithSpending.map(b => ({ id: b.id, category: b.category, budget: b.budget, spent: b.spent }))
      });
      return budgetsWithSpending;
    } catch (error) {
      this.logError(`Getting personal budgets for member ${memberId} failed`, error);
      return []; // Trả về mảng rỗng để không crash UI
    }
  }

  async getSpendingLimits(familyId: string): Promise<any[]> {
    try {
      this.log(`👥 Fetching spending limits for family: ${familyId}`);

      const members = await this.getFamilyMembersRef()
        .where('familyId', '==', familyId)
        .get();

      const transactions = await this.getMonthlyTransactions(familyId);
      const txByUser = this.groupTransactionsByUser(transactions);

      const limits = members.docs
        .filter((doc) => {
          const data = doc.data() as any;
          return data.spendingLimit; // Chỉ lấy những thành viên có hạn mức
        })
        .map((doc) => {
          const member = doc.data() as any;
          const limit = member.spendingLimit;
          const userTx = txByUser[member.userId] || [];
          const spent = userTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);

          const percentageUsed = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;

          return {
            userId: member.userId,
            memberName: member.name,
            role: member.role,
            monthlyLimit: limit.amount,
            currentMonthSpent: spent,
            remainingAmount: Math.max(0, limit.amount - spent),
            alertThreshold: limit.notificationThreshold,
            alertEnabled: true,
            transactionCount: userTx.length,
            averageTransactionAmount: userTx.length > 0 ? spent / userTx.length : 0,
            lastSpentDate: userTx.length > 0
              ? userTx.reduce((latest: any, current: any) => {
                  const latestTime = new Date(latest.date).getTime();
                  const currentTime = new Date(current.date).getTime();
                  return currentTime > latestTime ? current : latest;
                }).date
              : undefined,
            isOverLimit: spent > limit.amount,
            percentageUsed: Math.min(percentageUsed, 100),
          };
        });

      this.log(`✅ Fetched ${limits.length} member spending limits`);
      return limits;
    } catch (error) {
      this.logError('Fetching member spending limits failed', error);
      throw error;
    }
  }

  /**
   * 💳 Lấy chi tiêu budget breakdown theo từng member
   */
  async getBudgetByMember(
    familyId: string,
    budgetId: string
  ): Promise<Array<{
    userId: string;
    memberName: string;
    role: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    transactionCount: number;
    percentageUsed: number;
  }>> {
    try {
      this.log(`💳 Getting budget breakdown by member for budget: ${budgetId}`);

      const budget = await this.getBudgetDetail(familyId, budgetId);
      const transactions = await this.getMonthlyTransactions(familyId);
      
      // Lọc transactions cho budget này
      const budgetTx = transactions.filter((tx) => tx.category === budget.category);
      
      // Group transactions by user
      const txByUser = this.groupTransactionsByUser(budgetTx);

      const members = await this.getFamilyMembersRef()
        .where('familyId', '==', familyId)
        .get();

      const memberBreakdown = members.docs.map((doc) => {
        const member = doc.data() as any;
        const userTx = txByUser[member.userId] || [];
        const spent = userTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);

        // Tính allocated dựa trên member allocations nếu có
        let allocated = 0;
        if (budget.memberAllocations && budget.memberAllocations.length > 0) {
          const alloc = budget.memberAllocations.find(
            (m) => m.userId === member.userId
          );
          allocated = alloc?.allocatedAmount || 0;
        } else {
          // Chia đều cho tất cả members
          allocated = budget.allocatedAmount / members.size;
        }

        const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

        return {
          userId: member.userId,
          memberName: member.name,
          role: member.role,
          allocatedAmount: allocated,
          spentAmount: spent,
          remainingAmount: Math.max(0, allocated - spent),
          transactionCount: userTx.length,
          percentageUsed: Math.min(percentageUsed, 100),
        };
      });

      this.log(`✅ Got ${memberBreakdown.length} member breakdown`);
      return memberBreakdown;
    } catch (error) {
      this.logError('Getting budget by member failed', error);
      throw error;
    }
  }

  /**
   * 📊 Lấy chi tiêu chi tiết của một member across all budgets
   */
  async getMemberBudgetOverview(
    familyId: string,
    userId: string
  ): Promise<{
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    percentageUsed: number;
    budgetBreakdown: Array<{
      budgetId: string;
      budgetName: string;
      allocatedAmount: number;
      spentAmount: number;
      remainingAmount: number;
      percentageUsed: number;
      status: 'safe' | 'warning' | 'critical';
    }>;
  }> {
    try {
      this.log(`📊 Getting member budget overview for user: ${userId}`);

      const budgets = await this.getFamilyBudgets(familyId);
      const transactions = await this.getMonthlyTransactions(familyId);
      
      // Lọc transactions của user này
      const userTx = transactions.filter((tx) => tx.userId === userId);
      const txByCategory = this.groupTransactionsByCategory(userTx);

      let totalAllocated = 0;
      let totalSpent = 0;

      const budgetBreakdown = budgets.map((budget) => {
        const budgetTx = txByCategory[budget.category] || [];
        const spent = budgetTx.reduce((sum: number, tx: any) => sum + tx.amount, 0);

        // Tính allocated
        let allocated = 0;
        if (budget.memberAllocations && budget.memberAllocations.length > 0) {
          const alloc = budget.memberAllocations.find((m) => m.userId === userId);
          allocated = alloc?.allocatedAmount || 0;
        } else {
          allocated = 0; // User không được phân bổ
        }

        totalAllocated += allocated;
        totalSpent += spent;

        const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

        return {
          budgetId: budget.id,
          budgetName: budget.name,
          allocatedAmount: allocated,
          spentAmount: spent,
          remainingAmount: Math.max(0, allocated - spent),
          percentageUsed: Math.min(percentageUsed, 100),
          status: this.calculateBudgetStatus(percentageUsed),
        };
      });

      const percentageUsed = totalAllocated > 0
        ? (totalSpent / totalAllocated) * 100
        : 0;

      this.log(`✅ Got member budget overview`);
      return {
        totalAllocated,
        totalSpent,
        totalRemaining: Math.max(0, totalAllocated - totalSpent),
        percentageUsed: Math.min(percentageUsed, 100),
        budgetBreakdown,
      };
    } catch (error) {
      this.logError('Getting member budget overview failed', error);
      throw error;
    }
  }

  /**
   * 🎯 Allocate budget cho members (phân bổ ngân sách)
   */
  async allocateBudgetToMembers(
    familyId: string,
    budgetId: string,
    allocations: Array<{
      userId: string;
      memberName: string;
      allocatedAmount: number;
    }>
  ): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`🎯 Allocating budget to members: ${budgetId}`);

      const canManage = await this.canManageBudgets(familyId, currentUser.uid);
      if (!canManage) {
        throw new Error('❌ Bạn không có quyền phân bổ ngân sách');
      }

      await this.getBudgetsRef(familyId).doc(budgetId).update({
        memberAllocations: allocations,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      await this.logAction(
        familyId,
        currentUser.uid,
        'BUDGET_ALLOCATED',
        { budgetId, allocations }
      );

      this.log(`✅ Budget allocated to ${allocations.length} members`);
    } catch (error) {
      this.logError('Allocating budget failed', error);
      throw error;
    }
  }

  /**
   * 📊 Lấy báo cáo ngân sách chi tiết
   */
  async generateBudgetReport(familyId: string): Promise<BudgetReport> {
    try {
      this.log(`📊 Generating budget report for family: ${familyId}`);

      const budgets = await this.getFamilyBudgets(familyId);
      const members = await this.getSpendingLimits(familyId);
      const transactions = await this.getMonthlyTransactions(familyId);

      const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
      const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);

      const overallPercentageUsed = totalAllocated > 0
        ? (totalSpent / totalAllocated) * 100
        : 0;

      // Chi tiết theo danh mục
      const budgetDetails = budgets.map((b) => ({
        id: b.id,
        name: b.name,
        allocated: b.allocatedAmount,
        spent: b.spentAmount,
        remaining: b.remainingAmount,
        percentage: b.percentageUsed,
        status: b.status,
      }));

      // Chi tiết theo thành viên
      const txByUser = this.groupTransactionsByUser(transactions);
      const memberSpending = members.map((m) => {
        const userTx = txByUser[m.userId] || [];
        const txByCategory: Record<string, number> = {};

        userTx.forEach((tx: any) => {
          if (!txByCategory[tx.category]) {
            txByCategory[tx.category] = 0;
          }
          txByCategory[tx.category] += tx.amount;
        });

        const topCategories = Object.entries(txByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        return {
          userId: m.userId,
          memberName: m.memberName,
          totalSpent: m.currentMonthSpent,
          percentageOfTotal: totalSpent > 0
            ? (m.currentMonthSpent / totalSpent) * 100
            : 0,
          topCategories,
        };
      });

      // Cảnh báo
      const alerts: BudgetReport['alerts'] = [];

      // Kiểm tra member vượt hạn mức
      members.forEach((m) => {
        if (m.isOverLimit) {
          alerts.push({
            type: 'member_limit' as const,
            severity: 'high' as const,
            message: `${m.memberName} đã vượt hạn mức chi tiêu (${this.formatCurrency(m.currentMonthSpent)} / ${this.formatCurrency(m.monthlyLimit)})`,
            affectedUser: m.userId,
          });
        } else if (m.percentageUsed >= (m.alertThreshold || 80)) {
          alerts.push({
            type: 'member_limit' as const,
            severity: 'medium' as const,
            message: `${m.memberName} đã sử dụng ${m.percentageUsed.toFixed(0)}% hạn mức`,
            affectedUser: m.userId,
          });
        }
      });

      // Kiểm tra budget vượt
      budgets.forEach((b) => {
        if (b.status === 'critical') {
          alerts.push({
            type: 'budget_limit' as const,
            severity: 'high' as const,
            message: `Ngân sách "${b.name}" đã vượt (${this.formatCurrency(b.spentAmount)} / ${this.formatCurrency(b.allocatedAmount)})`,
            affectedBudget: b.id,
          });
        } else if (b.status === 'warning') {
          alerts.push({
            type: 'budget_limit' as const,
            severity: 'medium' as const,
            message: `Ngân sách "${b.name}" đang gần hết (${b.percentageUsed.toFixed(0)}%)`,
            affectedBudget: b.id,
          });
        }
      });

      const report: BudgetReport = {
        period: new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallPercentageUsed: Math.min(overallPercentageUsed, 100),
        budgets: budgetDetails,
        memberSpending,
        alerts,
      };

      this.log(`✅ Generated budget report`);
      return report;
    } catch (error) {
      this.logError('Generating budget report failed', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. CREATE OPERATIONS - TẠO NGÂN SÁCH
  // ─────────────────────────────────────────────────────────────────

  /**
   * ➕ Tạo ngân sách mới cho gia đình
   */
  async createBudget(
    familyId: string,
    budgetData: Omit<FamilyBudget, 'id' | 'createdAt' | 'updatedAt' | 'spentAmount' | 'remainingAmount'>
  ): Promise<BudgetDetail> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`➕ Creating budget for family: ${familyId}`);

      // Kiểm tra quyền
      const canManage = await this.canManageBudgets(familyId, currentUser.uid);
      if (!canManage) {
        throw new Error('❌ Bạn không có quyền tạo ngân sách');
      }

      const newBudgetRef = this.getBudgetsRef(familyId).doc();
      const budgetId = newBudgetRef.id;

      const budget: FamilyBudget = {
        ...budgetData,
        id: budgetId,
        spentAmount: 0,
        remainingAmount: budgetData.allocatedAmount,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: currentUser.uid,
      };

      const batch = firestore().batch();
      batch.set(newBudgetRef, budget);

      // Audit log
      await this.logAction(
        familyId,
        currentUser.uid,
        'BUDGET_CREATED',
        {
          budgetId,
          name: budget.name,
          allocatedAmount: budget.allocatedAmount,
        }
      );

      await batch.commit();

      this.log(`✅ Budget created: ${budget.name}`);
      return this.getBudgetDetail(familyId, budgetId);
    } catch (error) {
      this.logError('Creating budget failed', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. UPDATE OPERATIONS - CẬP NHẬT NGÂN SÁCH
  // ─────────────────────────────────────────────────────────────────

  /**
   * ✏️ Cập nhật thông tin ngân sách
   */
  async updateBudget(
    familyId: string,
    budgetId: string,
    updates: Partial<FamilyBudget>
  ): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`✏️ Updating budget: ${budgetId}`);

      // Kiểm tra quyền
      const canManage = await this.canManageBudgets(familyId, currentUser.uid);
      if (!canManage) {
        throw new Error('❌ Bạn không có quyền cập nhật ngân sách');
      }

      // Kiểm tra budget có bị khóa không
      const budgetDoc = await this.getBudgetsRef(familyId).doc(budgetId).get();
      const budget = budgetDoc.data() as any;
      if (budget?.isLocked) {
        throw new Error('❌ Ngân sách này đã được khóa');
      }

      await this.getBudgetsRef(familyId).doc(budgetId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      // Audit log
      await this.logAction(
        familyId,
        currentUser.uid,
        'BUDGET_UPDATED',
        { budgetId, updates }
      );

      this.log(`✅ Budget updated`);
    } catch (error) {
      this.logError('Updating budget failed', error);
      throw error;
    }
  }

  /**
   * 🔒 Khóa/mở khóa ngân sách
   */
  async lockBudget(
    familyId: string,
    budgetId: string,
    locked: boolean
  ): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`🔒 Locking budget: ${budgetId} = ${locked}`);

      const canManage = await this.canManageBudgets(familyId, currentUser.uid);
      if (!canManage) {
        throw new Error('❌ Bạn không có quyền khóa ngân sách');
      }

      await this.getBudgetsRef(familyId).doc(budgetId).update({
        isLocked: locked,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await this.logAction(
        familyId,
        currentUser.uid,
        locked ? 'BUDGET_LOCKED' : 'BUDGET_UNLOCKED',
        { budgetId }
      );

      this.log(`✅ Budget lock status updated`);
    } catch (error) {
      this.logError('Locking budget failed', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. DELETE OPERATIONS - XÓA NGÂN SÁCH
  // ─────────────────────────────────────────────────────────────────

  /**
   * 🗑️ Xóa ngân sách
   */
  async deleteBudget(familyId: string, budgetId: string): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`🗑️ Deleting budget: ${budgetId}`);

      const canManage = await this.canManageBudgets(familyId, currentUser.uid);
      if (!canManage) {
        throw new Error('❌ Bạn không có quyền xóa ngân sách');
      }

      const batch = firestore().batch();
      batch.delete(this.getBudgetsRef(familyId).doc(budgetId));

      await this.logAction(
        familyId,
        currentUser.uid,
        'BUDGET_DELETED',
        { budgetId }
      );

      await batch.commit();

      this.log(`✅ Budget deleted`);
    } catch (error) {
      this.logError('Deleting budget failed', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. PERMISSIONS & AUTHORIZATION
  // ─────────────────────────────────────────────────────────────────

  /**
   * 🔐 Kiểm tra user có quyền quản lý ngân sách không
   */
  private async canManageBudgets(familyId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getFamilyMembersRef()
        .doc(`${familyId}_${userId}`)
        .get();

      if (!member.exists) return false;

      const data = member.data() as any;
      return ['owner', 'admin'].includes(data.role);
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. HELPERS & UTILITIES
  // ─────────────────────────────────────────────────────────────────

  /**
   * 📅 Lấy transactions của tháng hiện tại
   */
  private async getMonthlyTransactions(familyId: string) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const snapshot = await this.getTransactionsRef()
        .where('familyId', '==', familyId)
        .where('createdAt', '>=', firestore.Timestamp.fromDate(monthStart))
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
    } catch (error) {
      this.logError('Getting monthly transactions failed', error);
      return [];
    }
  }

  /**
   * 📊 Nhóm transactions theo category
   */
  private groupTransactionsByCategory(transactions: any[]) {
    const grouped: Record<string, any[]> = {};
    transactions.forEach((tx) => {
      if (!grouped[tx.category]) {
        grouped[tx.category] = [];
      }
      grouped[tx.category].push(tx);
    });
    return grouped;
  }

  /**
   * 👥 Nhóm transactions theo user
   */
  private groupTransactionsByUser(transactions: any[]) {
    const grouped: Record<string, any[]> = {};
    transactions.forEach((tx) => {
      if (!grouped[tx.userId]) {
        grouped[tx.userId] = [];
      }
      grouped[tx.userId].push(tx);
    });
    return grouped;
  }

  /**
   * 📝 Ghi audit log
   */
  private async logAction(
    familyId: string,
    actorId: string,
    action: string,
    details?: any
  ): Promise<void> {
    try {
      const logRef = this.getAuditLogsRef().doc();
      await logRef.set({
        id: logRef.id,
        familyId,
        actorId,
        action,
        details: details || {},
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      this.logError('Logging action failed', error);
      // Không throw để không ảnh hưởng main operation
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. PERSONAL BUDGET MANAGEMENT (THÊM/SỬA/XÓA NGÂN SÁCH CÁ NHÂN)
  // ─────────────────────────────────────────────────────────────────

  /**
   * ➕ Tạo ngân sách cá nhân mới cho member
   * @param familyId - ID gia đình
   * @param memberId - ID thành viên
   * @param budgetData - Dữ liệu ngân sách
   */
  async createMemberPersonalBudget(
    familyId: string,
    memberId: string,
    budgetData: {
      category: string;
      allocatedAmount: number;
      period: 'weekly' | 'monthly' | 'yearly';
      currency?: string;
    }
  ): Promise<{
    id: string;
    category: string;
    budget: number;
    spent: number;
    predicted: number;
  }> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`➕ Creating personal budget for member ${memberId} in family ${familyId}`);

      // Kiểm tra quyền: Chỉ owner/admin hoặc chính user đó mới được tạo
      const canCreate = await this.canManagePersonalBudget(familyId, currentUser.uid, memberId);
      if (!canCreate) {
        throw new Error('❌ Bạn không có quyền tạo ngân sách cho thành viên này');
      }

      // Tạo budget document
      const budgetRef = this.getUsersRef()
        .doc(memberId)
        .collection('budgets')
        .doc();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const newBudget = {
        id: budgetRef.id,
        familyId: familyId,
        category: budgetData.category,
        allocatedAmount: budgetData.allocatedAmount,
        budget: budgetData.allocatedAmount, // Alias
        spent: 0,
        predicted: 0,
        period: budgetData.period,
        currency: budgetData.currency || 'VND',
        year: currentYear,
        month: currentMonth,
        isActive: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.uid,
      };

      await budgetRef.set(newBudget);

      console.log(`✅ [SERVICE] Budget created successfully:`, {
        budgetId: budgetRef.id,
        memberId,
        familyId,
        category: budgetData.category,
        amount: budgetData.allocatedAmount,
        path: `/users/${memberId}/budgets/${budgetRef.id}`
      });

      // Log action
      await this.logAction(
        familyId,
        currentUser.uid,
        'PERSONAL_BUDGET_CREATED',
        {
          memberId,
          budgetId: budgetRef.id,
          category: budgetData.category,
          amount: budgetData.allocatedAmount,
        }
      );

      this.log(`✅ Personal budget created for member ${memberId}: ${budgetData.category}`);

      return {
        id: budgetRef.id,
        category: budgetData.category,
        budget: budgetData.allocatedAmount,
        spent: 0,
        predicted: 0,
      };
    } catch (error) {
      this.logError('Creating personal budget failed', error);
      throw error;
    }
  }

  /**
   * ✏️ Cập nhật ngân sách cá nhân của member
   * @param familyId - ID gia đình
   * @param memberId - ID thành viên
   * @param budgetId - ID ngân sách cần update
   * @param updates - Dữ liệu cập nhật
   */
  async updateMemberPersonalBudget(
    familyId: string,
    memberId: string,
    budgetId: string,
    updates: {
      category?: string;
      allocatedAmount?: number;
      period?: 'weekly' | 'monthly' | 'yearly';
    }
  ): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`✏️ Updating personal budget ${budgetId} for member ${memberId}`);

      // Kiểm tra quyền
      const canUpdate = await this.canManagePersonalBudget(familyId, currentUser.uid, memberId);
      if (!canUpdate) {
        throw new Error('❌ Bạn không có quyền cập nhật ngân sách này');
      }

      // Kiểm tra budget có tồn tại không
      const budgetRef = this.getUsersRef()
        .doc(memberId)
        .collection('budgets')
        .doc(budgetId);

      const budgetDoc = await budgetRef.get();
      if (!budgetDoc.exists) {
        throw new Error('❌ Ngân sách không tồn tại');
      }

      const budgetData = budgetDoc.data();
      if (budgetData?.familyId !== familyId) {
        throw new Error('❌ Ngân sách không thuộc gia đình này');
      }

      // Chuẩn bị updates
      const updateData: any = {
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.uid,
      };

      if (updates.category !== undefined) {
        updateData.category = updates.category;
      }

      if (updates.allocatedAmount !== undefined) {
        updateData.allocatedAmount = updates.allocatedAmount;
        updateData.budget = updates.allocatedAmount; // Alias
      }

      if (updates.period !== undefined) {
        updateData.period = updates.period;
      }

      await budgetRef.update(updateData);

      // Log action
      await this.logAction(
        familyId,
        currentUser.uid,
        'PERSONAL_BUDGET_UPDATED',
        {
          memberId,
          budgetId,
          updates,
        }
      );

      this.log(`✅ Personal budget updated: ${budgetId}`);
    } catch (error) {
      this.logError('Updating personal budget failed', error);
      throw error;
    }
  }

  /**
   * 🗑️ Xóa ngân sách cá nhân của member
   * @param familyId - ID gia đình
   * @param memberId - ID thành viên
   * @param budgetId - ID ngân sách cần xóa
   */
  async deleteMemberPersonalBudget(
    familyId: string,
    memberId: string,
    budgetId: string
  ): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      this.log(`🗑️ Deleting personal budget ${budgetId} for member ${memberId}`);

      console.log('🔍 [DELETE DEBUG] Delete info:', {
        familyId,
        memberId,
        budgetId,
        currentUserId: currentUser.uid,
        path: `/users/${memberId}/budgets/${budgetId}`,
        isSameUser: currentUser.uid === memberId
      });

      // Kiểm tra quyền
      const canDelete = await this.canManagePersonalBudget(familyId, currentUser.uid, memberId);
      console.log('🔍 [DELETE DEBUG] Permission check:', { canDelete });
      
      if (!canDelete) {
        throw new Error('❌ Bạn không có quyền xóa ngân sách này');
      }

      // Kiểm tra budget có tồn tại không
      const budgetRef = this.getUsersRef()
        .doc(memberId)
        .collection('budgets')
        .doc(budgetId);

      console.log('🔍 [DELETE DEBUG] Budget ref path:', budgetRef.path);
      console.log('🔍 [DELETE DEBUG] Fetching budget document...');
      
      // Thử đọc document trước để xem có quyền read không
      let budgetDoc;
      try {
        budgetDoc = await budgetRef.get();
        console.log('✅ [DELETE DEBUG] Budget document fetched successfully');
      } catch (readError: any) {
        console.error('❌ [DELETE DEBUG] Failed to read budget:', {
          code: readError.code,
          message: readError.message
        });
        throw readError;
      }
      
      if (!budgetDoc.exists) {
        console.log('❌ [DELETE DEBUG] Budget not found');
        throw new Error('❌ Ngân sách không tồn tại');
      }

      const budgetData = budgetDoc.data();
      console.log('🔍 [DELETE DEBUG] Budget data:', {
        exists: budgetDoc.exists,
        familyId: budgetData?.familyId,
        category: budgetData?.category,
        budgetOwnerId: memberId,
        currentUserId: currentUser.uid
      });

      if (budgetData?.familyId !== familyId) {
        console.log('❌ [DELETE DEBUG] Budget does not belong to this family');
        throw new Error('❌ Ngân sách không thuộc gia đình này');
      }

      // Kiểm tra quyền family owner
      const familyDoc = await firestore().collection('families').doc(familyId).get();
      const familyData = familyDoc.data();
      const isFamilyOwner = familyData?.ownerId === currentUser.uid;
      
      console.log('🔍 [DELETE DEBUG] Family ownership check:', {
        familyOwnerId: familyData?.ownerId,
        currentUserId: currentUser.uid,
        isFamilyOwner,
        canDeleteByOwnership: currentUser.uid === memberId || isFamilyOwner
      });

      // Xóa budget
      console.log('🔍 [DELETE DEBUG] Attempting to delete with:', {
        method: 'budgetRef.delete()',
        expectedFirestoreRuleMatch: currentUser.uid === memberId ? 'isUser(userId)' : 'isFamilyOwner(...)'
      });
      
      try {
        await budgetRef.delete();
        console.log('✅ [DELETE DEBUG] Budget deleted successfully');
      } catch (deleteError: any) {
        console.error('❌ [DELETE DEBUG] Delete operation failed:', {
          code: deleteError.code,
          message: deleteError.message,
          fullError: deleteError
        });
        throw deleteError;
      }

      // Log action
      await this.logAction(
        familyId,
        currentUser.uid,
        'PERSONAL_BUDGET_DELETED',
        {
          memberId,
          budgetId,
          category: budgetData?.category,
        }
      );

      this.log(`✅ Personal budget deleted: ${budgetId}`);
    } catch (error: any) {
      console.error('❌ [DELETE DEBUG] Delete failed:', {
        errorCode: error.code,
        errorMessage: error.message,
        fullError: error
      });
      
      // Provide better error messages
      if (error.code === 'permission-denied') {
        this.logError('Deleting personal budget failed - Permission Denied', error);
        throw new Error('❌ Lỗi quyền truy cập: Vui lòng kiểm tra Firebase Rules đã được deploy chưa. Bạn cần có quyền owner hoặc là chính user đó để xóa ngân sách này.');
      }
      
      this.logError('Deleting personal budget failed', error);
      throw error;
    }
  }

  /**
   * 🔐 Kiểm tra user có quyền quản lý personal budget của member không
   * - Owner/Admin của family có thể quản lý tất cả
   * - Member chỉ có thể quản lý budget của chính mình
   */
  private async canManagePersonalBudget(
    familyId: string,
    userId: string,
    targetMemberId: string
  ): Promise<boolean> {
    try {
      // Nếu là chính user đó thì được phép
      if (userId === targetMemberId) {
        return true;
      }

      // Kiểm tra role trong family
      const memberDoc = await this.getFamilyMembersRef()
        .doc(`${familyId}_${userId}`)
        .get();

      if (!memberDoc.exists) {
        return false;
      }

      const memberData = memberDoc.data() as any;
      return ['owner', 'admin'].includes(memberData.role);
    } catch (error) {
      this.logError('Checking personal budget permission failed', error);
      return false;
    }
  }
}

export default new FamilyBudgetManagementService();