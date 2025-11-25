import GoalApi from '../api/goalApi';

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
      await GoalApi.addTransactionToGoal(goalId, transaction);
      // small delay to allow server-side timestamps
      await new Promise(r => setTimeout(r, 400));
      const fresh = await this.getAllGoals();
      return { success: true, freshData: fresh };
    } catch (error) {
      console.error('❌ [GoalService] addMoneyToGoal error:', error);
      throw error;
    }
  }
}

export default new GoalService();
