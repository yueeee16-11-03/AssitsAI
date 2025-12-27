/**
 * SharedWalletService.ts
 * Service layer for shared wallet operations
 * Handles Firestore CRUD operations and user activity tracking
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { CreateSharedWalletPayload, SharedWalletTransaction } from '../api/sharedWalletApi';

interface SharedWalletSettings {
  requireApprove: boolean;
  dailyLimit: number;
}

interface FirestoreSharedWallet {
  id: string;
  familyId: string;
  name: string;
  currency: string;
  balance: number;
  createdBy: string;
  settings: SharedWalletSettings;
  createdAt: any;
}

class SharedWalletService {
  /**
   * Get reference to shared wallets collection for a family
   */
  private getWalletsRef(familyId: string) {
    return firestore()
      .collection('families')
      .doc(familyId)
      .collection('sharedWallets');
  }

  /**
   * Get reference to transactions sub-collection
   */
  private getTransactionsRef(familyId: string, walletId: string) {
    return this.getWalletsRef(familyId).doc(walletId).collection('transactions');
  }

  /**
   * Create a new shared wallet
   */
  async createSharedWallet(
    familyId: string,
    payload: CreateSharedWalletPayload
  ): Promise<FirestoreSharedWallet> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    try {
      const walletsRef = this.getWalletsRef(familyId);
      
      // Get current family and check user permissions
      const familyDoc = await firestore().collection('families').doc(familyId).get();
      const familyData = familyDoc.data();
      
      // Check if user is owner
      const isOwner = familyData?.ownerId === currentUser.uid;
      
      if (!isOwner) {
        throw new Error('Chỉ chủ gia đình mới có thể tạo ví chung');
      }

      // Generate wallet ID
      const walletId = walletsRef.doc().id;

      const walletData: FirestoreSharedWallet = {
        id: walletId,
        familyId,
        name: payload.name,
        currency: payload.currency || 'VND',
        balance: 0,
        createdBy: currentUser.uid,
        settings: {
          requireApprove: payload.spendingRules?.requiresApproval || false,
          dailyLimit: payload.spendingRules?.dailyLimit || 0,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await walletsRef.doc(walletId).set(walletData);
      
      return {
        ...walletData,
        id: walletId,
      };
    } catch (error: any) {
      throw new Error(`Lỗi tạo ví chung: ${error.message}`);
    }
  }

  /**
   * Get all shared wallets for a family
   */
  async getSharedWallets(familyId: string): Promise<FirestoreSharedWallet[]> {
    try {
      const walletsRef = this.getWalletsRef(familyId);
      const snapshot = await walletsRef.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as FirestoreSharedWallet),
        id: doc.id,
      }));
    } catch (error: any) {
      throw new Error(`Lỗi tải ví chung: ${error.message}`);
    }
  }

  /**
   * Get shared wallet by ID
   */
  async getSharedWalletById(
    familyId: string,
    walletId: string
  ): Promise<FirestoreSharedWallet> {
    try {
      const walletsRef = this.getWalletsRef(familyId);
      const doc = await walletsRef.doc(walletId).get();
      
      if (!doc.exists) {
        throw new Error('Ví chung không tồn tại');
      }

      return {
        ...(doc.data() as FirestoreSharedWallet),
        id: doc.id,
      };
    } catch (error: any) {
      throw new Error(`Lỗi tải ví chung: ${error.message}`);
    }
  }

  /**
   * Update shared wallet information
   */
  async updateSharedWallet(
    familyId: string,
    walletId: string,
    updates: Partial<FirestoreSharedWallet>
  ): Promise<FirestoreSharedWallet> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    try {
      const walletsRef = this.getWalletsRef(familyId);
      const walletRef = walletsRef.doc(walletId);

      // Check if user is family owner (only owner can update)
      const familyDoc = await firestore().collection('families').doc(familyId).get();
      const familyOwner = familyDoc.data()?.ownerId;

      if (familyOwner !== currentUser.uid) {
        throw new Error('Chỉ chủ gia đình mới có thể sửa ví chung');
      }

      // Create update data with only allowed fields
      const updateData: Partial<FirestoreSharedWallet> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.settings !== undefined) updateData.settings = updates.settings;

      await walletRef.update(updateData);

      const updatedDoc = await walletRef.get();
      return {
        ...(updatedDoc.data() as FirestoreSharedWallet),
        id: updatedDoc.id,
      };
    } catch (error: any) {
      throw new Error(`Lỗi cập nhật ví chung: ${error.message}`);
    }
  }

  /**
   * Add transaction to wallet and update balance
   * Tracks which user performed the transaction
   */
  async addTransaction(
    familyId: string,
    walletId: string,
    transaction: Omit<SharedWalletTransaction, 'id' | 'createdAt'>
  ): Promise<SharedWalletTransaction> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    try {
      const walletsRef = this.getWalletsRef(familyId);
      const walletRef = walletsRef.doc(walletId);
      const transactionsRef = this.getTransactionsRef(familyId, walletId);

      // Get current wallet balance
      const walletDoc = await walletRef.get();
      const walletData = walletDoc.data();
      const currentBalance = walletData?.balance || 0;

      // Calculate new balance
      let newBalance = currentBalance;
      if (transaction.type === 'deposit') {
        newBalance = currentBalance + transaction.amount;
      } else if (transaction.type === 'withdraw') {
        newBalance = currentBalance - transaction.amount;
      } else if (transaction.type === 'transfer') {
        newBalance = currentBalance - transaction.amount;
      }

      // Validate balance doesn't go negative (for withdraw/transfer)
      if (newBalance < 0) {
        throw new Error('Số dư không đủ');
      }

      // Create transaction record with user info
      const transactionData = {
        ...transaction,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      // Add transaction to sub-collection
      const transactionRef = await transactionsRef.add(transactionData);

      // Update wallet balance
      await walletRef.update({
        balance: newBalance,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return {
        ...transactionData,
        id: transactionRef.id,
      } as SharedWalletTransaction;
    } catch (error: any) {
      throw new Error(`Lỗi thêm giao dịch: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    familyId: string,
    walletId: string,
    limit: number = 50
  ): Promise<SharedWalletTransaction[]> {
    try {
      const transactionsRef = this.getTransactionsRef(familyId, walletId);
      const snapshot = await transactionsRef
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...(doc.data() as SharedWalletTransaction),
        id: doc.id,
      }));
    } catch (error: any) {
      throw new Error(`Lỗi tải lịch sử giao dịch: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a specific user
   */
  async getUserTransactionHistory(
    familyId: string,
    walletId: string,
    userId: string,
    limit: number = 50
  ): Promise<SharedWalletTransaction[]> {
    try {
      const transactionsRef = this.getTransactionsRef(familyId, walletId);
      const snapshot = await transactionsRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...(doc.data() as SharedWalletTransaction),
        id: doc.id,
      }));
    } catch (error: any) {
      throw new Error(`Lỗi tải lịch sử giao dịch: ${error.message}`);
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(familyId: string, walletId: string): Promise<any> {
    try {
      const transactionsRef = this.getTransactionsRef(familyId, walletId);
      const allTransactions = await transactionsRef.get();

      const transactions = allTransactions.docs.map((doc) => doc.data());

      // Calculate statistics
      const totalDeposits = transactions
        .filter((t: any) => t.type === 'deposit')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalWithdrawals = transactions
        .filter((t: any) => t.type === 'withdraw')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalTransfers = transactions
        .filter((t: any) => t.type === 'transfer')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // User activity
      const userActivity: Record<string, any> = {};
      transactions.forEach((t: any) => {
        if (!userActivity[t.userId]) {
          userActivity[t.userId] = {
            userId: t.userId,
            userName: t.userName,
            transactionCount: 0,
            totalAmount: 0,
            deposits: 0,
            withdrawals: 0,
          };
        }
        userActivity[t.userId].transactionCount += 1;
        userActivity[t.userId].totalAmount += t.amount;
        
        if (t.type === 'deposit') {
          userActivity[t.userId].deposits += t.amount;
        } else if (t.type === 'withdraw' || t.type === 'transfer') {
          userActivity[t.userId].withdrawals += t.amount;
        }
      });

      return {
        totalTransactions: transactions.length,
        totalDeposits,
        totalWithdrawals,
        totalTransfers,
        userActivity: Object.values(userActivity),
      };
    } catch (error: any) {
      throw new Error(`Lỗi tải thống kê: ${error.message}`);
    }
  }

  /**
   * Delete shared wallet and all transactions
   */
  async deleteSharedWallet(familyId: string, walletId: string): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    try {
      const walletsRef = this.getWalletsRef(familyId);
      const walletRef = walletsRef.doc(walletId);

      // Check if user is wallet owner or family owner
      const walletDoc = await walletRef.get();
      const walletData = walletDoc.data();

      const familyDoc = await firestore().collection('families').doc(familyId).get();
      const familyOwner = familyDoc.data()?.ownerId;

      if (walletData?.createdBy !== currentUser.uid && familyOwner !== currentUser.uid) {
        throw new Error('Bạn không có quyền xóa ví này');
      }

      // Delete all transactions first
      const transactionsRef = this.getTransactionsRef(familyId, walletId);
      const transactions = await transactionsRef.get();
      
      const batch = firestore().batch();
      transactions.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete wallet document
      batch.delete(walletRef);

      await batch.commit();
    } catch (error: any) {
      throw new Error(`Lỗi xóa ví chung: ${error.message}`);
    }
  }
}

export default new SharedWalletService();
