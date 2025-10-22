import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

interface PendingInvitation {
  id: string;
  inviteCode: string;
  email?: string;
  phone?: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
}

const SHARE_METHODS = [
  { key: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
  { key: 'messenger', name: 'Messenger', icon: '📧', color: '#0084FF' },
  { key: 'sms', name: 'Tin nhắn', icon: '💬', color: '#34C759' },
  { key: 'email', name: 'Email', icon: '✉️', color: '#007AFF' },
  { key: 'copy', name: 'Sao chép', icon: '📋', color: '#6366F1' },
];

export default function InviteMemberScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [currentInviteCode] = useState('FAMILY123456'); // Mock invite code
  const [familyInfo] = useState({
    name: 'Gia đình Nguyễn Văn A',
    memberCount: 3,
    admin: 'Nguyễn Văn A',
  });
  
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([
    {
      id: '1',
      inviteCode: 'FAM123',
      email: 'nguyen.thi.b@gmail.com',
      invitedAt: '2025-10-20T10:30:00Z',
      expiresAt: '2025-10-27T10:30:00Z',
      status: 'pending',
      invitedBy: 'Nguyễn Văn A',
    },
    {
      id: '2',
      inviteCode: 'FAM456',
      phone: '+84987654321',
      invitedAt: '2025-10-19T15:20:00Z',
      expiresAt: '2025-10-26T15:20:00Z',
      status: 'pending',
      invitedBy: 'Nguyễn Văn A',
    },
    {
      id: '3',
      inviteCode: 'FAM789',
      email: 'old.invite@gmail.com',
      invitedAt: '2025-10-10T09:15:00Z',
      expiresAt: '2025-10-17T09:15:00Z',
      status: 'expired',
      invitedBy: 'Nguyễn Văn A',
    },
  ]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const generateInviteLink = () => {
    return `https://assist-app.com/join/${currentInviteCode}`;
  };

  const generateInviteMessage = () => {
    return `🏠 Bạn được mời tham gia "${familyInfo.name}"!\n\n` +
           `👨‍👩‍👧‍👦 Hiện tại có ${familyInfo.memberCount} thành viên\n` +
           `👑 Quản trị viên: ${familyInfo.admin}\n\n` +
           `📱 Tải ứng dụng Assist và nhập mã: ${currentInviteCode}\n` +
           `🔗 Hoặc nhấn link: ${generateInviteLink()}\n\n` +
           `⏰ Mã có hiệu lực trong 7 ngày`;
  };

  const handleGenerateNewCode = () => {
    Alert.alert(
      'Tạo mã mời mới',
      'Mã mời cũ sẽ không còn hiệu lực. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo mới',
          onPress: () => {
            // Generate new code logic
            Alert.alert('Thành công', 'Đã tạo mã mời mới: ' + currentInviteCode);
          }
        }
      ]
    );
  };

  const handleShareVia = async (method: string) => {
    const message = generateInviteMessage();
    const link = generateInviteLink();
    const fullMessage = `${message}\n\nLink: ${link}`;

    try {
      switch (method) {
        case 'copy':
          await Clipboard.setString(fullMessage);
          Alert.alert('Đã sao chép', 'Tin nhắn mời đã được sao chép vào clipboard');
          break;
        
        case 'whatsapp':
          // In real app, would use Linking.openURL with WhatsApp deep link
          await Share.share({
            message: fullMessage,
            title: 'Mời tham gia gia đình',
          });
          break;
        
        case 'sms':
          // In real app, would use SMS library
          await Share.share({
            message: message,
            title: 'Mời tham gia gia đình',
          });
          break;
        
        case 'email':
          // In real app, would use email library
          await Share.share({
            message: `Chủ đề: Mời tham gia ${familyInfo.name}\n\n${message}`,
          });
          break;
        
        default:
          await Share.share({
            message: message,
            title: 'Mời tham gia gia đình',
          });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    const invite = pendingInvites.find(i => i.id === inviteId);
    if (!invite) return;

    Alert.alert(
      'Thu hồi lời mời',
      `Bạn có chắc chắn muốn thu hồi lời mời gửi đến ${invite.email || invite.phone}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: () => {
            setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
            Alert.alert('Thành công', 'Đã thu hồi lời mời');
          }
        }
      ]
    );
  };

  const handleResendInvite = (inviteId: string) => {
    const invite = pendingInvites.find(i => i.id === inviteId);
    if (!invite) return;

    Alert.alert(
      'Gửi lại lời mời',
      `Gửi lại lời mời đến ${invite.email || invite.phone}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi lại',
          onPress: () => {
            // Update expiry date
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 7);
            
            setPendingInvites(prev => prev.map(i => 
              i.id === inviteId 
                ? { ...i, expiresAt: newExpiryDate.toISOString(), status: 'pending' as const }
                : i
            ));
            
            Alert.alert('Thành công', 'Đã gửi lại lời mời');
          }
        }
      ]
    );
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Đã hết hạn';
    if (diffDays === 1) return 'Còn 1 ngày';
    return `Còn ${diffDays} ngày`;
  };

  const renderQRCode = () => (
    <View style={styles.qrContainer}>
      <View style={styles.qrCode}>
        {/* Mock QR Code - in real app, use QR code generation library */}
        <View style={styles.qrPattern}>
          {Array.from({ length: 25 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.qrDot,
                Math.random() > 0.5 && styles.qrDotFilled
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.qrText}>Quét mã để tham gia</Text>
      <Text style={styles.qrCode}>{currentInviteCode}</Text>
    </View>
  );

  const renderShareMethod = (method: typeof SHARE_METHODS[0]) => (
    <TouchableOpacity
      key={method.key}
      style={[styles.shareMethod, { borderColor: method.color }]}
      onPress={() => handleShareVia(method.key)}
    >
      <View style={[styles.shareIcon, { backgroundColor: `${method.color}20` }]}>
        <Text style={styles.shareIconText}>{method.icon}</Text>
      </View>
      <Text style={styles.shareMethodName}>{method.name}</Text>
    </TouchableOpacity>
  );

  const renderPendingInvite = (invite: PendingInvitation) => (
    <View key={invite.id} style={styles.inviteCard}>
      <View style={styles.inviteHeader}>
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteRecipient}>
            {invite.email || invite.phone || 'Không rõ'}
          </Text>
          <Text style={styles.inviteDate}>
            Gửi lúc: {new Date(invite.invitedAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        
        <View style={[
          styles.inviteStatus,
          invite.status === 'expired' ? styles.inviteStatusExpired : styles.inviteStatusPending
        ]}>
          <Text style={styles.inviteStatusText}>
            {invite.status === 'pending' ? 'Chờ phản hồi' : 'Hết hạn'}
          </Text>
        </View>
      </View>

      <View style={styles.inviteDetails}>
        <Text style={styles.inviteCode}>Mã: {invite.inviteCode}</Text>
        <Text style={[
          styles.inviteExpiry,
          invite.status === 'expired' ? styles.inviteExpiryExpired : styles.inviteExpiryPending
        ]}>
          {getTimeUntilExpiry(invite.expiresAt)}
        </Text>
      </View>

      <View style={styles.inviteActions}>
        {invite.status === 'pending' && (
          <TouchableOpacity
            style={[styles.inviteActionButton, styles.resendButton]}
            onPress={() => handleResendInvite(invite.id)}
          >
            <Text style={styles.resendButtonText}>Gửi lại</Text>
          </TouchableOpacity>
        )}
        
        {invite.status === 'expired' && (
          <TouchableOpacity
            style={[styles.inviteActionButton, styles.resendButton]}
            onPress={() => handleResendInvite(invite.id)}
          >
            <Text style={styles.resendButtonText}>Gia hạn</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.inviteActionButton, styles.revokeButton]}
          onPress={() => handleRevokeInvite(invite.id)}
        >
          <Text style={styles.revokeButtonText}>Thu hồi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mời thành viên</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleGenerateNewCode}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Family Info */}
        <View style={styles.familyCard}>
          <Text style={styles.familyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.familyName}>{familyInfo.name}</Text>
          <Text style={styles.familyDetails}>
            {familyInfo.memberCount} thành viên • Quản trị: {familyInfo.admin}
          </Text>
        </View>

        {/* Invite Code */}
        <View style={styles.inviteCodeCard}>
          <Text style={styles.sectionTitle}>Mã mời hiện tại</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.inviteCodeText}>{currentInviteCode}</Text>
            <TouchableOpacity
              style={styles.copyCodeButton}
              onPress={() => handleShareVia('copy')}
            >
              <Text style={styles.copyCodeText}>📋</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeExpiry}>Có hiệu lực trong 7 ngày</Text>
        </View>

        {/* QR Code Toggle */}
        <TouchableOpacity
          style={styles.qrToggleButton}
          onPress={() => setQrCodeVisible(!qrCodeVisible)}
        >
          <Text style={styles.qrToggleIcon}>📱</Text>
          <Text style={styles.qrToggleText}>
            {qrCodeVisible ? 'Ẩn mã QR' : 'Hiển thị mã QR'}
          </Text>
          <Text style={styles.qrToggleArrow}>
            {qrCodeVisible ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {qrCodeVisible && renderQRCode()}

        {/* Share Methods */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Chia sẻ lời mời</Text>
          <View style={styles.shareMethods}>
            {SHARE_METHODS.map(renderShareMethod)}
          </View>
        </View>

        {/* Pending Invitations */}
        <View style={styles.pendingSection}>
          <View style={styles.pendingSectionHeader}>
            <Text style={styles.sectionTitle}>Lời mời đang chờ</Text>
            <View style={styles.pendingCount}>
              <Text style={styles.pendingCountText}>
                {pendingInvites.filter(i => i.status === 'pending').length}
              </Text>
            </View>
          </View>
          
          {pendingInvites.length > 0 ? (
            pendingInvites.map(renderPendingInvite)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📤</Text>
              <Text style={styles.emptyStateText}>Chưa có lời mời nào</Text>
              <Text style={styles.emptyStateSubtext}>
                Gửi lời mời để thêm thành viên vào gia đình
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Mẹo</Text>
        <Text style={styles.tipsText}>
          Mã mời có hiệu lực 7 ngày. Bạn có thể tạo mã mới hoặc gia hạn lời mời cũ
        </Text>
      </View>

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  familyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 20,
  },
  familyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  familyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  familyDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  inviteCodeCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyCodeButton: {
    padding: 8,
  },
  copyCodeText: {
    fontSize: 20,
  },
  codeExpiry: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  qrToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 20,
  },
  qrToggleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  qrToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrToggleArrow: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 20,
  },
  qrCode: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    height: 120,
  },
  qrDot: {
    width: 8,
    height: 8,
    margin: 1,
    backgroundColor: 'transparent',
  },
  qrDotFilled: {
    backgroundColor: '#000000',
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  shareSection: {
    marginBottom: 32,
  },
  shareMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareMethod: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    minWidth: '30%',
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareIconText: {
    fontSize: 20,
  },
  shareMethodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pendingSection: {
    marginBottom: 32,
  },
  pendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pendingCount: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inviteCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 12,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteRecipient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inviteDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inviteStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inviteStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inviteDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inviteExpiry: {
    fontSize: 12,
    fontWeight: '500',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resendButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  revokeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 100,
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366F1',
    top: -100,
    right: -100,
  },
  inviteStatusExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inviteStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  inviteExpiryExpired: {
    color: '#EF4444',
  },
  inviteExpiryPending: {
    color: '#F59E0B',
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
});