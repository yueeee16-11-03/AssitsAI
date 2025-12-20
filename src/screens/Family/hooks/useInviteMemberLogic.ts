/**
 * useInviteMemberLogic.ts
 * Custom hook tách logic ra khỏi UI component
 * Quản lý: permissions, invite codes, sharing, invitations
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { FamilyModel } from '../../../services/FamilyService';

interface UseInviteMemberLogicProps {
  currentFamily: FamilyModel | null;
  currentInviteCode: string;
  isLoading: boolean;
  error: string | null;
  rotateInviteCode: (familyId: string) => Promise<string | null>;
  shareViaMessenger: (link: string, message: string) => Promise<void>;
  shareViaZalo: (message: string) => Promise<void>;
  shareViaTikTok: (message: string) => Promise<void>;
  shareViaEmail: (familyName: string, message: string) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  fetchFamilyById: (familyId: string) => Promise<FamilyModel>;
  clearError: () => void;
}

interface InviteMemberLogicResult {
  // State
  currentUserUid: string | null;
  isOwner: boolean;
  
  // Handlers
  handleGenerateNewCode: () => void;
  handleShareVia: (method: string) => Promise<void>;
  handleCopyToClipboard: () => Promise<void>;
  
  // Helpers
  generateInviteLink: () => string;
  generateInviteMessage: (familyName: string) => string;
  checkOwnerPermission: () => boolean;
}

/**
 * Hook để quản lý toàn bộ logic của InviteMemberScreen
 * Tách business logic ra khỏi UI component
 */
export const useInviteMemberLogic = (props: UseInviteMemberLogicProps): InviteMemberLogicResult => {
  const {
    currentFamily,
    currentInviteCode,
    error,
    rotateInviteCode,
    shareViaMessenger,
    shareViaZalo,
    shareViaTikTok,
    shareViaEmail,
    copyToClipboard,
  } = props;

  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  /**
   * Kiểm tra và set owner status khi currentFamily thay đổi
   */
  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setCurrentUserUid(user.uid);
      const ownerStatus = currentFamily?.ownerId === user.uid;
      setIsOwner(ownerStatus);
    }
  }, [currentFamily?.id, currentFamily?.ownerId]);

  /**
   * Kiểm tra xem user có phải owner không
   */
  const checkOwnerPermission = (): boolean => {
    if (!isOwner) {
      Alert.alert('Không có quyền', 'Chỉ chủ nhóm mới có thể thực hiện hành động này.');
      return false;
    }
    return true;
  };

  /**
   * Tạo link mời từ invite code
   */
  const generateInviteLink = (): string => {
    if (!currentInviteCode) return '';
    return `https://assist-app.com/join/${currentInviteCode}`;
  };

  /**
   * Tạo message mời
   */
  const generateInviteMessage = (familyName: string): string => {
    if (!currentInviteCode) {
      return 'Vui lòng tạo mã mời trước khi chia sẻ';
    }
    const link = generateInviteLink();
    return (
      `🏠 Bạn được mời tham gia "${familyName}"!\n` +
      `Mã mời: ${currentInviteCode} (hiệu lực 7 ngày)\n` +
      `Mở app Assist → Tham gia gia đình → nhập mã để tham gia\n` +
      `Hoặc bấm link để tham gia:\n${link}`
    );
  };

  /**
   * Xử lý tạo mã mời mới
   */
  const handleGenerateNewCode = () => {
    if (!checkOwnerPermission()) return;

    if (!currentFamily?.id) {
      Alert.alert('Lỗi', 'Vui lòng chọn gia đình trước');
      return;
    }

    Alert.alert(
      'Tạo mã mời mới',
      'Mã mời cũ sẽ không còn hiệu lực. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo mới',
          onPress: async () => {
            if (!currentFamily?.id) {
              Alert.alert('Lỗi', 'Vui lòng chọn gia đình');
              return;
            }
            const newCode = await rotateInviteCode(currentFamily.id);
            if (newCode) {
              Alert.alert('Thành công', `Đã tạo mã mời mới: ${newCode}`);
            } else {
              Alert.alert('Lỗi', error || 'Không thể tạo mã mời mới');
            }
          },
        },
      ]
    );
  };

  /**
   * Xử lý sao chép link vào clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!checkOwnerPermission()) return;

    if (!currentInviteCode) {
      Alert.alert('Lỗi', 'Vui lòng tạo mã mời trước');
      return;
    }

    try {
      const link = generateInviteLink();
      await copyToClipboard(link);
      Alert.alert('Đã sao chép', 'Link mời đã được sao chép vào clipboard');
    } catch {
      Alert.alert('Lỗi', 'Không thể sao chép vào clipboard');
    }
  };

  /**
   * Xử lý chia sẻ lời mời qua các kênh khác nhau
   */
  const handleShareVia = async (method: string) => {
    if (!checkOwnerPermission()) return;

    if (!currentInviteCode) {
      Alert.alert('Lỗi', 'Vui lòng tạo mã mời trước');
      return;
    }

    if (!currentFamily?.name) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin gia đình');
      return;
    }

    const message = generateInviteMessage(currentFamily.name);
    const link = generateInviteLink();

    try {
      switch (method) {
        case 'copy':
          await handleCopyToClipboard();
          break;

        case 'messenger':
          await shareViaMessenger(link, message);
          break;

        case 'zalo':
          await shareViaZalo(message);
          break;

        case 'tiktok':
          await shareViaTikTok(message);
          break;

        case 'email':
          await shareViaEmail(currentFamily.name, message);
          break;

        default:
          Alert.alert('Lỗi', 'Phương thức chia sẻ không được hỗ trợ');
      }
    } catch (shareErr) {
      console.error('Share error:', shareErr);
      Alert.alert('Lỗi', 'Không thể chia sẻ. Vui lòng thử lại.');
    }
  };

  return {
    currentUserUid,
    isOwner,
    handleGenerateNewCode,
    handleShareVia,
    handleCopyToClipboard,
    generateInviteLink,
    generateInviteMessage,
    checkOwnerPermission,
  };
};
