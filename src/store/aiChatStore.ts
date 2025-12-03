import { create } from 'zustand';
import ChatHistoryService from '../services/ChatHistoryService';
import ChatService from '../services/ChatService';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messageCount: number;
}

interface AIChatStore {
  // State
  messages: Message[];
  inputText: string;
  isTyping: boolean;
  isRecording: boolean;
  showMenu: boolean;
  chatHistory: ChatHistoryItem[];
  showHistory: boolean;
  unsubscribeRef: (() => void) | null;

  // Message actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  resetMessages: () => void;

  // Input actions
  setInputText: (text: string) => void;
  clearInputText: () => void;

  // Typing actions
  setIsTyping: (isTyping: boolean) => void;

  // Recording actions
  setIsRecording: (isRecording: boolean) => void;

  // Menu actions
  setShowMenu: (show: boolean) => void;

  // History actions
  setShowHistory: (show: boolean) => void;
  setChatHistory: (history: ChatHistoryItem[]) => void;
  setUnsubscribeRef: (unsubscribe: (() => void) | null) => void;

  // Firebase operations
  loadChatHistoryFromFirebase: () => Promise<void>;
  saveChatToFirebase: () => Promise<boolean>;
  loadChatDetail: (chatId: string) => Promise<boolean>;
  deleteChatFromFirebase: (chatId: string) => Promise<boolean>;
}

export const useAIChatStore = create<AIChatStore>((set, get) => ({
  // Initial state
  messages: [ChatService.getInitialMessage()],
  inputText: '',
  isTyping: false,
  isRecording: false,
  showMenu: false,
  chatHistory: [],
  showHistory: false,
  unsubscribeRef: null,

  // Message actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  resetMessages: () => set({ messages: [ChatService.getInitialMessage()] }),

  // Input actions
  setInputText: (text) => set({ inputText: text }),
  clearInputText: () => set({ inputText: '' }),

  // Typing actions
  setIsTyping: (isTyping) => set({ isTyping }),

  // Recording actions
  setIsRecording: (isRecording) => set({ isRecording }),

  // Menu actions
  setShowMenu: (show) => set({ showMenu: show }),

  // History actions
  setShowHistory: (show) => set({ showHistory: show }),
  setChatHistory: (history) => set({ chatHistory: history }),
  setUnsubscribeRef: (unsubscribe) => set({ unsubscribeRef: unsubscribe }),

  // Load chat history from Firebase with real-time subscription
  loadChatHistoryFromFirebase: async () => {
    try {
      const state = get();
      
      console.log('[AIChatStore] Starting to load chat history from Firebase');
      
      // Unsubscribe from previous subscription if exists
      if (state.unsubscribeRef) {
        console.log('[AIChatStore] Unsubscribing from previous subscription');
        state.unsubscribeRef();
      }

      // Subscribe to real-time updates
      const unsubscribe = ChatHistoryService.subscribeToHistories((histories) => {
        console.log('[AIChatStore] Chat history updated:', histories.length, 'items');
        set({ chatHistory: histories });
      });

      set({ unsubscribeRef: unsubscribe });
      console.log('[AIChatStore] Subscription set up successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[AIChatStore] Error loading chat history:', errorMsg);
      throw error;
    }
  },

  // Save current chat to Firebase
  saveChatToFirebase: async () => {
    try {
      const state = get();
      const { messages } = state;

      // Don't save if only initial message
      if (messages.length <= 1) {
        console.log('[AIChatStore] No messages to save');
        return false;
      }

      console.log('[AIChatStore] Saving chat with', messages.length, 'messages');
      await ChatHistoryService.saveChatHistory(messages);
      
      // Reset state after saving
      set({
        messages: [ChatService.getInitialMessage()],
        inputText: '',
      });

      console.log('[AIChatStore] Chat saved successfully');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[AIChatStore] Error saving chat:', errorMsg);
      throw error;
    }
  },

  // Load chat detail from Firebase
  loadChatDetail: async (chatId: string) => {
    try {
      const chatDetail = await ChatHistoryService.getChatHistoryDetail(chatId);

      if (chatDetail && chatDetail.messages.length > 0) {
        // Convert message timestamps
        const loadedMessages = chatDetail.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        }));

        set({
          messages: loadedMessages,
          inputText: '',
          showHistory: false,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('[AIChatStore] Error loading chat detail:', error);
      throw error;
    }
  },

  // Delete chat from Firebase
  deleteChatFromFirebase: async (chatId: string) => {
    try {
      await ChatHistoryService.deleteChatHistory(chatId);
      // State will auto-update via real-time subscription
      return true;
    } catch (error) {
      console.error('[AIChatStore] Error deleting chat:', error);
      throw error;
    }
  },
}));
