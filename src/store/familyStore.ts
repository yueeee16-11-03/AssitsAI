/**
 * familyStore.ts
 * Zustand store for family state management
 * Handles global family data and operations
 */

import { create } from 'zustand';
import { FamilyModel } from '../services/FamilyService';
import { FamilyMember } from '../services/FamilyMemberService';
import FamilyApi from '../api/familyApi';

interface FamilyState {
  families: FamilyModel[];
  currentFamily: FamilyModel | null;
  isLoading: boolean;
  error: string | null;

  // Fetch operations
  fetchFamilies: () => Promise<FamilyModel[]>;
  fetchFamilyById: (familyId: string) => Promise<FamilyModel>;
  getCurrentFamily: (familyId: string) => FamilyModel | null;

  // Create operation
  createFamily: (
    name: string,
    description?: string,
    icon?: string
  ) => Promise<{ familyId: string; inviteCode: string }>;

  // Update operation
  updateFamily: (familyId: string, updates: Partial<FamilyModel>) => Promise<FamilyModel>;

  // Member operations
  addMemberByInviteCode: (inviteCode: string) => Promise<FamilyMember>;
  removeMember: (familyId: string, userId: string) => Promise<void>;

  // Delete operation
  deleteFamily: (familyId: string) => Promise<void>;

  // Clear state (khi xóa nhóm)
  clearFamilies: () => void;

  // Set current family
  setCurrentFamily: (family: FamilyModel | null) => void;

  // Clear error
  clearError: () => void;

  // Initialize
  initialize: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: [],
  currentFamily: null,
  isLoading: false,
  error: null,

  fetchFamilies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.fetchFamilies();
      if (response.success && response.families) {
        set({ families: response.families, isLoading: false });
        return response.families;
      } else {
        throw new Error(response.error || 'Lỗi tải gia đình');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  fetchFamilyById: async (familyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.getFamilyById(familyId);
      if (response.success && response.family) {
        set({ currentFamily: response.family, isLoading: false });
        return response.family;
      } else {
        throw new Error(response.error || 'Không tìm thấy gia đình');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  getCurrentFamily: (familyId: string) => {
    const state = get();
    return state.families.find(f => f.id === familyId) || null;
  },

  createFamily: async (name, description = '', icon = 'home-heart') => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.createFamily(name, description, icon);
      if (response.success && response.family && response.inviteCode) {
        // Add to families list
        const newFamilies = [...get().families, response.family];
        set({ families: newFamilies, currentFamily: response.family, isLoading: false });
        return {
          familyId: response.familyId!,
          inviteCode: response.inviteCode,
        };
      } else {
        throw new Error(response.error || 'Lỗi tạo gia đình');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  updateFamily: async (familyId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.updateFamily(familyId, updates);
      if (response.success && response.family) {
        // Update in families list
        const newFamilies = get().families.map(f =>
          f.id === familyId ? response.family! : f
        );
        set({
          families: newFamilies,
          currentFamily: get().currentFamily?.id === familyId ? response.family : get().currentFamily,
          isLoading: false,
        });
        return response.family;
      } else {
        throw new Error(response.error || 'Lỗi cập nhật gia đình');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  addMemberByInviteCode: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.addMemberByInviteCode(inviteCode);
      if (response.success && response.member) {
        // Refresh families
        await get().fetchFamilies();
        set({ isLoading: false });
        return response.member;
      } else {
        throw new Error(response.error || 'Lỗi thêm thành viên');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  removeMember: async (familyId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.removeMember(familyId, userId);
      if (response.success) {
        // Refresh families
        await get().fetchFamilies();
        set({ isLoading: false });
      } else {
        throw new Error(response.error || 'Lỗi xóa thành viên');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  deleteFamily: async (familyId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await FamilyApi.deleteFamily(familyId);
      if (response.success) {
        // Remove from families list
        const newFamilies = get().families.filter(f => f.id !== familyId);
        set({
          families: newFamilies,
          currentFamily: get().currentFamily?.id === familyId ? null : get().currentFamily,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Lỗi xóa gia đình');
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  setCurrentFamily: (family) => {
    set({ currentFamily: family });
  },

  clearFamilies: () => {
    set({ families: [], currentFamily: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().fetchFamilies();
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      set({ isLoading: false, error: errorMsg });
    }
  },
}));
