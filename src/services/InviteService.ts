/**
 * InviteService.ts
 * Service layer for family invite operations
 * Handles invite code generation, sharing, and deep linking
 */

import { Linking, Share } from 'react-native';
import RNShare from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface InviteLink {
  code: string;
  webLink: string;
  deepLink: string;
  message: string;
}

class InviteService {
  private getFamiliesRef() {
    return firestore().collection('families');
  }

  private getCurrentUser() {
    const user = auth().currentUser;
    if (!user) throw new Error('Vui lòng đăng nhập để tiếp tục');
    return user;
  }

  /**
   * Rotate/Generate new invite code for a family
   * Only owner can do this
   */
  async rotateInviteCode(familyId: string): Promise<string> {
    const user = this.getCurrentUser();
    
    // Get family to check owner
    const familyDoc = await this.getFamiliesRef().doc(familyId).get();
    if (!familyDoc.exists) {
      throw new Error('Gia đình không tồn tại');
    }

    const familyData = familyDoc.data() as any;
    if (familyData.ownerId !== user.uid) {
      throw new Error('Chỉ chủ nhóm mới có thể tạo mã mới');
    }

    const newCode = this.generateInviteCode();

    await this.getFamiliesRef().doc(familyId).update({
      inviteCode: newCode,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return newCode;
  }

  /**
   * Generate a random 6-character invite code
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Build invite links and message
   */
  buildInviteLink(inviteCode: string, familyName: string): InviteLink {
    const webLink = `https://assist-app.com/join/${inviteCode}`;
    const deepLink = `assist-app://join/${inviteCode}`;
    const message = `🏠 Bạn được mời tham gia gia đình "${familyName}"!\n\n` +
                   `📱 Tải ứng dụng Assist và nhập mã: ${inviteCode}\n` +
                   `🔗 Hoặc nhấn link: ${webLink}\n\n` +
                   `⏰ Mã có hiệu lực trong 7 ngày`;

    return {
      code: inviteCode,
      webLink,
      deepLink,
      message,
    };
  }

  /**
   * Share via WhatsApp
   */
  private _lastShareAt = 0;

  private _isRecentShare() {
    const now = Date.now();
    if (now - this._lastShareAt < 1000) return true; // ignore if last share within 1s
    this._lastShareAt = now;
    return false;
  }

  async shareViaWhatsApp(message: string): Promise<void> {
    if (this._isRecentShare()) return;

    // Use RNShare social option which is usually more reliable than multiple fallbacks
    try {
      await RNShare.open({
        social: (RNShare as any).Social?.WHATSAPP || undefined,
        message,
        title: 'Mời tham gia gia đình Assist',
      } as any);
      return;
    } catch (error: any) {
      // If the social share failed, try a simple share
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled WhatsApp share');
        return;
      }
      console.warn('WhatsApp RNShare failed, falling back to Share API:', error);
    }

    try {
      await Share.share({ message, title: 'Mời tham gia gia đình' });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('WhatsApp final share failed:', error);
    }
  }

  /**
   * Share via Messenger
   */
  async shareViaMessenger(link: string, message: string): Promise<void> {
    if (this._isRecentShare()) return;

    try {
      // Prefer RNShare social messenger if available
      await RNShare.open({
        social: (RNShare as any).Social?.MESSENGER || undefined,
        url: link,
        message,
        title: 'Mời tham gia gia đình Assist',
      } as any);
      return;
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled Messenger share');
        return;
      }
      console.warn('Messenger RNShare failed, falling back to Share API:', error);
    }

    try {
      await Share.share({ message: `${message}\n${link}`, title: 'Mời tham gia gia đình' });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('Messenger final share failed:', error);
    }
  }

  /**
   * Share via Zalo
   * Zalo scheme: zalo://send?text=... or zalo://send?phone=...
   */
  async shareViaTikTok(message: string): Promise<void> {
    if (this._isRecentShare()) return;

    try {
      await RNShare.open({ message, title: 'Mời tham gia gia đình Assist' } as any);
      return;
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled TikTok share');
        return;
      }
      console.warn('TikTok RNShare failed, falling back to Share API:', error);
    }

