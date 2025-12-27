import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

class NotificationApi {
  async createNotification(payload) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    const ref = payload.id
      ? firestore().collection('users').doc(currentUser.uid).collection('notifications').doc(payload.id)
      : firestore().collection('users').doc(currentUser.uid).collection('notifications').doc();

    const docId = ref.id;
    const data = {
      title: payload.title || '',
      message: payload.message || payload.body || '',
      type: payload.type || 'reminder',
      icon: payload.icon || null,
      color: payload.color || null,
      actionRoute: payload.actionRoute || null,
      read: !!payload.read || false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await ref.set(data, { merge: true });
    return { success: true, id: docId };
  }

  async getNotifications(limit = 200) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    const snapshot = await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get({ source: 'server' });

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  subscribe(onUpdate, limit = 200) {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      // Không throw, return unsubscribe function yang aman
      return () => {};
    }

    let unsubscribeListener = null;

    const setupListener = () => {
      const user = auth().currentUser;
      // Jika user berubah/logout, jangan setup listener baru
      if (!user) {
        return;
      }

      unsubscribeListener = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .onSnapshot(
          snapshot => {
            // Kiểm tra snapshot có tồn tại và có docs không
            if (snapshot && snapshot.docs) {
              const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              onUpdate(items);
            }
          },
          error => {
            // Xử lý lỗi từ listener (ví dụ: permission denied sau khi logout)
            console.warn('Notification listener error:', error.code, error.message);
            // Không throw error vì listener sẽ tự unsubscribe nếu permission bị từ chối
            if (error.code === 'permission-denied') {
              // Silent fail - user đã logout hoặc không có quyền truy cập
              return;
            }
          }
        );
    };

    setupListener();

    // Return unsubscribe function
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }

  async markAsRead(id) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    const ref = firestore().collection('users').doc(currentUser.uid).collection('notifications').doc(id);
    await ref.set({ read: true, updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
  }

  async markAllRead() {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    const q = firestore().collection('users').doc(currentUser.uid).collection('notifications').where('read', '==', false);
    const snap = await q.get();
    if (snap.empty) return { success: true };

    const batch = firestore().batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true, updatedAt: firestore.FieldValue.serverTimestamp() }));
    await batch.commit();
    return { success: true };
  }

  async deleteNotification(id) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    await firestore().collection('users').doc(currentUser.uid).collection('notifications').doc(id).delete();
    return { success: true };
  }
}

export default new NotificationApi();
