/**
 * FamilyService.ts
 * Service layer for family operations
 * Đã tối ưu cho Firestore Rules mới
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// --- Interfaces ---

export interface FamilyMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'member';
  joinedAt: Date | any; // Chấp nhận cả Date JS và Timestamp Firestore
  color?: string;
}

export interface FamilyModel {
  id?: string;
  name: string;
  description?: string;
  icon: string;
  
  // [QUAN TRỌNG] 2 trường này dùng để check Security Rules
  ownerId: string;        
  memberIds: string[];    
  // -----------------------------------------------------

  ownerName?: string;
  members: FamilyMember[]; // Dùng để hiển thị UI chi tiết
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
   */
  async createFamily(
    name: string,
    description: string = '',
    icon: string = 'home-heart'
  ): Promise<{ familyId: string; family: FamilyModel; inviteCode: string }> {
    const user = this.getCurrentUser();
    const inviteCode = this.generateInviteCode();

    // 1. Lấy thông tin User để làm Profile chủ nhóm
    const userDoc = await this.getUsersRef().doc(user.uid).get();
    const userData = userDoc.data() as any;

    const ownerMember: FamilyMember = {
      userId: user.uid,
      name: userData?.name || user.displayName || 'Chủ nhóm',
      email: user.email || '',
      avatar: userData?.avatar || '',
      role: 'owner',
      joinedAt: new Date(),
      color: userData?.color || '#00796B',
    };

    // 2. Chuẩn bị dữ liệu Family
    // ref.doc() không tham số sẽ tự tạo ID ngẫu nhiên
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
      ownerName: ownerMember.name,
      members: [ownerMember],
      inviteCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // 3. Dùng BATCH để lưu atomic (an toàn dữ liệu)
    const batch = firestore().batch();

    // - Tạo Family
    batch.set(newFamilyRef, familyData);

    // - Cập nhật User (thêm familyId vào danh sách)
    const userRef = this.getUsersRef().doc(user.uid);
    batch.update(userRef, {
      familyIds: firestore.FieldValue.arrayUnion(familyId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Thực thi
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
   * QUAN TRỌNG: Cập nhật cả 'members' và 'memberIds'
   */
  async addMemberByInviteCode(inviteCode: string): Promise<FamilyMember> {
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

    // Lấy thông tin User
    const userDoc = await this.getUsersRef().doc(user.uid).get();
    const userData = userDoc.data() as any;

    const newMember: FamilyMember = {
      userId: user.uid,
      name: userData?.name || user.displayName || 'Thành viên mới',
      email: user.email || '',
      avatar: userData?.avatar || '',
      role: 'member',
      joinedAt: new Date(),
      color: userData?.color || '#FF9800',
    };

    const batch = firestore().batch();
    const familyRef = this.getFamiliesRef().doc(familyDoc.id);

    // Update Family: Thêm vào mảng members (UI) VÀ mảng memberIds (Rule)
    batch.update(familyRef, {
      members: firestore.FieldValue.arrayUnion(newMember),
      memberIds: firestore.FieldValue.arrayUnion(user.uid),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update User: Thêm familyId
    const userRef = this.getUsersRef().doc(user.uid);
    batch.update(userRef, {
      familyIds: firestore.FieldValue.arrayUnion(familyDoc.id),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return newMember;
  }

  /**
   * 6. Xóa thành viên (Rời nhóm hoặc bị kick)
   */
  async removeMember(familyId: string, targetUserId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    
    const familyRef = this.getFamiliesRef().doc(familyId);
    const familyDoc = await familyRef.get();
    if (!familyDoc.exists) throw new Error('Không tìm thấy gia đình');
    
    const familyData = familyDoc.data() as FamilyModel;

    // Logic quyền hạn:
    // - Owner có thể xóa bất kỳ ai (trừ chính mình ở hàm deleteFamily)
    // - Member tự xóa chính mình (Rời nhóm)
    const isOwner = familyData.ownerId === currentUser.uid;
    const isSelf = currentUser.uid === targetUserId;

    if (!isOwner && !isSelf) {
      throw new Error('Bạn không có quyền xóa thành viên này.');
    }

    if (familyData.ownerId === targetUserId) {
      throw new Error('Chủ nhóm không thể rời nhóm (Hãy giải tán nhóm hoặc chuyển quyền).');
    }

    // Lọc bỏ member khỏi mảng object
    const updatedMembers = familyData.members.filter(m => m.userId !== targetUserId);

    const batch = firestore().batch();

    // Update Family
    batch.update(familyRef, {
      members: updatedMembers, // Ghi đè mảng mới
      memberIds: firestore.FieldValue.arrayRemove(targetUserId), // Xóa ID khỏi mảng permission
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update User bị xóa
    const targetUserRef = this.getUsersRef().doc(targetUserId);
    batch.update(targetUserRef, {
      familyIds: firestore.FieldValue.arrayRemove(familyId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  /**
   * 7. Giải tán (Xóa) gia đình
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

    const batch = firestore().batch();

    // Xóa familyId khỏi profile của TẤT CẢ thành viên
    // (Lưu ý: Batch giới hạn 500 operations, nếu nhóm > 500 người cần chia nhỏ)
    familyData.memberIds.forEach((memberId) => {
      const memberRef = this.getUsersRef().doc(memberId);
      batch.update(memberRef, {
        familyIds: firestore.FieldValue.arrayRemove(familyId)
      });
    });

    // Xóa document Family
    batch.delete(familyRef);

    await batch.commit();
  }
}

export default new FamilyService();