    try {
      await Share.share({ message, title: 'Mời tham gia gia đình' });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('TikTok final share failed:', error);
    }
  }

  async shareViaZalo(message: string): Promise<void> {
    if (this._isRecentShare()) return;

    try {
      await RNShare.open({ message, title: 'Mời tham gia gia đình Assist' });
      return;
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled Zalo share');
        return;
      }
      console.warn('Zalo RNShare failed, falling back to Share API:', error);
    }

    try {
      await Share.share({ message, title: 'Mời tham gia gia đình' });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('Zalo final share failed:', error);
    }
  }

  /**
   * Share via SMS
   * SMS URI: sms:?body=...
   */
  async shareViaSMS(message: string): Promise<void> {
    try {
      // Try SMS native scheme
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:?body=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        try {
          await Linking.openURL(smsUrl);
          return;
        } catch (error) {
          console.warn('SMS native open failed:', error);
        }
      }
    } catch (error) {
      console.warn('SMS native check failed:', error);
    }

    // Fallback to react-native-share
    try {
      await RNShare.open({
        message,
        title: 'Mời tham gia gia đình Assist',
      });
      return;
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled SMS share');
        return;
      }
      console.warn('SMS RNShare failed:', error);
    }

    // Final fallback to Share API
    try {
      await Share.share({
        message,
        title: 'Mời tham gia gia đình',
      });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('SMS final share failed:', error);
    }
  }

  /**
   * Share via Email
   * mailto: URI
   */
  async shareViaEmail(familyName: string, message: string): Promise<void> {
    const subject = `Mời tham gia gia đình "${familyName}"`;
    const body = message;

    try {
      // Try native email scheme
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        try {
          await Linking.openURL(mailtoUrl);
          return;
        } catch (error) {
          console.warn('Email native open failed:', error);
        }
      }
    } catch (error) {
      console.warn('Email native check failed:', error);
    }

    // Fallback to react-native-share
    try {
      await RNShare.open({
        message: body,
        title: subject,
      });
      return;
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled Email share');
        return;
      }
      console.warn('Email RNShare failed:', error);
    }

    // Final fallback to Share API
    try {
      await Share.share({
        message: body,
        title: subject,
      });
    } catch (error: any) {
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        console.log('User cancelled share');
        return;
      }
      console.error('Email final share failed:', error);
    }
  }

  /**
   * Copy invite link to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setString(text);
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      throw new Error('Không thể sao chép vào clipboard');
    }
  }

  /**
   * Handle deep link to join family
   * Parse code from URL like: assist-app://join/ABC123
   */
  parseInviteCodeFromURL(url: string): string | null {
    try {
      // Try to match assist-app://join/CODE
      const appMatch = url.match(/assist-app:\/\/join\/([A-Z0-9-]+)/i);
      if (appMatch) return appMatch[1];

      // Try to match https://assist-app.com/join/CODE
      const webMatch = url.match(/\/join\/([A-Z0-9-]+)/i);
      if (webMatch) return webMatch[1];

      // Try to match raw 6-char code
      const rawMatch = url.match(/\b([A-Z0-9]{6})\b/i);
      if (rawMatch) return rawMatch[1].toUpperCase();

      return null;
    } catch (error) {
      console.error('Parse invite code error:', error);
      return null;
    }
  }

  /**
   * Read clipboard and try to extract an invite code or link
   */
  async parseInviteCodeFromClipboard(): Promise<string | null> {
    try {
      const text = await Clipboard.getString();
      if (!text) return null;
      // try parse as URL or raw code
      const code = this.parseInviteCodeFromURL(text);
      if (code) return code.toUpperCase();

      // fallback: raw 6-char code in clipboard
      const raw = text.match(/\b([A-Z0-9]{6})\b/i);
      if (raw) return raw[1].toUpperCase();

      return null;
    } catch (error) {
      console.error('Clipboard parse error:', error);
      return null;
    }
  }
}

export default new InviteService();
