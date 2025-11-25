import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface WalletModel {
  id?: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet';
  balance: number;
  icon?: string;
  color?: string;
  isHidden?: boolean;
  bankName?: string;
  accountNumber?: string;
}

class WalletService {
  private _clean(obj: any) {
    if (!obj) return null;
    const cleaned: any = {};
    for (const k in obj) {
      if (obj[k] !== undefined) cleaned[k] = obj[k];
    }
    return cleaned;
  }

  private _getCollectionRef() {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');
    return firestore().collection('users').doc(user.uid).collection('wallets');
  }

  async getAllWallets(): Promise<WalletModel[]> {
    const ref = this._getCollectionRef();
    const snap = await ref.orderBy('createdAt', 'desc').get({ source: 'server' });
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
  }

  async addWallet(data: WalletModel) {
    const ref = this._getCollectionRef();
    // avoid saving any client-provided 'id' field in the document
    const { id, ...cleanData } = data as any;
    const payload = this._clean({
      ...cleanData,
      isHidden: !!data.isHidden,
      userId: auth().currentUser?.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ref.add(payload as any);
    const fresh = await this.getAllWallets();
    return { success: true, id: doc.id, freshData: fresh };
  }

  async updateWallet(id: string, update: Partial<WalletModel>) {
    const ref = this._getCollectionRef();
    await ref.doc(id).update(this._clean({ ...update, updatedAt: firestore.FieldValue.serverTimestamp() }));
    const fresh = await this.getAllWallets();
    return { success: true, updatedId: id, freshData: fresh };
  }

  async deleteWallet(id: string) {
    const ref = this._getCollectionRef();
    await ref.doc(id).delete();
    const fresh = await this.getAllWallets();
    return { success: true, deletedId: id, freshData: fresh };
  }

  async toggleVisibility(id: string) {
    const doc = this._getCollectionRef().doc(id);
    const snap = await doc.get({ source: 'server' });
    const current = snap.data() as any;
    await doc.update({ isHidden: !current?.isHidden, updatedAt: firestore.FieldValue.serverTimestamp() });
    const fresh = await this.getAllWallets();
    return { success: true, toggledId: id, freshData: fresh };
  }

  async transferBetweenWallets(fromId: string, toId: string, amount: number) {
    if (!fromId || !toId || fromId === toId) throw new Error('Invalid wallets');
    const amountNum = Number(String(amount).replace(/[,\s]/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid amount');

    const fromRef = this._getCollectionRef().doc(fromId);
    const toRef = this._getCollectionRef().doc(toId);

    await firestore().runTransaction(async tx => {
      const f = await tx.get(fromRef);
      const t = await tx.get(toRef);
      if (!f.exists || !t.exists) throw new Error('Wallet not found');
      const fromData = f.data() as any;
      const toData = t.data() as any;
      if ((fromData?.balance || 0) < amountNum) throw new Error('Insufficient funds');

      tx.update(fromRef, { balance: (fromData.balance || 0) - amountNum, updatedAt: firestore.FieldValue.serverTimestamp() });
      tx.update(toRef, { balance: (toData.balance || 0) + amountNum, updatedAt: firestore.FieldValue.serverTimestamp() });
    });

    const fresh = await this.getAllWallets();
    return { success: true, freshData: fresh };
  }

  async getTotalBalance() {
    const wallets = await this.getAllWallets();
    return wallets.reduce((s, w) => s + (w.isHidden ? 0 : (w.balance || 0)), 0);
  }
}

export default new WalletService();
