import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import { FamilyCategory } from '../../services/admin/FamilyCategoryService';
import firestore from '@react-native-firebase/firestore';
import FamilyTransactionService from '../../services/admin/FamilyTransactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyCategoriesScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  // State
  const [categories, setCategories] = useState<FamilyCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<FamilyCategory[] | null>(null);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories (derive from users' transactions only — ignore defaults and mock data)
  const fetchCategories = React.useCallback(async () => {
    try {
      setError(null);
      if (!currentFamily?.id) {
        setError('Không tìm thấy gia đình');
        setLoading(false);
        return;
      }

      // Fetch family members -> map userId => name
      let members: Record<string, string> = {};
      try {
        const memberSnapshots = await firestore()
          .collection('family_members')
          .where('familyId', '==', currentFamily.id)
          .get({ source: 'server' });

        memberSnapshots.docs.forEach((doc) => {
          const memberData = doc.data() as any;
          if (memberData.userId) members[memberData.userId] = memberData.name || 'Unknown';
        });
        setMembersMap(members);
      } catch (memErr) {
        console.warn('Could not fetch family members for categories owner lookup', memErr);
      }

      // Fetch recent transactions for the family (server) and derive categories from them
      try {
        const txs = await FamilyTransactionService.getRecentTransactions(currentFamily.id, 1000);

        const normalize = (s: any) => {
          try {
            return String(s || '')
              .normalize('NFD')
              .replace(/\p{Extended_Pictographic}/gu, '') // remove emoji
              .replace(/[\u0300-\u036f]/g, '') // remove diacritics
              .toLowerCase()
              .trim();
          } catch {
            return String(s || '').toLowerCase().trim();
          }
        };

        const mapCategoryToColor = (category: string) => {
          const palette = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#06B6D4', '#F97316', '#8B5CF6', '#E11D48'];
          const n = normalize(category);
          if (!n) return palette[0];
          let sum = 0;
          for (let i = 0; i < n.length; i++) sum += n.charCodeAt(i);
          return palette[sum % palette.length];
        };

        const derivedMap: Record<string, any> = {};
        txs.forEach(tx => {
          const labelRaw = tx.category || '';
          const normalized = normalize(labelRaw);
          if (!normalized) return;
          if (!derivedMap[normalized]) {
            derivedMap[normalized] = {
              id: `derived_${normalized}`,
              familyId: currentFamily.id,
              name: String(labelRaw).toString().replace(/\p{Extended_Pictographic}/gu, '').trim() || String(labelRaw),
              type: tx.type || 'expense',
              icon: FamilyTransactionService.getTransactionIcon(tx.type || 'expense', String(labelRaw)),
              color: mapCategoryToColor(labelRaw),
              isDefault: false,
              createdBy: tx.userId,
              usageCount: 1,
            };
          } else {
            derivedMap[normalized].usageCount += 1;
          }
        });

        const derivedCategories: FamilyCategory[] = Object.values(derivedMap).map((d: any) => ({
          id: d.id,
          familyId: d.familyId,
          name: d.name,
          type: d.type,
          icon: d.icon,
          color: d.color,
          isDefault: false,
          createdBy: d.createdBy,
        }));

        // Use derived categories only (do not include service defaults)
        setCategories(derivedCategories);
        setOriginalCategories(derivedCategories);
      } catch (txErr) {
        console.warn('Could not fetch transactions to derive categories', txErr);
        // Fallback to empty list
        setCategories([]);
        setOriginalCategories([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(
        err instanceof Error ? err.message : 'Lỗi khi tải danh mục'
      );
      setLoading(false);
    }
  }, [currentFamily?.id]);

  // Initial load
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } catch (err) {
      console.error('Error refreshing categories:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Get type color
  const getTypeColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? theme.colors.secondary : '#EF4444';
  };

  // Helpers to get owner id/name (categories may store owner under different fields)
  const getCategoryOwnerId = (cat: any): string | undefined => {
    return (cat.ownerId || cat.createdBy || cat.createdById || cat.userId) as string | undefined;
  };

  const getCategoryOwnerName = (cat: any): string => {
    const ownerId = getCategoryOwnerId(cat);
    if (ownerId && membersMap[ownerId]) return membersMap[ownerId];
    if (cat.isDefault) return 'Chung';
    return 'Người dùng';
  };

  // Handle search
  const handleSearch = () => {
    Alert.prompt(
      'Tìm kiếm danh mục',
      'Nhập tên danh mục cần tìm',
      (text) => {
        if (!text || !text.trim()) return;
        const source = originalCategories ?? categories;
        const filtered = source.filter(cat =>
          cat.name.toLowerCase().includes(text.toLowerCase())
        );
        if (filtered.length === 0) {
          Alert.alert('Không tìm thấy', 'Không có danh mục nào khớp');
          return;
        }
        // Apply filtered results
        setCategories(filtered);
      },
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Danh mục</Text>
        <Pressable
          style={styles.addIconButton}
          onPress={() => Alert.alert('Thêm danh mục', 'Tạo danh mục mới')}
        >
          <Icon name="plus" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Đang tải danh mục...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchCategories}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Big search button (full width, above stats) */}
            <Pressable style={styles.searchBigButton} onPress={handleSearch}>
              <Icon name="magnify" size={18} color={theme.colors.primary} />
              <Text style={styles.searchBigText}>Tìm kiếm danh mục</Text>
            </Pressable>

            {/* Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <Text style={styles.statsTitle}>
                  Tổng số danh mục: {categories.length}
                </Text>
                <View style={styles.statsActions}>
                  {originalCategories && originalCategories.length !== categories.length && (
                    <Pressable
                      style={styles.clearButton}
                      onPress={() => {
                        setCategories(originalCategories);
                      }}
                    >
                      <Icon name="close" size={16} color={theme.colors.onSurfaceVariant} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View> 

            {/* Categories Grid */}
            <View style={styles.categoriesGrid}>
              {categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon
                    name="inbox-outline"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Chưa có danh mục nào
                  </Text>
                </View>
              ) : (
                categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[styles.categoryCard, { borderLeftColor: category.color }]}
                    onPress={() =>
                      Alert.alert(
                        category.name,
                        `Loại: ${category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}`
                      )
                    }
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: `${category.color}20` },
                      ]}
                    >
                      <Icon name={category.icon} size={32} color={category.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>

                      <View style={styles.ownerRow}>
                        <Icon name="account-circle" size={14} color={theme.colors.onSurfaceVariant} style={styles.ownerIcon} />
                        <Text style={[styles.ownerText, { color: theme.colors.onSurfaceVariant }]}>{getCategoryOwnerName(category)}</Text>
                        <View style={styles.flexSpacer} />
                        <View style={styles.typeRow}>
                          <Icon
                            name={category.type === 'income' ? 'wallet' : 'cash-remove'}
                            size={14}
                            color={getTypeColor(category.type)}
                            style={styles.typeIcon}
                          />
                          <Text style={[
                            styles.categoryType,
                            { color: getTypeColor(category.type) }
                          ]}>
                            {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            {/* Bottom spacer so scrolling to the end shows whitespace */}
            <View style={styles.bottomSpacer} />

          </Animated.View>
        )}
      </ScrollView>
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
      paddingHorizontal: 16,
      paddingBottom: 8,
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
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    spacer: {
      width: 40,
    },
    flexSpacer: {
      flex: 1,
    },
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    loadingText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 14,
      marginTop: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      fontWeight: '700',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      width: '100%',
    },
    emptyText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    statsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statsActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsSearchButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
    },
    clearButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
    },
    // Large search button above stats
    searchBigButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      marginBottom: 12,
      gap: 10,
    },
    searchBigText: {
      marginLeft: 8,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    addIconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0, 137, 123, 0.08)',
    },
    bottomSpacer: {
      height: 120,
    },
    categoriesGrid: {
      flexDirection: 'column',
      gap: 12,
      marginBottom: 20,
    },
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 4,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      borderTopWidth: 1,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      flexShrink: 0,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeIcon: {
      marginRight: 6,
    },
    categoryType: {
      fontSize: 12,
      fontWeight: '500',
    },
    ownerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    ownerIcon: {
      marginRight: 6,
    },
    ownerText: {
      fontSize: 12,
      fontWeight: '500',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    addIcon: {
      marginRight: 4,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
