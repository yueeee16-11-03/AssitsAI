import { create } from 'zustand';
import GoalService from '../services/GoalService';

export const useGoalStore = create((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,

  setGoals: (goals) => set({ goals }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await GoalService.getAllGoals();
      set({ goals, isLoading: false, lastSyncTime: new Date().toISOString() });
      return goals;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  addGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await GoalService.addGoal(goalData);
      set({ goals: res.freshData, isLoading: false, lastSyncTime: new Date().toISOString() });
      return res;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  updateGoal: async (goalId, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await GoalService.updateGoal(goalId, updateData);
      set({ goals: res.freshData, isLoading: false, lastSyncTime: new Date().toISOString() });
      return res;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  deleteGoal: async (goalId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await GoalService.deleteGoal(goalId);
      set({ goals: res.freshData, isLoading: false, lastSyncTime: new Date().toISOString() });
      return res;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  addMoneyToGoal: async (goalId, transaction) => {
    set({ isLoading: true, error: null });
    try {
      const res = await GoalService.addMoneyToGoal(goalId, transaction);
      set({ goals: res.freshData, isLoading: false, lastSyncTime: new Date().toISOString() });
      return res;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  initialize: async () => {
    if (get().isLoading) return;
    try {
      await get().fetchGoals();
    } catch (e) {
      console.error('⚠️ [goalStore] initialize error:', e.message);
      set({ error: e.message });
    }
  }
}));

export default useGoalStore;
