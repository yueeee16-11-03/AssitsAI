/**
 * CreateSharedWalletScreen.tsx
 * Screen để tạo ví chung với form đầy đủ
 * - Kiểm soát quyền (chỉ Owner/Admin)
 * - Input: tên, loại tiền, quy tắc chi tiêu
 * - Validation & backend integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from '../../store/familyStore';
import SharedWalletApi from '../../api/sharedWalletApi';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSharedWallet'>;

export default function CreateSharedWalletScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { currentFamily } = useFamilyStore();

  const [fadeAnim] = useState(new Animated.Value(0));

  // Form state
  const [walletName, setWalletName] = useState('');
  const [walletDescription, setWalletDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [currencyType, setCurrencyType] = useState('VND');

  // Quy tắc chi tiêu
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [hasDailyLimit, setHasDailyLimit] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');

  // Loading & validation
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Permission check
  useEffect(() => {
    const currentUser = auth().currentUser;
    const isOwner = currentFamily?.ownerId === currentUser?.uid;

    if (!isOwner) {
      Alert.alert(
        'Quyền hạn chế',
        'Chỉ chủ gia đình mới có thể tạo ví chung.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [currentFamily, navigation]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!walletName.trim()) {
      newErrors.walletName = 'Tên ví không được để trống';
    }
    if (walletName.trim().length < 3) {
      newErrors.walletName = 'Tên ví phải ít nhất 3 ký tự';
    }
    if (walletName.trim().length > 50) {
      newErrors.walletName = 'Tên ví không được vượt quá 50 ký tự';
    }

    if (hasDailyLimit) {
      if (!dailyLimit.trim()) {
        newErrors.dailyLimit = 'Vui lòng nhập hạn mức hàng ngày';
      } else if (isNaN(Number(dailyLimit)) || Number(dailyLimit) <= 0) {
        newErrors.dailyLimit = 'Hạn mức phải là số dương';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create wallet
  const handleCreateWallet = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentFamily?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy gia đình');
      return;
    }

    setIsLoading(true);
    try {
      const response = await SharedWalletApi.createSharedWallet(
        currentFamily.id,
        {
          name: walletName.trim(),
          currency: currencyType,
          // Quy tắc chi tiêu
          spendingRules: {
            requiresApproval,
            hasDailyLimit,
            dailyLimit: hasDailyLimit ? Number(dailyLimit) : 0,
          },
        }
      );

      if (response.success) {
        Alert.alert('Thành công', `Tạo ví "${walletName}" thành công!`, [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.error || 'Không thể tạo ví');
      }
    } catch (error: any) {
      console.error('Lỗi tạo ví:', error);
      Alert.alert('Lỗi', 'Lỗi tạo ví. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const iconOptions = [
    'wallet',
    'silverware-fork-knife',
    'lightbulb',
    'home',
    'car',
    'dumbbell',
    'book',
    'shopping',
    'hospital-box',
  ];
  const colorOptions = [
    '#6366F1',
    '#F59E0B',
    '#10B981',
    '#EC4899',
    '#8B5CF6',
    '#06B6D4',
    '#EF4444',
    '#14B8A6',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tạo Ví Chung</Text>
          <Text style={styles.headerSubtitle}>Quản lý chi tiêu gia đình</Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleCreateWallet}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Tên Ví */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông Tin Cơ Bản</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên ví *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.walletName && styles.inputError,
                  { borderColor: theme.colors.outline },
                ]}
                placeholder="VD: Chi tiêu gia đình"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={walletName}
                onChangeText={setWalletName}
                editable={!isLoading}
              />
              {errors.walletName && (
                <Text style={styles.errorText}>{errors.walletName}</Text>
              )}
              <Text style={styles.helperText}>
                {walletName.length}/50 ký tự
              </Text>
            </View>

            {/* Mô Tả */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  { borderColor: theme.colors.outline },
                ]}
                placeholder="Mô tả ví chung này"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={walletDescription}
                onChangeText={setWalletDescription}
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>

            {/* Loại Tiền */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại Tiền</Text>
              <View style={styles.currencyOptions}>
                {['VND', 'USD', 'EUR'].map((currency) => (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.currencyBtn,
                      currencyType === currency && styles.currencyBtnActive,
                    ]}
                    onPress={() => setCurrencyType(currency)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.currencyBtnText,
                        currencyType === currency &&
                          styles.currencyBtnTextActive,
                      ]}
                    >
                      {currency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Biểu Tượng & Màu Sắc */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giao Diện</Text>

            {/* Icon Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Biểu Tượng</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && [
                        styles.iconOptionSelected,
                        { backgroundColor: theme.colors.primary },
                      ],
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    disabled={isLoading}
                  >
                    <Icon
                      name={icon as any}
                      size={28}
                      color={
                        selectedIcon === icon ? '#FFFFFF' : theme.colors.primary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Màu Sắc</Text>
              <View style={styles.colorGrid}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    disabled={isLoading}
                  >
                    {selectedColor === color && (
                      <Icon name="check" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Quy Tắc Chi Tiêu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quy Tắc Chi Tiêu</Text>

            {/* Yêu cầu duyệt */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleLeft}>
                <Icon
                  name="check-circle-outline"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.ruleIcon}
                />
                <View>
                  <Text style={styles.ruleTitle}>Yêu cầu duyệt giao dịch</Text>
                  <Text style={styles.ruleDesc}>
                    Giao dịch cần được chủ nhóm phê duyệt
                  </Text>
                </View>
              </View>
              <Switch
                value={requiresApproval}
                onValueChange={setRequiresApproval}
                disabled={isLoading}
                trackColor={{
                  false: '#ccc',
                  true: theme.colors.primary,
                }}
              />
            </View>

            {/* Hạn mức hàng ngày */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleLeft}>
                <Icon
                  name="calendar"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.ruleIcon}
                />
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>Hạn mức hàng ngày</Text>
                  <Text style={styles.ruleDesc}>
                    Giới hạn chi tiêu mỗi ngày
                  </Text>
                </View>
              </View>
              <Switch
                value={hasDailyLimit}
                onValueChange={setHasDailyLimit}
                disabled={isLoading}
                trackColor={{
                  false: '#ccc',
                  true: theme.colors.primary,
                }}
              />
            </View>

            {/* Daily Limit Input */}
            {hasDailyLimit && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Hạn mức mỗi ngày</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithUnitField,
                      errors.dailyLimit && styles.inputError,
                      { borderColor: theme.colors.outline },
                    ]}
                    placeholder="Nhập số tiền"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={dailyLimit}
                    onChangeText={setDailyLimit}
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                  />
                  <Text style={styles.inputUnit}>{currencyType}</Text>
                </View>
                {errors.dailyLimit && (
                  <Text style={styles.errorText}>{errors.dailyLimit}</Text>
                )}
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Icon
                name="information"
                size={20}
                color={theme.colors.primary}
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>💡 Mẹo</Text>
                <Text style={styles.infoText}>
                  Bạn có thể chỉnh sửa các quy tắc này sau khi tạo ví
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createBtn, isLoading && styles.createBtnDisabled]}
          onPress={handleCreateWallet}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="content-save" size={18} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.createBtnText}>Lưu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
      paddingTop: 48,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    saveButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    saveText: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    content: {
      padding: 16,
      paddingBottom: 140,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surface,
    },
    inputError: {
      borderColor: '#EF4444 !important',
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      marginTop: 4,
    },
    helperText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    currencyOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    currencyBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    currencyBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    currencyBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    currencyBtnTextActive: {
      color: '#FFFFFF',
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    iconOption: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    iconOptionSelected: {
      borderWidth: 2,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: theme.colors.onSurface,
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },
    ruleLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    ruleContent: {
      flex: 1,
    },
    ruleIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    ruleTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    ruleDesc: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    inputWithUnit: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputWithUnitField: {
      flex: 1,
      marginRight: 8,
    },
    inputUnit: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      minWidth: 50,
      textAlign: 'center',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.dark
        ? 'rgba(99, 102, 241, 0.1)'
        : 'rgba(99, 102, 241, 0.05)',
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      marginTop: 8,
    },
    infoIcon: {
      marginRight: 10,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    createBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createBtnDisabled: {
      opacity: 0.6,
    },
    createBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    btnIcon: {
      marginRight: 6,
    },
  });
