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
    if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

    const sub = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUpdate(items);
      });

    return sub;
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
