import GoalApi from '../api/goalApi';
import NotificationService from './NotificationService';

class GoalService {
  async getAllGoals() {
    try {
      console.log('📖 [GoalService] Fetching all goals...');
      const goals = await GoalApi.getAllGoals();
      return goals;
    } catch (error) {
      console.error('❌ [GoalService] getAllGoals error:', error);
      throw error;
    }
  }

  async addGoal(goalData) {
    try {
      console.log('➕ [GoalService] Adding goal:', goalData.title || '<no-title>');
      const newId = await GoalApi.addGoalToFirebase(goalData);
      // wait briefly for firebase to settle
      await new Promise(resolve => setTimeout(resolve, 400));
      const fresh = await this.getAllGoals();
      return { success: true, addedId: newId, freshData: fresh };
    } catch (error) {
      console.error('❌ [GoalService] addGoal error:', error);
      throw error;
    }
  }

  async updateGoal(goalId, updateData) {
    try {
      console.log('✏️ [GoalService] Updating goal:', goalId);
      await GoalApi.updateGoalOnFirebase(goalId, updateData);
      await new Promise(r => setTimeout(r, 400));
      const fresh = await this.getAllGoals();
      return { success: true, updatedId: goalId, freshData: fresh };
    } catch (error) {
      console.error('❌ [GoalService] updateGoal error:', error);
      throw error;
    }
  }

  async deleteGoal(goalId) {
    try {
      console.log('🗑️ [GoalService] Deleting goal:', goalId);
      await GoalApi.deleteGoalFromFirebase(goalId);
      await new Promise(r => setTimeout(r, 400));
      const fresh = await this.getAllGoals();
      return { success: true, deletedId: goalId, freshData: fresh };
    } catch (error) {
      console.error('❌ [GoalService] deleteGoal error:', error);
      throw error;
    }
  }

  async addMoneyToGoal(goalId, transaction) {
    try {
      console.log('💳 [GoalService] addMoneyToGoal:', goalId, transaction.amount);
      // Read the goal before updating so we can compute progress delta
      const allBefore = await this.getAllGoals();
      const beforeGoal = (allBefore || []).find(g => g.id === goalId) || null;
      const beforeAmount = beforeGoal?.currentAmount || 0;

      await GoalApi.addTransactionToGoal(goalId, transaction);
      // small delay to allow server-side timestamps
      await new Promise(r => setTimeout(r, 400));
      const fresh = await this.getAllGoals();
      // Find updated goal to check milestones
      const updatedGoal = (fresh || []).find(g => g.id === goalId) || null;
      const afterAmount = updatedGoal?.currentAmount || 0;
      const target = updatedGoal?.targetAmount || 0;

      // compute percentage progress before and after
      const beforePct = target > 0 ? Math.floor((beforeAmount / target) * 100) : 0;
      const afterPct = target > 0 ? Math.floor((afterAmount / target) * 100) : 0;

      // milestone thresholds
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (beforePct < m && afterPct >= m) {
          try {
            await NotificationService.displayNotification({
              id: `goal-${goalId}-milestone-${m}`,
              title: 'Chúc mừng!',
              body: `Chúc mừng! Mục tiêu "${updatedGoal?.title || 'Mục tiêu'}" đã đạt ${m}% tiến độ. Tiếp tục giữ vững! 🎉`,
            });
            console.log('GoalService: sent milestone notification', goalId, m);
          } catch (e) {
            console.warn('GoalService: failed sending milestone notification', e);
          }
        }
      }
      return { success: true, freshData: fresh };
    } catch (error) {
      console.error('❌ [GoalService] addMoneyToGoal error:', error);
      throw error;
    }
  }
}

export default new GoalService();
