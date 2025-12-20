/**
 * JoinFamilyScreen.tsx
 * Screen for joining a family by invite code or deep link
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinFamily'>;

export default function JoinFamilyScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);

  // Get params (code might come from deep link)
  const initialCode = (route.params as any)?.code || '';

  // Store
  const { addMemberByInviteCode, fetchFamilies } = useFamilyStore();

  // Local state
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode && !isLoading) {
      // Auto-join if code provided from deep link
      handleJoinFamily(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleJoinFamily = async (codeToJoin: string = inviteCode) => {
    if (!codeToJoin.trim()) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    if (codeToJoin.trim().length !== 6) {
      setError('Mã mời phải có 6 ký tự');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call store action to join family
      await addMemberByInviteCode(codeToJoin.toUpperCase());

      // Refresh families list
      await fetchFamilies();

      // Show success message
      Alert.alert(
        '✅ Thành công',
        'Bạn đã tham gia gia đình thành công!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Family Overview
              navigation.replace('FamilyOverview');
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Join family error:', err);
      setError(err.message || 'Mã mời không hợp lệ hoặc đã hết hạn');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tham gia gia đình</Text>
          <View style={styles.spacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Icon name="account-multiple-plus" size={64} color={theme.colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Tham gia gia đình</Text>
          <Text style={styles.subtitle}>
            Nhập mã mời mà bạn nhận được từ chủ nhóm
          </Text>

          {/* Error message */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.error }]}>
              <Icon
                name="alert-circle"
                size={20}
                color="#FFFFFF"
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Input field */}
          <Text style={styles.label}>Mã mời</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: error ? theme.colors.error : theme.colors.outline,
                color: theme.colors.onSurface,
              },
            ]}
            placeholder="VD: ABC123"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text.toUpperCase());
              setError(null);
            }}
            editable={!isLoading}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {/* Tips */}
          <View style={styles.tipsBox}>
            <Icon
              name="information"
              size={16}
              color={theme.colors.secondary}
              style={styles.tipsIcon}
            />
            <Text style={styles.tipsText}>
              Mã mời bao gồm 6 ký tự (chữ cái và số)
            </Text>
          </View>

          {/* Join button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: isLoading ? 0.6 : 1,
              } as any,
            ]}
            onPress={() => handleJoinFamily()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="check" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.joinButtonText}>Tham gia ngay</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Or divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
              hoặc
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          </View>

          {/* Open link button */}
          <TouchableOpacity
            style={[
              styles.linkButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => {
              Alert.alert(
                'Mở liên kết',
                'Tính năng này sẽ được hỗ trợ trong phiên bản tiếp theo'
              );
            }}
            disabled={isLoading}
          >
            <Icon name="link" size={20} color={theme.colors.primary} style={styles.buttonIcon} />
            <Text style={[styles.linkButtonText, { color: theme.colors.primary }]}>
              Mở liên kết mời
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
    marginBottom: 24,
  },
  tipsIcon: {
    marginRight: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.onSurface,
    lineHeight: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
