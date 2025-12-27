/**
 * FamilyMemberService.ts
 * Quản lý thành viên gia đình, quyền hạn, và hạn mức chi tiêu
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// --- Enums & Types ---

export type FamilyRole = 'owner' | 'admin' | 'member' | 'child';

export interface SpendingLimit {
  limit: number; // Hạn mức tháng (0 = không giới hạn)
  currency: string;
  period: 'monthly' | 'yearly';
  updatedAt: Date | any;
}

export interface FamilyMember {
  id?: string;
  familyId: string;
  userId: string;
  
  // Thông tin cơ bản từ users collection
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  
  // Quyền hạn trong gia đình
  role: FamilyRole; // 'owner' | 'admin' | 'member' | 'child'
  
  // Hạn mức chi tiêu
  spendingLimit?: SpendingLimit;
  
  // Phân loại (admin & member có thể là người lớn hoặc trẻ con)
  isChild?: boolean; // true = trẻ con (Hạn mức cần kiểm soát)
  
  // Trạng thái
  joinedAt: Date | any;
  updatedAt: Date | any;
}

export interface FamilyMemberStats {
  totalMembers: number;
  owners: number;
  admins: number;
  members: number;
  children: number;
}

class FamilyMemberService {

  // --- Helpers ---

  private getFamilyMembersRef() {
    return firestore().collection('family_members');
  }

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

  private generateMemberId(familyId: string, userId: string): string {
    return `${familyId}_${userId}`;
  }

  // --- Main Methods ---

  /**
   * 1. Tạo thành viên gia đình mới (khi owner tạo hoặc user join)
   * @param skipPermissionCheck - true khi user join bằng invite code (code đã verify rồi)
   */
  async createFamilyMember(
    familyId: string,
    userId: string,
    role: FamilyRole = 'member',
    spendingLimit?: SpendingLimit,
    isChild: boolean = false,
    skipPermissionCheck: boolean = false
  ): Promise<FamilyMember> {
    const currentUser = this.getCurrentUser();

    // 🔧 FIX: Skip permission check trong 2 trường hợp:
    // 1. Tạo owner (user chưa có record)
    // 2. User join bằng invite code (code đã verify)
    const isCreatingOwner = role === 'owner' && userId === currentUser.uid;

    if (!isCreatingOwner && !skipPermissionCheck) {
      // Kiểm tra quyền: chỉ owner hoặc admin mới tạo thành viên
      const isAuthorized = await this.isUserAuthorizedInFamily(
        familyId,
        currentUser.uid,
        ['owner', 'admin']
      );
      if (!isAuthorized) {
        throw new Error('Bạn không có quyền thêm thành viên.');
      }
    }

    // Lấy dữ liệu user từ users collection
    const userDoc = await this.getUsersRef().doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User không tồn tại.');
    }
    const userData = userDoc.data() as any;

    const memberId = this.generateMemberId(familyId, userId);
    
    // Build memberData - chỉ include fields có giá trị, bỏ undefined
    const memberData: FamilyMember = {
      id: memberId,
      familyId,
      userId,
      name: userData?.name || 'Thành viên mới',
      email: userData?.email || '',
      avatar: userData?.avatar || '',
      color: userData?.color || '#FF9800',
      role,
      isChild,
      joinedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // ✅ Chỉ thêm spendingLimit nếu có giá trị (avoid undefined)
    if (spendingLimit !== undefined) {
      (memberData as any).spendingLimit = spendingLimit;
    }

    await this.getFamilyMembersRef().doc(memberId).set(memberData);

    // Cập nhật memberIds trong families document để phục vụ Rules
    await this.getFamiliesRef().doc(familyId).update({
      memberIds: firestore.FieldValue.arrayUnion(userId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...memberData,
      joinedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 2. Lấy thành viên theo ID
   */
  async getFamilyMember(familyId: string, userId: string): Promise<FamilyMember> {
    const memberId = this.generateMemberId(familyId, userId);
    const doc = await this.getFamilyMembersRef().doc(memberId).get();

    if (!doc.exists) {
      throw new Error('Thành viên không tồn tại trong gia đình này.');
    }

    const data = doc.data() as any;
    return this.formatMemberData(data);
  }

  /**
   * 3. Lấy tất cả thành viên của gia đình
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      console.log('🔍 [FamilyMemberService] Querying family_members for familyId:', familyId);
      
      const snapshot = await this.getFamilyMembersRef()
        .where('familyId', '==', familyId)
        .orderBy('joinedAt', 'asc')
        .get();

      console.log('📦 [FamilyMemberService] Query result:', {
        familyId,
        docCount: snapshot.docs.length,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        })),
      });

      const members = snapshot.docs.map(doc => this.formatMemberData(doc.data() as any));
      console.log('✅ [FamilyMemberService] Formatted members:', members);
      
      return members;
    } catch (error) {
      console.error('❌ [FamilyMemberService] Error fetching family members:', error);
      throw error;
    }
  }

  /**
   * 3.5. 🧭 Lấy gia đình mà user hiện tại thuộc về
   * Query: family_members WHERE userId == currentUserId LIMIT 1
   * ➡️ Trả về familyId nếu user thuộc gia đình, null nếu không
   */
  async getUserFamily(): Promise<FamilyMember | null> {
    try {
      const currentUser = this.getCurrentUser();
      console.log('🔍 [FamilyMemberService] Checking user family for userId:', currentUser.uid);

      const snapshot = await this.getFamilyMembersRef()
        .where('userId', '==', currentUser.uid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log('⚠️ [FamilyMemberService] User does not belong to any family');
        return null;
      }

      const doc = snapshot.docs[0];
      const member = this.formatMemberData(doc.data() as any);
      console.log('✅ [FamilyMemberService] User family found:', {
        userId: currentUser.uid,
        familyId: member.familyId,
        role: member.role,
      });

      return member;
    } catch (error) {
      console.error('❌ [FamilyMemberService] Error fetching user family:', error);
      throw error;
    }
  }

  /**
   * 4. Lấy thống kê thành viên gia đình
   */
  async getFamilyMemberStats(familyId: string): Promise<FamilyMemberStats> {
    const members = await this.getFamilyMembers(familyId);

    return {
      totalMembers: members.length,
      owners: members.filter(m => m.role === 'owner').length,
      admins: members.filter(m => m.role === 'admin').length,
      members: members.filter(m => m.role === 'member').length,
      children: members.filter(m => m.isChild).length,
    };
  }

  /**
   * 5. Cập nhật quyền hạn thành viên
   */
  async updateMemberRole(
    familyId: string,
    targetUserId: string,
    newRole: FamilyRole
  ): Promise<void> {
    const currentUser = this.getCurrentUser();

    // Chỉ owner mới có quyền thay đổi role
    const isOwner = await this.isUserOwnerOfFamily(familyId, currentUser.uid);
    if (!isOwner) {
      throw new Error('Chỉ chủ nhóm mới có quyền thay đổi quyền hạn.');
    }

    const memberId = this.generateMemberId(familyId, targetUserId);
    await this.getFamilyMembersRef().doc(memberId).update({
      role: newRole,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 6. Cập nhật hạn mức chi tiêu
   */
  async updateSpendingLimit(
    familyId: string,
    targetUserId: string,
    spendingLimit: SpendingLimit | null
  ): Promise<void> {
    const currentUser = this.getCurrentUser();

    // Owner hoặc admin có quyền cập nhật hạn mức
    const isAuthorized = await this.isUserAuthorizedInFamily(
      familyId,
      currentUser.uid,
      ['owner', 'admin']
    );
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền cập nhật hạn mức chi tiêu.');
    }

    const memberId = this.generateMemberId(familyId, targetUserId);
    
    if (spendingLimit === null) {
      // Xóa hạn mức
      await this.getFamilyMembersRef().doc(memberId).update({
        spendingLimit: firestore.FieldValue.delete(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Cập nhật hạn mức
      await this.getFamilyMembersRef().doc(memberId).update({
        spendingLimit: {
          ...spendingLimit,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  /**
   * 7. Đánh dấu thành viên là trẻ con
   */
  async setChildStatus(
    familyId: string,
    targetUserId: string,
    isChild: boolean
  ): Promise<void> {
    const currentUser = this.getCurrentUser();

    // Owner hoặc admin có quyền
    const isAuthorized = await this.isUserAuthorizedInFamily(
      familyId,
      currentUser.uid,
      ['owner', 'admin']
    );
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền cập nhật trạng thái này.');
    }

    const memberId = this.generateMemberId(familyId, targetUserId);
    await this.getFamilyMembersRef().doc(memberId).update({
      isChild,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 8. Xóa thành viên (Rời nhóm hoặc bị kick)
   */
  async removeMember(familyId: string, targetUserId: string): Promise<void> {
    const currentUser = this.getCurrentUser();

    // Lấy member data để kiểm tra role
    const member = await this.getFamilyMember(familyId, targetUserId);

    // Logic quyền hạn:
    // - Owner có thể xóa bất kỳ ai (trừ chính mình)
    // - Admin có thể xóa member/child (không xóa owner/admin)
    // - Member chỉ tự xóa chính mình (rời nhóm)

    if (currentUser.uid === targetUserId) {
      // Tự xóa chính mình
      const currentMember = await this.getFamilyMember(familyId, currentUser.uid);
      if (currentMember.role === 'owner') {
        throw new Error('Chủ nhóm không thể rời nhóm (Hãy giải tán hoặc chuyển quyền).');
      }
    } else {
      // Xóa người khác
      const currentMember = await this.getFamilyMember(familyId, currentUser.uid);
      
      if (currentMember.role === 'owner') {
        // Owner có thể xóa bất kỳ ai trừ chính mình
        if (member.role === 'owner') {
          throw new Error('Không thể xóa chủ nhóm khác.');
        }
      } else if (currentMember.role === 'admin') {
        // Admin chỉ xóa member hoặc child
        if (['owner', 'admin'].includes(member.role)) {
          throw new Error('Admin không thể xóa owner hoặc admin khác.');
        }
      } else {
        // Member/Child không xóa được ai
        throw new Error('Bạn không có quyền xóa thành viên.');
      }
    }

    const memberId = this.generateMemberId(familyId, targetUserId);
    const batch = firestore().batch();

    // Xóa document family_member
    batch.delete(this.getFamilyMembersRef().doc(memberId));

    // Cập nhật memberIds trong families
    batch.update(this.getFamiliesRef().doc(familyId), {
      memberIds: firestore.FieldValue.arrayRemove(targetUserId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Cập nhật user document (xóa familyId)
    batch.update(this.getUsersRef().doc(targetUserId), {
      familyIds: firestore.FieldValue.arrayRemove(familyId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  /**
   * 9. Chuyển quyền owner cho thành viên khác
   */
  async transferOwnership(familyId: string, newOwnerId: string): Promise<void> {
    const currentUser = this.getCurrentUser();

    // Chỉ owner hiện tại mới có quyền chuyển
    const isOwner = await this.isUserOwnerOfFamily(familyId, currentUser.uid);
    if (!isOwner) {
      throw new Error('Chỉ chủ nhóm mới có quyền chuyển quyền.');
    }

    // Kiểm tra new owner có tồn tại trong gia đình không
    const newOwnerMember = await this.getFamilyMember(familyId, newOwnerId);
    if (!newOwnerMember) {
      throw new Error('Người được chuyển quyền không phải thành viên gia đình.');
    }

    const batch = firestore().batch();

    // Cập nhật old owner thành admin
    const oldOwnerMemberId = this.generateMemberId(familyId, currentUser.uid);
    batch.update(this.getFamilyMembersRef().doc(oldOwnerMemberId), {
      role: 'admin',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Cập nhật new owner
    const newOwnerMemberId = this.generateMemberId(familyId, newOwnerId);
    batch.update(this.getFamilyMembersRef().doc(newOwnerMemberId), {
      role: 'owner',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Cập nhật families document
    batch.update(this.getFamiliesRef().doc(familyId), {
      ownerId: newOwnerId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  /**
   * 10. Kiểm tra xem user có quyền hạn nào trong gia đình không
   */
  async isUserAuthorizedInFamily(
    familyId: string,
    userId: string,
    requiredRoles: FamilyRole[]
  ): Promise<boolean> {
    try {
      const member = await this.getFamilyMember(familyId, userId);
      return requiredRoles.includes(member.role);
    } catch {
      return false;
    }
  }

  /**
   * 11. Kiểm tra user có phải owner không
   */
  async isUserOwnerOfFamily(familyId: string, userId: string): Promise<boolean> {
    return this.isUserAuthorizedInFamily(familyId, userId, ['owner']);
  }

  /**
   * 12. Lấy role của user trong gia đình
   */
  async getUserRoleInFamily(familyId: string, userId: string): Promise<FamilyRole | null> {
    try {
      const member = await this.getFamilyMember(familyId, userId);
      return member.role;
    } catch {
      return null;
    }
  }

  // --- Utilities ---

  private formatMemberData(data: any): FamilyMember {
    return {
      ...data,
      joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      spendingLimit: data.spendingLimit ? {
        ...data.spendingLimit,
        updatedAt: data.spendingLimit.updatedAt?.toDate
          ? data.spendingLimit.updatedAt.toDate()
          : new Date(),
      } : undefined,
    };
  }
}

export default new FamilyMemberService();
