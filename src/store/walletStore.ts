import { create } from 'zustand';
import WalletService, { WalletModel } from '../services/WalletService';

interface WalletState {
  wallets: WalletModel[];
  isLoading: boolean;
  error: string | null;

  fetchWallets: () => Promise<WalletModel[]>;
  addWallet: (payload: WalletModel) => Promise<any>;
  updateWallet: (id: string, update: Partial<WalletModel>) => Promise<any>;
  deleteWallet: (id: string) => Promise<any>;
  toggleVisibility: (id: string) => Promise<any>;
  transfer: (fromId: string, toId: string, amount: number) => Promise<any>;
  getTotalBalance: () => number;
  initialize: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  isLoading: false,
  error: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallets = await WalletService.getAllWallets();
      set({ wallets, isLoading: false });
      return wallets;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  addWallet: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await WalletService.addWallet(payload);
      set({ wallets: result.freshData, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  updateWallet: async (id, update) => {
    set({ isLoading: true, error: null });
    try {
      const result = await WalletService.updateWallet(id, update);
      set({ wallets: result.freshData, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  deleteWallet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await WalletService.deleteWallet(id);
      set({ wallets: result.freshData, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  toggleVisibility: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await WalletService.toggleVisibility(id);
      set({ wallets: result.freshData, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  transfer: async (fromId, toId, amount) => {
    set({ isLoading: true, error: null });
    try {
      const result = await WalletService.transferBetweenWallets(fromId, toId, amount);
      set({ wallets: result.freshData, isLoading: false });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || String(err) });
      throw err;
    }
  },

  getTotalBalance: () => {
    return get().wallets.reduce((s, w) => s + (w.isHidden ? 0 : (w.balance || 0)), 0);
  },

  initialize: async () => {
    if (get().isLoading) return;
    try {
      await get().fetchWallets();
    } catch (err) {
      // error already set in fetch
    }
  },
}));

export default useWalletStore;
