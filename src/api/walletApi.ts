import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface WalletApiModel {
  id?: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet';
  balance: number;
  icon?: string;
  color?: string;
  isHidden?: boolean;
  bankName?: string;
  accountNumber?: string;
  createdAt?: any;
  updatedAt?: any;
}

class WalletApi {
  private async _getCollectionRef() {
    const current = auth().currentUser;
    if (!current) throw new Error('User not authenticated');
    return firestore().collection('users').doc(current.uid).collection('wallets');
  }

  async getWallets() {
    const ref = await this._getCollectionRef();
    const snap = await ref.orderBy('createdAt', 'desc').get({ source: 'server' });
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
  }

  async addWallet(payload: WalletApiModel) {
    const ref = await this._getCollectionRef();
    const current = auth().currentUser;
    if (!current) throw new Error('User not authenticated');

    // prevent storing an 'id' prop on the document
    const payloadNoId = { ...(payload as any) };
    delete payloadNoId.id;
    const doc = await ref.add({
      ...payloadNoId,
      userId: current.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return { id: doc.id, ...payload };
  }

  async updateWallet(id: string, updateData: Partial<WalletApiModel>) {
    const ref = await this._getCollectionRef();
    await ref.doc(id).update({ ...updateData, updatedAt: firestore.FieldValue.serverTimestamp() });
    return true;
  }

  async deleteWallet(id: string) {
    const ref = await this._getCollectionRef();
    await ref.doc(id).delete();
    return true;
  }
}

export default new WalletApi();
