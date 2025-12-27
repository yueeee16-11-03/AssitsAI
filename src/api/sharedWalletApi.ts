/**
 * sharedWalletApi.ts
 * API layer for shared wallet operations
 * Handles creating, fetching, updating shared wallets
 */

export interface SpendingRules {
  requiresApproval: boolean;
  hasDailyLimit: boolean;
  dailyLimit: number;
}

export interface CreateSharedWalletPayload {
  name: string;
  currency: string;
  spendingRules: SpendingRules;
}

export interface SharedWalletTransaction {
  id?: string;
  walletId: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt?: any;
}

export interface CreateSharedWalletResponse {
  success: boolean;
  wallet?: any;
  error?: string;
}

export interface GetSharedWalletsResponse {
  success: boolean;
  wallets?: any[];
  error?: string;
}

export interface UpdateSharedWalletResponse {
  success: boolean;
  wallet?: any;
  error?: string;
}

export interface AddTransactionResponse {
  success: boolean;
  transaction?: SharedWalletTransaction;
  error?: string;
}

class SharedWalletApi {
  /**
   * Create a new shared wallet for family
   */
  static async createSharedWallet(
    familyId: string,
    payload: CreateSharedWalletPayload
  ): Promise<CreateSharedWalletResponse> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const wallet = await SharedWalletService.createSharedWallet(familyId, payload);
      return {
        success: true,
        wallet,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tạo ví chung',
      };
    }
  }

  /**
   * Get all shared wallets for a family
   */
  static async getSharedWallets(familyId: string): Promise<GetSharedWalletsResponse> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const wallets = await SharedWalletService.getSharedWallets(familyId);
      return {
        success: true,
        wallets,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tải ví chung',
      };
    }
  }

  /**
   * Get shared wallet by ID
   */
  static async getSharedWalletById(
    familyId: string,
    walletId: string
  ): Promise<CreateSharedWalletResponse> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const wallet = await SharedWalletService.getSharedWalletById(familyId, walletId);
      return {
        success: true,
        wallet,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Không tìm thấy ví chung',
      };
    }
  }

  /**
   * Update shared wallet information
   */
  static async updateSharedWallet(
    familyId: string,
    walletId: string,
    updates: Partial<CreateSharedWalletPayload>
  ): Promise<UpdateSharedWalletResponse> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const wallet = await SharedWalletService.updateSharedWallet(familyId, walletId, updates);
      return {
        success: true,
        wallet,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi cập nhật ví chung',
      };
    }
  }

  /**
   * Add transaction to shared wallet (deposit, withdraw, transfer)
   * Tracks which user performed the transaction
   */
  static async addTransaction(
    familyId: string,
    walletId: string,
    transaction: Omit<SharedWalletTransaction, 'id' | 'createdAt'>
  ): Promise<AddTransactionResponse> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const result = await SharedWalletService.addTransaction(familyId, walletId, transaction);
      return {
        success: true,
        transaction: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi thêm giao dịch',
      };
    }
  }

  /**
   * Get transaction history for a wallet
   */
  static async getTransactionHistory(
    familyId: string,
    walletId: string,
    limit: number = 50
  ): Promise<any> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const transactions = await SharedWalletService.getTransactionHistory(
        familyId,
        walletId,
        limit
      );
      return {
        success: true,
        transactions,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tải lịch sử giao dịch',
      };
    }
  }

  /**
   * Get transaction history for a specific user
   */
  static async getUserTransactionHistory(
    familyId: string,
    walletId: string,
    userId: string,
    limit: number = 50
  ): Promise<any> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const transactions = await SharedWalletService.getUserTransactionHistory(
        familyId,
        walletId,
        userId,
        limit
      );
      return {
        success: true,
        transactions,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tải lịch sử giao dịch người dùng',
      };
    }
  }

  /**
   * Delete shared wallet (owner only)
   */
  static async deleteSharedWallet(familyId: string, walletId: string): Promise<any> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      await SharedWalletService.deleteSharedWallet(familyId, walletId);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi xóa ví chung',
      };
    }
  }

  /**
   * Get wallet statistics (total transactions, member activity)
   */
  static async getWalletStats(familyId: string, walletId: string): Promise<any> {
    try {
      // @ts-ignore - Dynamic import
      const { default: SharedWalletService } = await import('../services/SharedWalletService');
      const stats = await SharedWalletService.getWalletStats(familyId, walletId);
      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tải thống kê ví',
      };
    }
  }
}

export default SharedWalletApi;
