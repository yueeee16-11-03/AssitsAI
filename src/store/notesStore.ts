import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  initialize: () => Promise<void>;
  addNote: (content: string) => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearAllNotes: () => Promise<void>;
}

const NOTES_STORAGE_KEY = '@temporary_notes';

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const notes = JSON.parse(stored);
        set({ notes, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      set({ isLoading: false });
    }
  },

  addNote: async (content: string) => {
    try {
      const newNote: Note = {
        id: Date.now().toString(),
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updatedNotes = [newNote, ...get().notes];
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  },

  updateNote: async (id: string, content: string) => {
    try {
      const updatedNotes = get().notes.map(note =>
        note.id === id
          ? { ...note, content, updatedAt: Date.now() }
          : note
      );
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  },

  deleteNote: async (id: string) => {
    try {
      const updatedNotes = get().notes.filter(note => note.id !== id);
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  },

  clearAllNotes: async () => {
    try {
      await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
      set({ notes: [] });
    } catch (error) {
      console.error('Error clearing notes:', error);
    }
  },
}));
