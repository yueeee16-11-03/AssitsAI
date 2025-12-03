/**
 * ChatHistoryService.ts
 * Quản lý lưu trữ lịch sử chat lên Firebase Firestore
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  messages: ChatMessage[];
  createdAt: Date;
}

class ChatHistoryService {
  private readonly COLLECTION_NAME = 'chatHistories';

  /**
   * Lưu lịch sử chat lên Firebase
   * @param messages - Array messages từ chat
   * @returns Promise<string> - ID của chat history vừa tạo
   */
  async saveChatHistory(messages: ChatMessage[]): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User chưa đăng nhập');
      }

      // Lấy tiêu đề từ message đầu tiên của user
      const userMessages = messages.filter(m => m.isUser);
      const chatTitle = userMessages[0]?.text.substring(0, 30) || 'Chat';

      const chatHistoryData = {
        userId: currentUser.uid,
        title: chatTitle,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          isUser: msg.isUser,
          timestamp: msg.timestamp,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Lưu lên Firebase
      const docRef = await firestore()
        .collection(this.COLLECTION_NAME)
        .add(chatHistoryData);

      console.log('[ChatHistoryService] Chat saved to Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi lưu chat';
      console.error('[ChatHistoryService] Error saving chat:', errorMsg);
      throw error;
    }
  }

  /**
   * Lấy danh sách lịch sử chat từ Firebase
   * @returns Promise<ChatHistoryItem[]> - Danh sách chat history
   */
  async fetchChatHistories(): Promise<ChatHistoryItem[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('[ChatHistoryService] User not authenticated');
        return [];
      }

      const snapshot = await firestore()
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const histories: ChatHistoryItem[] = [];
      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          if (!data) {
            console.warn('[ChatHistoryService] Empty document data:', doc.id);
            return;
          }

          histories.push({
            id: doc.id,
            title: data.title || 'Untitled',
            date: data.createdAt 
              ? new Date(data.createdAt.toDate()).toLocaleString('vi-VN')
              : new Date().toLocaleString('vi-VN'),
            messageCount: data.messageCount || 0,
            messages: Array.isArray(data.messages) ? data.messages : [],
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        } catch (docError) {
          console.error('[ChatHistoryService] Error processing document:', doc.id, docError);
        }
      });

      console.log('[ChatHistoryService] Fetched', histories.length, 'histories from Firebase');
      return histories;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi lấy lịch sử';
      console.error('[ChatHistoryService] Error fetching histories:', errorMsg);
      return [];
    }
  }

  /**
   * Xóa một chat history từ Firebase
   * @param chatId - ID của chat history
   */
  async deleteChatHistory(chatId: string): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(chatId)
        .delete();

      console.log('[ChatHistoryService] Chat deleted from Firebase:', chatId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi xóa chat';
      console.error('[ChatHistoryService] Error deleting chat:', errorMsg);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một chat history
   * @param chatId - ID của chat history
   */
  async getChatHistoryDetail(chatId: string): Promise<ChatHistoryItem | null> {
    try {
      const doc = await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(chatId)
        .get();

      if (!doc.exists) {
        console.warn('[ChatHistoryService] Document not found:', chatId);
        return null;
      }

      const data = doc.data();
      if (!data) {
        console.warn('[ChatHistoryService] Empty document data:', chatId);
        return null;
      }

      return {
        id: doc.id,
        title: data.title || 'Untitled',
        date: data.createdAt 
          ? new Date(data.createdAt.toDate()).toLocaleString('vi-VN')
          : new Date().toLocaleString('vi-VN'),
        messageCount: data.messageCount || 0,
        messages: Array.isArray(data.messages) ? data.messages : [],
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi lấy chi tiết';
      console.error('[ChatHistoryService] Error fetching detail:', errorMsg);
      return null;
    }
  }

  /**
   * Subscribe to real-time chat histories updates
   * @param callback - Hàm callback khi dữ liệu thay đổi
   */
  subscribeToHistories(callback: (histories: ChatHistoryItem[]) => void): () => void {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('[ChatHistoryService] User not authenticated for subscription');
        return () => {};
      }

      console.log('[ChatHistoryService] Setting up subscription for user:', currentUser.uid);

      const unsubscribe = firestore()
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            console.log('[ChatHistoryService] Snapshot received with', snapshot.docs.length, 'documents');
            const histories: ChatHistoryItem[] = [];
            
            snapshot.forEach(doc => {
              try {
                const data = doc.data();
                if (!data) {
                  console.warn('[ChatHistoryService] Empty document data:', doc.id);
                  return;
                }

                const item: ChatHistoryItem = {
                  id: doc.id,
                  title: data.title || 'Untitled',
                  date: data.createdAt 
                    ? new Date(data.createdAt.toDate()).toLocaleString('vi-VN')
                    : new Date().toLocaleString('vi-VN'),
                  messageCount: data.messageCount || 0,
                  messages: Array.isArray(data.messages) ? data.messages : [],
                  createdAt: data.createdAt?.toDate() || new Date(),
                };
                
                console.log('[ChatHistoryService] Added history item:', item.id, item.title);
                histories.push(item);
              } catch (docError) {
                console.error('[ChatHistoryService] Error processing document:', doc.id, docError);
              }
            });
            
            console.log('[ChatHistoryService] Calling callback with', histories.length, 'histories');
            callback(histories);
          },
          (error) => {
            console.error('[ChatHistoryService] Snapshot error:', error);
            // Callback với empty array khi có lỗi
            callback([]);
          }
        );

      console.log('[ChatHistoryService] Subscribed to real-time updates');
      return unsubscribe;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi subscribe';
      console.error('[ChatHistoryService] Error subscribing:', errorMsg);
      return () => {};
    }
  }
}

export default new ChatHistoryService();
