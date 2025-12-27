import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface SharedBudget {
  id: string;
  familyId: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: string[];
  alert?: {
    enabled: boolean;
    threshold: number;
  };
}

export interface SharedBudgetTransaction {
  id: string;
  budgetId: string;
  familyId: string;
  amount: number;
  description: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  memberName?: string;
}

class SharedBudgetApi {
  // Create a new shared budget
  static async createSharedBudget(
    familyId: string,
    budget: Omit<SharedBudget, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; budgetId?: string; error?: string }> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const budgetRef = firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc();

      const newBudget: SharedBudget = {
        ...budget,
        id: budgetRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.uid,
      };

      await budgetRef.set(newBudget);

      return { success: true, budgetId: budgetRef.id };
    } catch (error) {
      console.error('Error creating shared budget:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get all shared budgets for a family
  static async getSharedBudgets(familyId: string): Promise<{
    success: boolean;
    budgets?: SharedBudget[];
    error?: string;
  }> {
    try {
      const snapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .orderBy('createdAt', 'desc')
        .get();

      const budgets = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        startDate: doc.data().startDate?.toDate?.() || new Date(),
        endDate: doc.data().endDate?.toDate?.() || undefined,
      })) as SharedBudget[];

      return { success: true, budgets };
    } catch (error) {
      console.error('Error fetching shared budgets:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get a single shared budget
  static async getSharedBudget(
    familyId: string,
    budgetId: string
  ): Promise<{ success: boolean; budget?: SharedBudget; error?: string }> {
    try {
      const doc = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc(budgetId)
        .get();

      if (!doc.exists) {
        return { success: false, error: 'Budget not found' };
      }

      const budget = {
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate?.() || new Date(),
        startDate: doc.data()?.startDate?.toDate?.() || new Date(),
        endDate: doc.data()?.endDate?.toDate?.() || undefined,
      } as SharedBudget;

      return { success: true, budget };
    } catch (error) {
      console.error('Error fetching shared budget:', error);
      return { success: false, error: String(error) };
    }
  }

  // Update a shared budget
  static async updateSharedBudget(
    familyId: string,
    budgetId: string,
    updates: Partial<Omit<SharedBudget, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc(budgetId)
        .update({
          ...updates,
          updatedAt: new Date(),
        });

      return { success: true };
    } catch (error) {
      console.error('Error updating shared budget:', error);
      return { success: false, error: String(error) };
    }
  }

  // Delete a shared budget
  static async deleteSharedBudget(
    familyId: string,
    budgetId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc(budgetId)
        .delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting shared budget:', error);
      return { success: false, error: String(error) };
    }
  }

  // Add spending to a budget
  static async addBudgetSpending(
    familyId: string,
    budgetId: string,
    amount: number,
    description: string,
    category: string,
    memberName?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current budget
      const budgetResponse = await this.getSharedBudget(familyId, budgetId);
      if (!budgetResponse.success || !budgetResponse.budget) {
        return { success: false, error: 'Budget not found' };
      }

      const budget = budgetResponse.budget;
      const newSpent = budget.spent + amount;

      // Update budget spent amount
      await this.updateSharedBudget(familyId, budgetId, {
        spent: newSpent,
      });

      // Create transaction record
      const txRef = firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc(budgetId)
        .collection('transactions')
        .doc();

      const transaction: SharedBudgetTransaction = {
        id: txRef.id,
        budgetId,
        familyId,
        amount,
        description,
        category,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        memberName,
      };

      await txRef.set(transaction);

      return { success: true, transactionId: txRef.id };
    } catch (error) {
      console.error('Error adding budget spending:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get budget transactions
  static async getBudgetTransactions(
    familyId: string,
    budgetId: string
  ): Promise<{ success: boolean; transactions?: SharedBudgetTransaction[]; error?: string }> {
    try {
      const snapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedBudgets')
        .doc(budgetId)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .get();

      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as SharedBudgetTransaction[];

      return { success: true, transactions };
    } catch (error) {
      console.error('Error fetching budget transactions:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get budget summary
  static async getBudgetSummary(familyId: string): Promise<{
    success: boolean;
    summary?: {
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      percentageUsed: number;
      budgetCount: number;
    };
    error?: string;
  }> {
    try {
      const budgetsResponse = await this.getSharedBudgets(familyId);
      if (!budgetsResponse.success || !budgetsResponse.budgets) {
        return { success: false, error: 'Failed to fetch budgets' };
      }

      const budgets = budgetsResponse.budgets;
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      const totalRemaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        success: true,
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining,
          percentageUsed,
          budgetCount: budgets.length,
        },
      };
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      return { success: false, error: String(error) };
    }
  }
}

export default SharedBudgetApi;
