/**
 * inviteStore.ts
 * Zustand store for invite state management
 * Handles current invite code, pending invites, and sharing state
 */

import { create } from 'zustand';
import InviteApi from '../api/inviteApi';

interface InviteState {
  // Current invite code for active family
  currentInviteCode: string;
  
  // Family name for context
  familyName: string;
  
  // Family ID for operations
  familyId: string;
  
  // Loading state
  isLoading: boolean;
  
  // Error message
  error: string | null;
  
  // Actions
  setCurrentInviteCode: (code: string) => void;
  setFamilyInfo: (familyId: string, familyName: string) => void;
  
  // Rotate invite code
  rotateInviteCode: (familyId: string) => Promise<string | null>;
  
  // Share actions
  shareViaWhatsApp: (message: string) => Promise<boolean>;
  shareViaMessenger: (link: string, message: string) => Promise<boolean>;
  shareViaZalo: (message: string) => Promise<boolean>;
  shareViaSMS: (message: string) => Promise<boolean>;
  shareViaEmail: (familyName: string, message: string) => Promise<boolean>;
  shareViaTikTok: (message: string) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  
  // Build invite link
  buildInviteLink: (code: string) => { webLink: string; deepLink: string };
  
  // Parse invite code from URL
  parseInviteCodeFromURL: (url: string) => Promise<string | null>;

  // Pending invite code saved when user isn't logged in yet
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;

  // Parse invite code from clipboard
  parseInviteCodeFromClipboard: () => Promise<string | null>;

  // Clear error
  clearError: () => void;
}

export const useInviteStore = create<InviteState>((set, _get) => ({
  currentInviteCode: '',
  familyName: '',
  familyId: '',
  isLoading: false,
  error: null,

  setCurrentInviteCode: (code: string) => {
    set({ currentInviteCode: code });
  },

  setFamilyInfo: (familyId: string, familyName: string) => {
    set({ familyId, familyName });
  },

  rotateInviteCode: async (familyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.rotateInviteCode(familyId);
      if (response.success && response.code) {
        set({ currentInviteCode: response.code, isLoading: false });
        return response.code;
      } else {
        set({ error: response.error || 'Lỗi tạo mã mời mới', isLoading: false });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message || 'Lỗi tạo mã mời mới', isLoading: false });
      return null;
    }
  },

  shareViaWhatsApp: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaWhatsApp(message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },

  shareViaMessenger: async (link: string, message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaMessenger(link, message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },

  shareViaZalo: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaZalo(message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },

  shareViaSMS: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaSMS(message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },

  shareViaEmail: async (familyName: string, message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaEmail(familyName, message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },

  shareViaTikTok: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.shareViaTikTok(message);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi chia sẻ' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi chia sẻ', isLoading: false });
      return false;
    }
  },



  copyToClipboard: async (text: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await InviteApi.copyToClipboard(text);
      set({ isLoading: false });
      if (!response.success) {
        set({ error: response.error || 'Lỗi sao chép' });
      }
      return response.success;
    } catch (error: any) {
      set({ error: error.message || 'Lỗi sao chép', isLoading: false });
      return false;
    }
  },

  buildInviteLink: (code: string) => {
    return {
      webLink: `https://assist-app.com/join/${code}`,
      deepLink: `assist-app://join/${code}`,
    };
  },

  parseInviteCodeFromURL: async (url: string) => {
    try {
      const response = await InviteApi.parseInviteCodeFromURL(url);
      if (response.success && response.code) {
        return response.code;
      }
      return null;
    } catch (error) {
      console.error('Parse URL error:', error);
      return null;
    }
  },

  // pending invite code for deferred join
  pendingInviteCode: null,
  setPendingInviteCode: (code: string | null) => {
    set({ pendingInviteCode: code });
  },

  parseInviteCodeFromClipboard: async () => {
    try {
      const response = await InviteApi.parseInviteCodeFromClipboard();
      if (response.success && response.code) {
        return response.code;
      }
      return null;
    } catch (error) {
      console.error('Parse clipboard error:', error);
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
