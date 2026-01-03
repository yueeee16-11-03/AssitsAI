/**
 * FamilyMemberManagementService.ts
 * Service để quản lý thành viên gia đình (fetch, update, delete, edit)
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FamilyMember } from '../FamilyMemberService';

export interface FamilyMemberWithActions extends FamilyMember {
  canDelete?: boolean;
  canEdit?: boolean;
  canChangeRole?: boolean;
}

class FamilyMemberManagementService {
  /**
   * Lấy danh sách thành viên gia đình với quyền kiểm soát
   */
  async getFamilyMembersWithActions(familyId: string): Promise<FamilyMemberWithActions[]> {
    try {
      if (!familyId) {
        throw new Error('familyId is required');
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Lấy thông tin gia đình để kiểm tra quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;
      const isAdmin = familyData.adminIds?.includes(currentUser.uid) || false;
      const hasAdminAccess = isOwner || isAdmin;

      // Lấy danh sách thành viên từ family_members collection
      const membersSnapshot = await firestore()
        .collection('family_members')
        .where('familyId', '==', familyId)
        .get();

      const members: FamilyMemberWithActions[] = membersSnapshot.docs.map((doc) => {
        const memberData = doc.data() as FamilyMember;
        const isCurrentUser = memberData.userId === currentUser.uid;
        const isMemberOwner = memberData.role === 'owner';

        return {
          ...memberData,
          // Chỉ admin/owner mới có thể xóa hoặc sửa
          canDelete: hasAdminAccess && !isCurrentUser && !isMemberOwner,
          canEdit: hasAdminAccess && !isCurrentUser,
          canChangeRole: isOwner && !isCurrentUser && !isMemberOwner,
        };
      });

      console.log('✅ [FamilyMemberManagementService] Fetched members:', {
        familyId,
        count: members.length,
        members: members.map((m) => ({
          id: m.userId,
          name: m.name,
          role: m.role,
          canDelete: m.canDelete,
          canEdit: m.canEdit,
        })),
      });

      return members;
    } catch (error) {
      console.error('❌ [FamilyMemberManagementService] Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Xóa thành viên khỏi gia đình
   */
  async removeFamilyMember(familyId: string, targetUserId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;
      const isAdmin = familyData.adminIds?.includes(currentUser.uid) || false;

      if (!isOwner && !isAdmin) {
        throw new Error('You do not have permission to remove members');
      }

      // Xóa thành viên từ family_members collection
      await firestore()
        .collection('family_members')
        .doc(targetUserId)
        .delete();

      console.log('✅ [FamilyMemberManagementService] Member removed:', {
        familyId,
        targetUserId,
      });
    } catch (error) {
      console.error('❌ [FamilyMemberManagementService] Error removing member:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin thành viên
   */
  async updateFamilyMember(
    familyId: string,
    userId: string,
    updates: Partial<FamilyMember>
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;
      const isAdmin = familyData.adminIds?.includes(currentUser.uid) || false;

      if (!isOwner && !isAdmin) {
        throw new Error('You do not have permission to update members');
      }

      // Cập nhật thành viên từ family_members collection
      await firestore()
        .collection('family_members')
        .doc(userId)
        .update(updates);

      console.log('✅ [FamilyMemberManagementService] Member updated:', {
        familyId,
        userId,
        updates,
      });
    } catch (error) {
      console.error('❌ [FamilyMemberManagementService] Error updating member:', error);
      throw error;
    }
  }

  /**
   * Cập nhật quyền thành viên
   */
  async updateMemberRole(
    familyId: string,
    userId: string,
    newRole: 'member' | 'admin' | 'child'
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Chỉ owner mới có thể thay đổi quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('Only owner can change member roles');
      }

      await this.updateFamilyMember(familyId, userId, { role: newRole });
    } catch (error) {
      console.error('❌ [FamilyMemberManagementService] Error updating role:', error);
      throw error;
    }
  }

  /**
   * Lấy icon trạng thái dựa trên role
   */
  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      owner: 'crown',
      admin: 'shield-admin',
      child: 'baby-face',
      member: 'account',
    };
    return roleIcons[role] || 'account';
  }

  /**
   * Lấy text màu sắc dựa trên role
   */
  getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      owner: '#FF6B6B',
      admin: '#FFD93D',
      child: '#96CEB4',
      member: '#4ECDC4',
    };
    return roleColors[role] || '#4ECDC4';
  }

  /**
   * Lấy display name của role
   */
  getRoleDisplay(role: string): string {
    const roleDisplay: { [key: string]: string } = {
      owner: '👑 Chủ nhóm',
      admin: '⭐ Quản trị viên',
      child: '👶 Con em',
      member: '👤 Thành viên',
    };
    return roleDisplay[role] || '👤 Thành viên';
  }
}

export default new FamilyMemberManagementService();
