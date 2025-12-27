/**
 * FamilyService.ts
 * Service layer for family operations
 * Đã tối ưu cho Firestore Rules mới
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// --- Interfaces ---

export interface FamilyModel {
  id?: string;
  name: string;
  description?: string;
  icon: string;
  
  // [QUAN TRỌNG] 2 trường này dùng để check Security Rules
  ownerId: string;        
  memberIds: string[];    
  // ----- CHUYỂN sang family_members collection -----
  
  inviteCode: string;
  createdAt?: Date | any;
  updatedAt?: Date | any;
}

class FamilyService {

  // --- Helpers ---

  private getFamiliesRef() {
    return firestore().collection('families');
  }

  private getUsersRef() {
    return firestore().collection('users');
  }

  private getFamilyMembersRef() {
    return firestore().collection('family_members');
  }

  private getCurrentUser() {
    const user = auth().currentUser;
    if (!user) throw new Error('Vui lòng đăng nhập để tiếp tục');
    return user;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // --- Main Methods ---

  /**
   * 1. Tạo gia đình mới
   * FIX LỖI: Đã thêm ownerId và memberIds để vượt qua Rule
   * NOTE: Thành viên được quản lý qua family_members collection
   */
  async createFamily(
    name: string,
    description: string = '',
    icon: string = 'home-heart'
  ): Promise<{ familyId: string; family: FamilyModel; inviteCode: string }> {
    const user = this.getCurrentUser();
    const inviteCode = this.generateInviteCode();

    // Chuẩn bị dữ liệu Family (không chứa members)
    const newFamilyRef = this.getFamiliesRef().doc(); 
    const familyId = newFamilyRef.id;

    const familyData: FamilyModel = {
      id: familyId,
      name: name.trim(),
      description: description.trim(),
      icon,
      // ---> BẮT BUỘC CÓ ĐỂ QUA RULE <---
      ownerId: user.uid,
      memberIds: [user.uid],
      // --------------------------------
      inviteCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // 🎯 BATCH WRITE: TẠO FAMILY + MEMBER + UPDATE USER (ATOMIC)
    const batch = firestore().batch();

    // BƯỚC 1: Tạo Family document
    batch.set(newFamilyRef, familyData);

    // BƯỚC 2: Tạo family_member cho owner (TRONG CÙNG BATCH)
    // Dùng helper để tạo memberId
    const memberId = `${familyId}_${user.uid}`;
    const memberRef = this.getFamilyMembersRef().doc(memberId);
    
    // Lấy user data để fill thông tin member
    const userDoc = await this.getUsersRef().doc(user.uid).get();
    const userData = userDoc.data() as any;
    
    const memberData = {
      id: memberId,
      familyId,
      userId: user.uid,
      name: userData?.name || 'Chủ nhóm',
      email: userData?.email || '',
      avatar: userData?.avatar || '',
      color: userData?.color || '#FF9800',
      role: 'owner',
      isChild: false,
      joinedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    batch.set(memberRef, memberData);

    // BƯỚC 3: Cập nhật User (thêm familyId vào danh sách)
    const userRef = this.getUsersRef().doc(user.uid);
    batch.update(userRef, {
      familyIds: firestore.FieldValue.arrayUnion(familyId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 🎯 ATOMIC COMMIT - CẢ 3 BƯỚC CÙNG LÚC
    await batch.commit();

    // Trả về dữ liệu đã format Date để UI dùng ngay
    return {
      familyId,
      family: { ...familyData, createdAt: new Date(), updatedAt: new Date() },
      inviteCode,
    };
  }

  /**
   * 2. Lấy danh sách gia đình của User
   * TỐI ƯU: Lấy familyIds từ user document thay vì query toàn bộ families
   * (Tránh lỗi firestore/failed-precondition cần composite index)
   */
  async getUserFamilies(): Promise<FamilyModel[]> {
    const user = this.getCurrentUser();

    try {
      // Bước 1: Lấy user document để lấy familyIds
      const userDoc = await this.getUsersRef().doc(user.uid).get();
      const userData = userDoc.data() as any;
      const familyIds = userData?.familyIds || [];

      if (familyIds.length === 0) return [];

      // Bước 2: Lấy từng family document (batch reads safer than index query)
      const families: FamilyModel[] = [];
      for (const familyId of familyIds) {
        try {
          const familyDoc = await this.getFamiliesRef().doc(familyId).get();
          if (familyDoc.exists()) {
            const data = familyDoc.data() as any;
            if (data) {
              families.push({
                id: familyDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
              } as FamilyModel);
            }
          }
        } catch (err) {
          console.warn(`Lỗi lấy family ${familyId}:`, err);
        }
      }

      // Sort by updatedAt descending
      return families.sort((a, b) => {
        const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Lỗi getUserFamilies:', error);
      throw error;
    }
  }

  /**
   * 3. Lấy chi tiết 1 gia đình
   */
  async getFamilyById(familyId: string): Promise<FamilyModel> {
    const doc = await this.getFamiliesRef().doc(familyId).get();

    if (!doc.exists) {
      throw new Error('Gia đình không tồn tại hoặc bạn không có quyền xem.');
    }

    const data = doc.data() as any;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    };
  }

  /**
   * 4. Cập nhật thông tin gia đình
   */
  async updateFamily(familyId: string, updates: Partial<FamilyModel>): Promise<void> {
    const user = this.getCurrentUser();

    // Rule sẽ chặn ở server, nhưng check ở client để báo lỗi rõ ràng hơn
    const family = await this.getFamilyById(familyId);
    if (family.ownerId !== user.uid) {
      throw new Error('Chỉ chủ nhóm mới có quyền chỉnh sửa.');
    }

    const dataToUpdate: any = {
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    if (updates.name) dataToUpdate.name = updates.name.trim();
    if (updates.description) dataToUpdate.description = updates.description.trim();
    if (updates.icon) dataToUpdate.icon = updates.icon;

    await this.getFamiliesRef().doc(familyId).update(dataToUpdate);
  }

  /**
   * 5. Tham gia gia đình bằng mã mời
   * NOTE: Thành viên được tạo trong family_members collection
   */
  async addMemberByInviteCode(inviteCode: string): Promise<any> {
    const user = this.getCurrentUser();

    // Tìm gia đình có mã mời khớp
    const snapshot = await this.getFamiliesRef()
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Mã mời không chính xác.');
    }

    const familyDoc = snapshot.docs[0];
    const familyData = familyDoc.data() as FamilyModel;

    // Kiểm tra đã tham gia chưa
    if (familyData.memberIds.includes(user.uid)) {
      throw new Error('Bạn đã là thành viên của gia đình này rồi.');
    }

    // Import FamilyMemberService để tạo family_member
    // ✅ Pass skipPermissionCheck=true vì invite code đã verify quyền rồi
    const FamilyMemberService = require('./FamilyMemberService').default;
    const newMember = await FamilyMemberService.createFamilyMember(
      familyDoc.id,
      user.uid,
      'member',
      undefined,  // spendingLimit
      false,      // isChild
      true        // skipPermissionCheck ← invite code đã verify!
    );

    return newMember;
  }

  /**
   * 6. Xóa thành viên (Rời nhóm hoặc bị kick)
   * NOTE: Xóa từ family_members collection qua FamilyMemberService
   */
  async removeMember(familyId: string, targetUserId: string): Promise<void> {
    // Import FamilyMemberService để xóa family_member
    const FamilyMemberService = require('./FamilyMemberService').default;
    await FamilyMemberService.removeMember(familyId, targetUserId);
  }

  /**
   * 7. Giải tán (Xóa) gia đình
   * NOTE: Xóa sạch tất cả: family document, family_members, subcollections (transactions, wallets, budgets, habits...)
   */
  async deleteFamily(familyId: string): Promise<void> {
    const user = this.getCurrentUser();
    const familyRef = this.getFamiliesRef().doc(familyId);
    
    const familyDoc = await familyRef.get();
    if (!familyDoc.exists) return;
    
    const familyData = familyDoc.data() as FamilyModel;

    if (familyData.ownerId !== user.uid) {
      throw new Error('Chỉ chủ nhóm mới có thể xóa gia đình.');
    }

    // Step 1: Xóa TẤT CẢ subcollections của family
    const subcollections = ['transactions', 'wallets', 'budgets', 'members', 'habits'];
    for (const subcol of subcollections) {
      const subcollectionRef = familyRef.collection(subcol);
      const snapshot = await subcollectionRef.get();
      
      for (const doc of snapshot.docs) {
        // Nếu subcollection có nested subcollections, xóa nó trước
        if (subcol === 'habits') {
          const logsSnapshot = await doc.ref.collection('logs').get();
          for (const logDoc of logsSnapshot.docs) {
            await logDoc.ref.delete();
          }
        }
        await doc.ref.delete();
      }
    }

    // Step 2: Xóa familyId khỏi profile của TẤT CẢ thành viên (trong users collection)
    const batch = firestore().batch();
    familyData.memberIds.forEach((memberId) => {
      const memberRef = this.getUsersRef().doc(memberId);
      batch.update(memberRef, {
        familyIds: firestore.FieldValue.arrayRemove(familyId)
      });
    });
    
    // Step 3: Xóa family document cuối cùng
    batch.delete(familyRef);
    await batch.commit();

    // Step 4: Xóa tất cả family_members từ root collection
    const familyMembersRef = this.getFamilyMembersRef();
    const familyMembersSnapshot = await familyMembersRef
      .where('familyId', '==', familyId)
      .get();
    
    for (const doc of familyMembersSnapshot.docs) {
      await doc.ref.delete();
    }
  }
}

export default new FamilyService();