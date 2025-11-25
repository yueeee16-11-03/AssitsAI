import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

class GoalApi {
  async getAllGoals() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('goals')
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' });

      const goals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return goals;
    } catch (error) {
      console.error('❌ [API] Error fetching goals:', error);
      throw error;
    }
  }

  async addGoalToFirebase(goalData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

      const { id, ...dataToSave } = goalData;

      const docRef = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('goals')
        .add({
          ...dataToSave,
          userId: currentUser.uid,
          transactions: dataToSave.transactions || [],
          currentAmount: dataToSave.currentAmount || 0,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      return docRef.id;
    } catch (error) {
      console.error('❌ [API] Error adding goal:', error);
      throw error;
    }
  }

  async updateGoalOnFirebase(goalId, updateData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('goals')
        .doc(goalId)
        .update({ ...updateData, updatedAt: firestore.FieldValue.serverTimestamp() });

      return true;
    } catch (error) {
      console.error('❌ [API] Error updating goal:', error);
      throw error;
    }
  }

  async deleteGoalFromFirebase(goalId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('goals')
        .doc(goalId)
        .delete();

      return true;
    } catch (error) {
      console.error('❌ [API] Error deleting goal:', error);
      throw error;
    }
  }

  async addTransactionToGoal(goalId, transaction) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Người dùng chưa đăng nhập');

      const goalRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('goals')
        .doc(goalId);

      // Use a transaction to atomically add transaction doc and update currentAmount
      await firestore().runTransaction(async (tx) => {
        const goalSnap = await tx.get(goalRef);
        if (!goalSnap.exists) throw new Error('Goal not found');

        const goalData = goalSnap.data() || {};
        const currentAmount = goalData.currentAmount || 0;
        const amt = Number(transaction.amount || 0);

          // create a transaction id and save into subcollection (optional) and parent array
          const txRef = goalRef.collection('transactions').doc();
          const txId = txRef.id;
          // write transaction in subcollection (use server timestamp)
          tx.set(txRef, {
            ...transaction,
            id: txId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });

          // push transaction into parent document's transactions array (preserve order newest-first)
          const clientTransaction = { id: txId, ...transaction, date: transaction.date || new Date().toISOString() };
          const newTransactions = [clientTransaction, ...(goalData.transactions || [])];

          // update parent goal amount + transactions array
          tx.update(goalRef, {
            currentAmount: currentAmount + amt,
            transactions: newTransactions,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
      });

      return true;
    } catch (error) {
      console.error('❌ [API] Error adding transaction to goal:', error);
      throw error;
    }
  }
}

export default new GoalApi();
