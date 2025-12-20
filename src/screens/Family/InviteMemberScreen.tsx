import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import { useInviteStore } from '../../store/inviteStore';
import { useInviteMemberLogic } from './hooks/useInviteMemberLogic';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteMember'>;

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
  { key: 'messenger', name: 'Messenger', icon: 'facebook-messenger', color: '#0084FF' },
  { key: 'zalo', name: 'Zalo', icon: 'chat', color: '#0068FF' },
  { key: 'tiktok', name: 'TikTok', icon: 'music', color: '#25F4EE' },
  { key: 'email', name: 'Email', icon: 'email', color: '#007AFF' },
];

export default function InviteMemberScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const COLORS = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    text: theme.colors.onSurface || theme.colors.primary,
    danger: (theme.colors as any)?.error || '#EF4444',
    muted: theme.colors.onSurfaceVariant || 'rgba(255,255,255,0.6)',
  };

  const initialInviteCode = (route.params as any)?.inviteCode || '';
  const { currentFamily, fetchFamilyById } = useFamilyStore();
  const {
    currentInviteCode,
    isLoading,
    error,
    setCurrentInviteCode,
    setFamilyInfo,
    rotateInviteCode,
    shareViaMessenger: storeShareViaMessenger,
    shareViaZalo: storeShareViaZalo,
    shareViaTikTok: storeShareViaTikTok,
    shareViaEmail: storeShareViaEmail,
    copyToClipboard: storeCopyToClipboard,
    clearError,
  } = useInviteStore();

  // Wrap store functions to match expected return type Promise<void>
  const shareViaMessenger = async (link: string, message: string): Promise<void> => {
    await storeShareViaMessenger(link, message);
  };
  const shareViaZalo = async (message: string): Promise<void> => {
    await storeShareViaZalo(message);
  };
  const shareViaTikTok = async (message: string): Promise<void> => {
    await storeShareViaTikTok(message);
  };
  const shareViaEmail = async (familyName: string, message: string): Promise<void> => {
    await storeShareViaEmail(familyName, message);
  };
  const copyToClipboard = async (text: string): Promise<void> => {
    await storeCopyToClipboard(text);
  };

  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [permissionWarningStyle] = useState(() => ({
    backgroundColor: theme.dark
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(245, 158, 11, 0.1)',
  }));
  const [warningTitleStyle] = useState(() => ({
    color: '#F59E0B',
  }));

  // 🎯 Use custom logic hook - tách logic ra khỏi UI
  const {
    isOwner,
    handleGenerateNewCode,
    handleShareVia,
    handleCopyToClipboard,
  } = useInviteMemberLogic({
    currentFamily,
    currentInviteCode,
    isLoading,
    error,
    rotateInviteCode,
    shareViaMessenger,
    shareViaZalo,
    shareViaTikTok,
    shareViaEmail,
    copyToClipboard,
    fetchFamilyById,
    clearError,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    (async () => {
      if (currentFamily?.id) {
        setFamilyInfo(currentFamily.id, currentFamily.name || 'Gia đình');

        if (initialInviteCode) {
          setCurrentInviteCode(initialInviteCode);
          return;
        }

        if (currentFamily.inviteCode) {
          setCurrentInviteCode(currentFamily.inviteCode);
          return;
        }

        try {
          const fresh = await fetchFamilyById(currentFamily.id);
          if (fresh?.inviteCode) {
            setCurrentInviteCode(fresh.inviteCode);
          }
        } catch (err) {
          console.warn('Could not fetch family invite code:', err);
        }
      }
    })();
  }, [
    fadeAnim,
    currentFamily?.id,
    currentFamily?.name,
    currentFamily?.inviteCode,
    initialInviteCode,
    setCurrentInviteCode,
    setFamilyInfo,
    fetchFamilyById,
  ]);

  const familyInfo = {
    name: currentFamily?.name || 'Gia đình của bạn',
    memberCount: currentFamily?.members?.length || 0,
    admin: currentFamily?.ownerName || 'Bạn',
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

  // ============ RENDER HELPERS ============

  const renderQRCode = () => (
    <View style={styles.qrContainer}>
      <View style={styles.qrCode}>
        <View style={styles.qrPattern}>
          {Array.from({ length: 25 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.qrDot,
                Math.random() > 0.5 && styles.qrDotFilled,
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
        <Icon name={method.icon as any} size={20} color={method.color} />
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

        <View
          style={[
            styles.inviteStatus,
            invite.status === 'expired'
              ? styles.inviteStatusExpired
              : styles.inviteStatusPending,
          ]}
        >
          <Text style={styles.inviteStatusText}>
            {invite.status === 'pending' ? 'Chờ phản hồi' : 'Hết hạn'}
          </Text>
        </View>
      </View>

      <View style={styles.inviteDetails}>
        <Text style={styles.inviteCode}>Mã: {invite.inviteCode}</Text>
        <Text
          style={[
            styles.inviteExpiry,
            invite.status === 'expired'
              ? styles.inviteExpiryExpired
              : styles.inviteExpiryPending,
          ]}
        >
          {getTimeUntilExpiry(invite.expiresAt)}
        </Text>
      </View>

      <View style={styles.inviteActions}>
        {invite.status === 'pending' && (
          <TouchableOpacity
            style={[styles.inviteActionButton, styles.resendButton]}
            onPress={() => {
              const newExpiryDate = new Date();
              newExpiryDate.setDate(newExpiryDate.getDate() + 7);
              setPendingInvites((prev) =>
                prev.map((i) =>
                  i.id === invite.id
                    ? {
                        ...i,
                        expiresAt: newExpiryDate.toISOString(),
                        status: 'pending' as const,
                      }
                    : i
                )
              );
              Alert.alert('Thành công', 'Đã gửi lại lời mời');
            }}
          >
            <Text style={styles.resendButtonText}>Gửi lại</Text>
          </TouchableOpacity>
        )}

        {invite.status === 'expired' && (
          <TouchableOpacity
            style={[styles.inviteActionButton, styles.resendButton]}
            onPress={() => {
              const newExpiryDate = new Date();
              newExpiryDate.setDate(newExpiryDate.getDate() + 7);
              setPendingInvites((prev) =>
                prev.map((i) =>
                  i.id === invite.id
                    ? {
                        ...i,
                        expiresAt: newExpiryDate.toISOString(),
                        status: 'pending' as const,
                      }
                    : i
                )
              );
            }}
          >
            <Text style={styles.resendButtonText}>Gia hạn</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.inviteActionButton, styles.revokeButton]}
          onPress={() => {
            Alert.alert(
              'Thu hồi lời mời',
              `Bạn có chắc chắn muốn thu hồi lời mời gửi đến ${
                invite.email || invite.phone
              }?`,
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Thu hồi',
                  style: 'destructive',
                  onPress: () => {
                    setPendingInvites((prev) =>
                      prev.filter((i) => i.id !== invite.id)
                    );
                    Alert.alert('Thành công', 'Đã thu hồi lời mời');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.revokeButtonText}>Thu hồi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============ MAIN RENDER ============

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mời thành viên</Text>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              (isLoading || !isOwner) && styles.refreshButtonDisabled,
            ]}
            onPress={handleGenerateNewCode}
            disabled={isLoading || !isOwner}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.refreshButtonText, !isOwner && styles.refreshButtonDisabledText]}>
                🔄
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ERROR BANNER */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCROLLVIEW */}
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* PERMISSION WARNING */}
          {!isOwner && (
            <View
              style={[
                styles.permissionWarning,
                permissionWarningStyle,
              ]}
            >
              <Icon
                name="alert-circle"
                size={20}
                color="#F59E0B"
                style={styles.warningIcon}
              />
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, warningTitleStyle]}>
                  Quyền hạn chế
                </Text>
                <Text style={[styles.warningText, { color: theme.colors.onSurface }]}>
                  Bạn là thành viên. Chỉ chủ nhóm mới có thể mời thành viên mới.
                </Text>
              </View>
            </View>
          )}

          {/* FAMILY CARD */}
          <View style={styles.familyCard}>
            <Icon
              name="account-group"
              size={48}
              color={theme.colors.primary}
              style={styles.familyCardIcon}
            />
            <Text style={styles.familyName}>{familyInfo.name}</Text>
            <Text style={styles.familyDetails}>
              {familyInfo.memberCount} thành viên • Quản trị: {familyInfo.admin}
            </Text>
          </View>

          {/* INVITE CODE */}
          <View style={styles.inviteCodeCard}>
            <Text style={styles.sectionTitle}>Mã mời hiện tại</Text>
            <View style={styles.codeContainer}>
              <Text
                style={[
                  styles.inviteCodeText,
                  !currentInviteCode && styles.inviteCodePlaceholder,
                ]}
              >
                {currentInviteCode || 'Chưa có mã'}
              </Text>

              {currentInviteCode ? (
                <TouchableOpacity
                  style={styles.copyCodeButton}
                  onPress={() => handleCopyToClipboard()}
                >
                  <Icon
                    name="content-copy"
                    size={20}
                    color={
                      (theme.colors as any).onPrimaryContainer ??
                      (theme.dark ? '#FFFFFF' : theme.colors.onSurface)
                    }
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.codeExpiry}>Có hiệu lực trong 7 ngày</Text>
          </View>

          {/* QR CODE TOGGLE */}
          <TouchableOpacity
            style={styles.qrToggleButton}
            onPress={() => setQrCodeVisible(!qrCodeVisible)}
          >
            <Icon
              name="qrcode"
              size={20}
              color={theme.colors.primary}
              style={styles.qrToggleIcon}
            />
            <Text style={styles.qrToggleText}>
              {qrCodeVisible ? 'Ẩn mã QR' : 'Hiển thị mã QR'}
            </Text>
            <Text style={styles.qrToggleArrow}>{qrCodeVisible ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {qrCodeVisible && renderQRCode()}

          {/* SHARE METHODS - OWNER ONLY */}
          {isOwner && (
            <View style={styles.shareSection}>
              <Text style={styles.sectionTitle}>Chia sẻ lời mời</Text>
              <View style={styles.shareMethods}>
                {SHARE_METHODS.map(renderShareMethod)}
              </View>
            </View>
          )}

          {/* PENDING INVITATIONS - OWNER ONLY */}
          {isOwner && (
            <View style={styles.pendingSection}>
              <View style={styles.pendingSectionHeader}>
                <Text style={styles.sectionTitle}>Lời mời đang chờ</Text>
                <View style={styles.pendingCount}>
                  <Text style={styles.pendingCountText}>
                    {pendingInvites.filter((i) => i.status === 'pending').length}
                  </Text>
                </View>
              </View>

              {pendingInvites.length > 0 ? (
                pendingInvites.map(renderPendingInvite)
              ) : (
                <View style={styles.emptyState}>
                  <Icon
                    name="send"
                    size={48}
                    color={COLORS.secondary}
                    style={styles.emptyStateIcon}
                  />
                  <Text style={styles.emptyStateText}>Chưa có lời mời nào</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Gửi lời mời để thêm thành viên vào gia đình
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TIPS */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Icon
                name="lightbulb-on"
                size={14}
                color={theme.colors.secondary}
                style={styles.tipsIcon}
              />
              <Text style={styles.tipsTitle}>Mẹo</Text>
            </View>
            <Text style={styles.tipsText}>
              Mã mời có hiệu lực 7 ngày. Bạn có thể tạo mã mới hoặc gia hạn lời mời cũ
            </Text>
          </View>

          <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
        </ScrollView>

        {/* DECORATIVE ELEMENTS */}
        <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
        <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 20,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshButtonDisabled: {
      opacity: 0.6,
    },
    refreshButtonText: {
      fontSize: 18,
    },
    refreshButtonDisabledText: {
      opacity: 0.5,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    permissionWarning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    warningIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    warningContent: {
      flex: 1,
    },
    warningTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    warningText: {
      fontSize: 13,
      lineHeight: 18,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginTop: 8,
      borderRadius: 8,
    },
    errorBannerText: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      marginRight: 12,
    },
    errorBannerClose: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    familyCard: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    familyCardIcon: {
      marginBottom: 12,
    },
    familyName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    familyDetails: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    inviteCodeCard: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      minHeight: 56,
      borderRadius: 12,
      backgroundColor: (() => {
        const container = (theme.colors as any).primaryContainer;
        if (container) return container;
        const pri = theme.colors.primary;
        if (typeof pri === 'string' && pri.startsWith('#')) {
          let c = pri.replace('#', '');
          if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return theme.dark
            ? `rgba(${r}, ${g}, ${b}, 0.12)`
            : `rgba(${r}, ${g}, ${b}, 0.10)`;
        }
        return theme.dark ? 'rgba(16,24,40,0.6)' : '#111827';
      })(),
      borderWidth: 1,
      borderColor: (() => {
        const container = (theme.colors as any).primaryContainer;
        if (container) return container;
        const pri = theme.colors.primary;
        if (typeof pri === 'string' && pri.startsWith('#')) {
          let c = pri.replace('#', '');
          if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return theme.dark
            ? `rgba(${r}, ${g}, ${b}, 0.18)`
            : `rgba(${r}, ${g}, ${b}, 0.14)`;
        }
        return 'transparent';
      })(),
      marginBottom: 8,
      position: 'relative',
    },
    inviteCodeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: (() => {
        const onPri = (theme.colors as any).onPrimaryContainer;
        if (onPri) return onPri;
        return theme.dark ? '#FFFFFF' : theme.colors.onSurface;
      })(),
      letterSpacing: 2,
      flex: 1,
      textAlign: 'center',
    },
    inviteCodePlaceholder: {
      color: (() => {
        const onPri = (theme.colors as any).onPrimaryContainer;
        if (onPri && typeof onPri === 'string' && onPri.startsWith('#')) {
          let c = onPri.replace('#', '');
          if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, 0.6)`;
        }
        return theme.colors.onSurfaceVariant || 'rgba(255,255,255,0.6)';
      })(),
      fontWeight: '600',
    },
    copyCodeButton: {
      padding: 8,
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: [{ translateY: -10 }],
      zIndex: 2,
    },
    codeExpiry: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    qrToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    qrToggleIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    qrToggleText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    qrToggleArrow: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    qrContainer: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    qrCode: {
      width: 160,
      height: 160,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(99, 102, 241, 0.2)'
        : 'rgba(99, 102, 241, 0.1)',
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
      backgroundColor: theme.colors.onSurface,
    },
    qrText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
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
      backgroundColor: theme.colors.surface,
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
    shareMethodName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurface,
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
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
    },
    pendingCountText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.onPrimary || '#FFFFFF',
    },
    inviteCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
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
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    inviteDate: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
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
      color: theme.colors.onSurface,
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
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
      backgroundColor: theme.dark
        ? `${theme.colors.primary}30`
        : `${theme.colors.primary}15`,
    },
    resendButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    revokeButton: {
      backgroundColor: theme.dark
        ? `${theme.colors.error}30`
        : `${theme.colors.error}15`,
    },
    revokeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error || '#EF4444',
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
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    tipsCard: {
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: (() => {
        const container = (theme.colors as any).secondaryContainer;
        if (container) return container;
        const sec = theme.colors.secondary;
        if (typeof sec === 'string' && sec.startsWith('#')) {
          let c = sec.replace('#', '');
          if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return theme.dark
            ? `rgba(${r}, ${g}, ${b}, 0.12)`
            : `rgba(${r}, ${g}, ${b}, 0.08)`;
        }
        return theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
      })(),
      borderWidth: 1,
      borderColor: (() => {
        const container = (theme.colors as any).secondaryContainer;
        if (container) return container;
        const sec = theme.colors.secondary;
        if (typeof sec === 'string' && sec.startsWith('#')) {
          let c = sec.replace('#', '');
          if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
          const r = parseInt(c.substring(0, 2), 16);
          const g = parseInt(c.substring(2, 4), 16);
          const b = parseInt(c.substring(4, 6), 16);
          return theme.dark
            ? `rgba(${r}, ${g}, ${b}, 0.16)`
            : `rgba(${r}, ${g}, ${b}, 0.12)`;
        }
        return theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      })(),
    },
    tipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    tipsIcon: {
      marginRight: 6,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
      marginBottom: 4,
    },
    tipsText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      lineHeight: 16,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 100,
      opacity: theme.dark ? 0.08 : 0.05,
    },
    decorativeCircle1: {
      width: 200,
      height: 200,
      backgroundColor: theme.colors.primary,
      top: -100,
      right: -100,
    },
    inviteStatusExpired: {
      backgroundColor: theme.dark
        ? `${theme.colors.error}40`
        : `${theme.colors.error}20`,
    },
    inviteStatusPending: {
      backgroundColor: theme.dark
        ? 'rgba(245, 158, 11, 0.4)'
        : 'rgba(245, 158, 11, 0.2)',
    },
    inviteExpiryExpired: {
      color: theme.colors.error,
    },
    inviteExpiryPending: {
      color: '#F59E0B',
    },
    decorativeCircle2: {
      width: 150,
      height: 150,
      backgroundColor: theme.colors.secondary,
      bottom: -75,
      left: -75,
    },
  });
