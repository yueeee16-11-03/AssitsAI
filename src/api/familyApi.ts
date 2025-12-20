/**
 * familyApi.ts
 * API layer for family operations
 * Handles creating, fetching, updating families
 * 
 * NOTE: This is a simplified wrapper layer.
 * Main logic is in FamilyService and familyStore.
 */

// Simple wrapper that delegates to store/service
export interface CreateFamilyResponse {
  success: boolean;
  familyId?: string;
  family?: any;
  inviteCode?: string;
  error?: string;
}

export interface FetchFamiliesResponse {
  success: boolean;
  families?: any[];
  error?: string;
}

export interface UpdateFamilyResponse {
  success: boolean;
  family?: any;
  error?: string;
}

export interface AddMemberResponse {
  success: boolean;
  member?: any;
  error?: string;
}

class FamilyApi {
  /**
   * Create a new family
   * Delegates to FamilyService
   */
  static async createFamily(
    name: string,
    description: string = '',
    icon: string = 'home-heart'
  ): Promise<CreateFamilyResponse> {
    try {
      // Import here to avoid module resolution issues
      const FamilyService = (await import('../services/FamilyService')).default;
      const result = await FamilyService.createFamily(name, description, icon);
      return {
        success: true,
        familyId: result.familyId,
        family: result.family,
        inviteCode: result.inviteCode,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tạo gia đình',
      };
    }
  }

  /**
   * Fetch all families for current user
   */
  static async fetchFamilies(): Promise<FetchFamiliesResponse> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      const families = await FamilyService.getUserFamilies();
      return {
        success: true,
        families,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tải gia đình',
      };
    }
  }

  /**
   * Get family by ID
   */
  static async getFamilyById(familyId: string): Promise<CreateFamilyResponse> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      const family = await FamilyService.getFamilyById(familyId);
      return {
        success: true,
        family,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Không tìm thấy gia đình',
      };
    }
  }

  /**
   * Update family information
   */
  static async updateFamily(
    familyId: string,
    updates: Partial<any>
  ): Promise<UpdateFamilyResponse> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      const family = await FamilyService.updateFamily(familyId, updates);
      return {
        success: true,
        family,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi cập nhật gia đình',
      };
    }
  }

  /**
   * Add member to family by invite code
   */
  static async addMemberByInviteCode(
    inviteCode: string
  ): Promise<AddMemberResponse> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      const member = await FamilyService.addMemberByInviteCode(inviteCode);
      return {
        success: true,
        member,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Mã mời không hợp lệ',
      };
    }
  }

  /**
   * Remove member from family
   */
  static async removeMember(familyId: string, userId: string): Promise<any> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      await FamilyService.removeMember(familyId, userId);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi xóa thành viên',
      };
    }
  }

  /**
   * Delete family
   */
  static async deleteFamily(familyId: string): Promise<any> {
    try {
      const FamilyService = (await import('../services/FamilyService')).default;
      await FamilyService.deleteFamily(familyId);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi xóa gia đình',
      };
    }
  }
}

export default FamilyApi;
