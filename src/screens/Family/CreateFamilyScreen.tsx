import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';

type Props = NativeStackScreenProps<RootStackParamList, "CreateFamily">;

const AVATAR_ICONS = [
  'home-heart',
  'family-tree',
  'people',
  'home-group',
  'heart-multiple',
  'account-multiple-plus',
];

export default function CreateFamilyScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);

  // Zustand store
  const createFamily = useFamilyStore((state) => state.createFamily);

  const [familyName, setFamilyName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(AVATAR_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!familyName.trim()) {
      newErrors.familyName = 'Vui lòng nhập tên gia đình';
    }
    if (familyName.trim().length < 2) {
      newErrors.familyName = 'Tên gia đình phải ít nhất 2 ký tự';
    }
    if (familyName.trim().length > 50) {
      newErrors.familyName = 'Tên gia đình không vượt quá 50 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateFamily = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Call Firebase service to create family
      const result = await createFamily(familyName, description, selectedIcon);

      Alert.alert(
        '✅ Thành công',
        `Tạo gia đình "${familyName}" thành công! 🎉\n\nMã mời: ${result.inviteCode}`,
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Mời thành viên',
            onPress: () => {
              // Navigate to InviteMemberScreen with family data
              navigation.replace('InviteMember', {
                familyId: result.familyId,
                inviteCode: result.inviteCode,
              } as any);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating family:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo gia đình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Computed styles to avoid inline style warnings
  const borderColorFamilyName = errors.familyName ? '#EF4444' : (theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
  const borderColorDescription = theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const bgInfoCard = theme.dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)';
  const borderColorInfoCard = theme.dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)';
  const opacityCreateButton = loading ? 0.6 : 1;
  const bgCancelButton = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,137,123,0.08)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            styles.backButtonBg,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Tạo gia đình</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Chọn biểu tượng</Text>
            <View style={styles.iconGrid}>
              {AVATAR_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                const borderColor = isSelected ? theme.colors.primary : (theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
                const borderWidth = isSelected ? 2 : 1;
                const iconColor = isSelected ? (theme.colors.onPrimary ?? '#fff') : theme.colors.onSurface;
                return (
                  <Pressable
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={({ pressed }) => [
                      styles.iconOption,
                      { borderColor, borderWidth },
                      pressed && styles.iconPressed,
                    ]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  >
                    <View style={[styles.iconBackground, isSelected && { backgroundColor: `${theme.colors.primary}22` }]} />
                    <Icon name={icon} size={40} color={iconColor} />
                  </Pressable>
                );
              })} 
            </View>
          </View>

          {/* Family Name Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.primary }]}>Tên gia đình</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: borderColorFamilyName,
                },
              ]}
            >
              <Icon name="home-heart" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.onSurface }]}
                placeholder="Nhập tên gia đình (ví dụ: Gia đình Nguyễn)"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={familyName}
                onChangeText={setFamilyName}
                maxLength={50}
                editable={!loading}
              />
              {familyName.length > 0 && (
                <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
                  {familyName.length}/50
                </Text>
              )}
            </View>
            {errors.familyName && (
              <Text style={styles.errorText}>{errors.familyName}</Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.primary }]}>Mô tả (tùy chọn)</Text>
            <View
              style={[
                styles.textareaWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: borderColorDescription,
                },
              ]}
            >
              <TextInput
                style={[styles.textarea, { color: theme.colors.onSurface }]}
                placeholder="Thêm mô tả về gia đình (ví dụ: Gia đình tôi, chia sẻ quản lý tài chính)"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>
            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
              {description.length}/200 ký tự
            </Text>
          </View>

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: bgInfoCard,
                borderColor: borderColorInfoCard,
              },
            ]}
          >
            <Icon name="information-outline" size={20} color={theme.colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Mẹo</Text>
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                Sau khi tạo, bạn có thể mời các thành viên khác bằng mã mời hoặc link chia sẻ.
              </Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Tính năng sẽ có</Text>
            <View style={styles.checklistItem}>
              <Icon name="check-circle" size={20} color={theme.colors.secondary} style={styles.checkIcon} />
              <Text style={[styles.checkText, { color: theme.colors.onSurface }]}>Quản lý tài chính chung</Text>
            </View>
            <View style={styles.checklistItem}>
              <Icon name="check-circle" size={20} color={theme.colors.secondary} style={styles.checkIcon} />
              <Text style={[styles.checkText, { color: theme.colors.onSurface }]}>Chia sẻ mục tiêu gia đình</Text>
            </View>
            <View style={styles.checklistItem}>
              <Icon name="check-circle" size={20} color={theme.colors.secondary} style={styles.checkIcon} />
              <Text style={[styles.checkText, { color: theme.colors.onSurface }]}>Chat gia đình và thông báo</Text>
            </View>
            <View style={styles.checklistItem}>
              <Icon name="check-circle" size={20} color={theme.colors.secondary} style={styles.checkIcon} />
              <Text style={[styles.checkText, { color: theme.colors.onSurface }]}>Quản lý quyền và vai trò</Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer (moved inside ScrollView) */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(16, insets.bottom),
            },
          ]}
        >
          <Pressable
            onPress={handleCreateFamily}
            disabled={loading}
            style={({ pressed }) => [
              styles.createButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: opacityCreateButton,
              },
              pressed && { opacity: 0.85 },
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="plus-circle" size={20} color="#fff" style={styles.createButtonIcon} />
                <Text style={styles.createButtonText}>Tạo gia đình</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: bgCancelButton,
              },
              pressed && { opacity: 0.75 },
            ]}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>Hủy</Text>
          </Pressable>
        </View>

        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonBg: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,137,123,0.08)',
    },
    backIcon: { fontSize: 20 },
    headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
    spacer: { width: 40 },
    content: { padding: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },

    /* Icon Selection */
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    iconOption: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    iconBackground: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
    },
    iconPressed: {
      transform: [{ scale: 0.97 }],
      opacity: 0.85,
    },

    /* Input Fields */
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderWidth: 1,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      padding: 0,
    },
    charCount: { fontSize: 12, marginLeft: 8 },

    textareaWrapper: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
    },
    textarea: {
      fontSize: 15,
      fontWeight: '500',
      textAlignVertical: 'top',
      padding: 0,
    },

    errorText: { fontSize: 13, color: '#EF4444', marginTop: 6 },
    helperText: { fontSize: 12, marginTop: 6 },

    /* Info Card */
    infoCard: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 14,
      marginBottom: 24,
      borderWidth: 1,
    },
    infoIcon: { marginRight: 12 },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    infoText: { fontSize: 13, lineHeight: 18 },

    /* Checklist */
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    checkIcon: { marginRight: 10 },
    checkText: { fontSize: 14, fontWeight: '600' },

    /* Footer */
    footer: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 4,
    },
    createButtonIcon: { marginRight: 8 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    cancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 12,
    },
    cancelButtonText: { fontSize: 15, fontWeight: '700' },
  });
