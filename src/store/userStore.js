import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const useUserStore = create(set => ({
  user: null,
  setUser: user => set({ user }),
}));

// Ensure we merge Firestore profile fields (phone, dateOfBirth, etc.) with the auth user
auth().onAuthStateChanged(async user => {
  if (!user) {
    useUserStore.getState().setUser(null);
    return;
  }

  try {
    const doc = await firestore().collection('users').doc(user.uid).get();
    const data = doc && (typeof doc.exists === 'function' ? (doc.exists() ? doc.data() : {}) : (doc.exists ? doc.data() : {}));
    const merged = { ...user, ...(data || {}) };
    useUserStore.getState().setUser(merged);
  } catch (err) {
    console.warn('Error loading user profile from Firestore on auth change', err);
    useUserStore.getState().setUser(user);
  }
});
