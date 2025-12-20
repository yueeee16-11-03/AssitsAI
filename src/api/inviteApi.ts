/**
 * inviteApi.ts
 * API layer for invite operations
 * Delegates to InviteService
 */

export interface RotateCodeResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export interface ShareResponse {
  success: boolean;
  error?: string;
}

class InviteApi {
  /**
   * Rotate invite code for a family
   */
  static async rotateInviteCode(familyId: string): Promise<RotateCodeResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      const code = await InviteService.rotateInviteCode(familyId);
      return {
        success: true,
        code,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi tạo mã mời mới',
      };
    }
  }

  /**
   * Build invite link and message
   */
  static async buildInviteLink(inviteCode: string, familyName: string) {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      const link = InviteService.buildInviteLink(inviteCode, familyName);
      return {
        success: true,
        link,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi xây dựng link mời',
      };
    }
  }

  /**
   * Share via WhatsApp
   */
  static async shareViaWhatsApp(message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaWhatsApp(message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua WhatsApp',
      };
    }
  }

  /**
   * Share via Messenger
   */
  static async shareViaMessenger(link: string, message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaMessenger(link, message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua Messenger',
      };
    }
  }

  /**
   * Share via Zalo
   */
  static async shareViaZalo(message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaZalo(message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua Zalo',
      };
    }
  }

  /**
   * Share via SMS
   */
  static async shareViaSMS(message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaSMS(message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua tin nhắn',
      };
    }
  }

  /**
   * Share via Email
   */
  static async shareViaEmail(familyName: string, message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaEmail(familyName, message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua email',
      };
    }
  }

  static async shareViaTikTok(message: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.shareViaTikTok(message);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi chia sẻ qua TikTok',
      };
    }
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<ShareResponse> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      await InviteService.copyToClipboard(text);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Lỗi sao chép',
      };
    }
  }

  /**
   * Parse invite code from URL
   */
  static async parseInviteCodeFromURL(url: string): Promise<{ success: boolean; code?: string }> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      const code = InviteService.parseInviteCodeFromURL(url);
      if (!code) {
        return { success: false };
      }
      return { success: true, code };
    } catch {
      return { success: false };
    }
  }

  /**
   * Parse invite code from clipboard (returns code or null)
   */
  static async parseInviteCodeFromClipboard(): Promise<{ success: boolean; code?: string }> {
    try {
      const InviteService = (await import('../services/InviteService')).default;
      const code = await InviteService.parseInviteCodeFromClipboard();
      if (!code) return { success: false };
      return { success: true, code };
    } catch {
      return { success: false };
    }
  }
}

export default InviteApi;
