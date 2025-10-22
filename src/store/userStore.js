import { create } from 'zustand';
import auth from '@react-native-firebase/auth';

export const useUserStore = create(set => ({
  user: null,
  setUser: user => set({ user }),
}));

auth().onAuthStateChanged(user => {
  useUserStore.getState().setUser(user);
});
