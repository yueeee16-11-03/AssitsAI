/**
 * familyMemberStore.ts
 * Zustand store cho family_members (State Management)
 */

import { create } from 'zustand';
import {
  FamilyMember,
  FamilyRole,
  SpendingLimit,
  FamilyMemberStats,
} from '../services/FamilyMemberService';
import * as familyMemberApi from '../api/familyMemberApi';

// --- State Interface ---

export interface FamilyMemberState {
  // State
  members: Record<string, FamilyMember[]>; // familyId => members[]
  stats: Record<string, FamilyMemberStats>; // familyId => stats
  currentMember: FamilyMember | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Fetch operations
  fetchFamilyMembers: (familyId: string) => Promise<void>;
  fetchFamilyMember: (familyId: string, userId: string) => Promise<void>;

  // Create operations
  createMember: (
    familyId: string,
    userId: string,
    role?: FamilyRole,
    spendingLimit?: SpendingLimit,
    isChild?: boolean
  ) => Promise<void>;

  // Update operations
  updateMemberRole: (familyId: string, targetUserId: string, newRole: FamilyRole) => Promise<void>;
  updateMemberSpendingLimit: (
    familyId: string,
    targetUserId: string,
    spendingLimit: SpendingLimit | null
  ) => Promise<void>;
  updateMemberChildStatus: (familyId: string, targetUserId: string, isChild: boolean) => Promise<void>;
  transferOwnership: (familyId: string, newOwnerId: string) => Promise<void>;

  // Delete operations
  removeMember: (familyId: string, targetUserId: string) => Promise<void>;

  // Clear operations
  clearFamilyMembers: (familyId: string) => void;
}

// --- Store ---

export const useFamilyMemberStore = create<FamilyMemberState>((set) => ({
  // Initial state
  members: {},
  stats: {},
  currentMember: null,
  loading: false,
  error: null,

  // Setters
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch family members
  fetchFamilyMembers: async (familyId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('📥 [FamilyMemberStore] Starting fetchFamilyMembers for:', familyId);
      
      const members = await familyMemberApi.getFamilyMembers(familyId);
      const stats = await familyMemberApi.getFamilyMemberStats(familyId);
      
      console.log('✅ [FamilyMemberStore] Got members and stats:', {
        familyId,
        memberCount: members.length,
        members: members.map(m => ({ id: m.userId, name: m.name })),
        stats,
      });
      
      set((state) => ({
        members: { ...state.members, [familyId]: members },
        stats: { ...state.stats, [familyId]: stats },
        loading: false,
      }));
      
      console.log('✅ [FamilyMemberStore] Store updated successfully');
    } catch (error: any) {
      console.error('❌ [FamilyMemberStore] Error fetching members:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single family member
  fetchFamilyMember: async (familyId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const member = await familyMemberApi.getFamilyMember(familyId, userId);
      set({ currentMember: member, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Create member
  createMember: async (
    familyId: string,
    userId: string,
    role = 'member',
    spendingLimit,
    isChild
  ) => {
    set({ loading: true, error: null });
    try {
      const member = await familyMemberApi.createFamilyMember(
        familyId,
        userId,
        role,
        spendingLimit,
        isChild
      );
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: [...(state.members[familyId] || []), member],
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Update member role
  updateMemberRole: async (familyId: string, targetUserId: string, newRole: FamilyRole) => {
    set({ loading: true, error: null });
    try {
      await familyMemberApi.updateMemberRole(familyId, targetUserId, newRole);
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: state.members[familyId]?.map((m) =>
            m.userId === targetUserId ? { ...m, role: newRole } : m
          ),
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Update spending limit
  updateMemberSpendingLimit: async (
    familyId: string,
    targetUserId: string,
    spendingLimit: SpendingLimit | null
  ) => {
    set({ loading: true, error: null });
    try {
      await familyMemberApi.updateSpendingLimit(familyId, targetUserId, spendingLimit);
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: state.members[familyId]?.map((m) =>
            m.userId === targetUserId ? { ...m, spendingLimit: spendingLimit || undefined } : m
          ),
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Update child status
  updateMemberChildStatus: async (familyId: string, targetUserId: string, isChild: boolean) => {
    set({ loading: true, error: null });
    try {
      await familyMemberApi.setChildStatus(familyId, targetUserId, isChild);
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: state.members[familyId]?.map((m) =>
            m.userId === targetUserId ? { ...m, isChild } : m
          ),
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Transfer ownership
  transferOwnership: async (familyId: string, newOwnerId: string) => {
    set({ loading: true, error: null });
    try {
      await familyMemberApi.transferOwnership(familyId, newOwnerId);
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: state.members[familyId]?.map((m) => ({
            ...m,
            role: m.userId === newOwnerId ? 'owner' : m.role === 'owner' ? 'admin' : m.role,
          })),
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Remove member
  removeMember: async (familyId: string, targetUserId: string) => {
    set({ loading: true, error: null });
    try {
      await familyMemberApi.removeMember(familyId, targetUserId);
      set((state) => ({
        members: {
          ...state.members,
          [familyId]: state.members[familyId]?.filter((m) => m.userId !== targetUserId),
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Clear family members
  clearFamilyMembers: (familyId: string) => {
    set((state) => {
      const newMembers = { ...state.members };
      const newStats = { ...state.stats };
      delete newMembers[familyId];
      delete newStats[familyId];
      return { members: newMembers, stats: newStats };
    });
  },
}));

// --- Selectors (Use inside components) ---

// Use cached empty constants to avoid returning a new reference every render
const EMPTY_MEMBERS: FamilyMember[] = [];
const EMPTY_STATS: FamilyMemberStats | null = null;

export const useFamilyMembers = (familyId: string) =>
  useFamilyMemberStore((state) => state.members[familyId] ?? EMPTY_MEMBERS);

export const useFamilyMemberStats = (familyId: string) =>
  useFamilyMemberStore((state) => state.stats[familyId] ?? EMPTY_STATS);

export const useCurrentMember = () => useFamilyMemberStore((state) => state.currentMember);

export const useFamilyMemberLoading = () => useFamilyMemberStore((state) => state.loading);

export const useFamilyMemberError = () => useFamilyMemberStore((state) => state.error);
