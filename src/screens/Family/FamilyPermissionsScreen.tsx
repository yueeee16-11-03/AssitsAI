import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { getFamilyPermissionColors } from '../../theme/familyPermissionColors';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyPermissionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const COLORS = getFamilyPermissionColors(theme);
  const styles = getStyles(theme, COLORS);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnims] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const menuItems = [
    { icon: 'chart-box', label: 'Tổng quan', screen: 'FamilyAdminDashboard' as const },
    { icon: 'account-group', label: 'Thành viên', screen: 'FamilyMembers' as const },
    { icon: 'wallet', label: 'Giao dịch', screen: 'FamilyTransactions' as const },
    { icon: 'tag', label: 'Danh mục', screen: 'FamilyCategories' as const },
    { icon: 'target', label: 'Ngân sách', screen: 'FamilyBudget' as const },
    { icon: 'trending-up', label: 'Báo cáo', screen: 'FamilyReports' as const },
    { icon: 'cog', label: 'Cài đặt gia đình', screen: 'FamilySettings' as const },
  ];

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen as any);
  };

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gia đình</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* ScrollView with Menu List */}
        <ScrollView
          style={styles.scrollViewWrapper}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 20,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          <View style={styles.familyMenuContainer}>
            {menuItems.map((item, index) => (
              <Animated.View
                key={index}
                style={{
                  transform: [{ scale: scaleAnims[index] }],
                }}
              >
                <Pressable
                  style={styles.familyMenuButton}
                  onPressIn={() => handlePressIn(index)}
                  onPressOut={() => handlePressOut(index)}
                  onPress={() => handleNavigate(item.screen)}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color={theme.colors.primary}
                    style={styles.menuIcon}
                  />
                  <Text style={styles.familyMenuLabel}>{item.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Decorative Elements */}
        <View pointerEvents="none" style={[styles.decorativeCircle, styles.decorativeCircle1]} />
        <View pointerEvents="none" style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    headerPlaceholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    scrollViewWrapper: {
      flex: 1,
      width: '100%',
    },
    familyMenuContainer: {
      gap: 12,
    },
    familyMenuButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    menuIcon: {
      marginRight: 20,
    },
    familyMenuLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 100,
      opacity: 0.1,
    },
    decorativeCircle1: {
      width: 200,
      height: 200,
      backgroundColor: colors.secondary,
      top: -100,
      right: -100,
    },
    decorativeCircle2: {
      width: 150,
      height: 150,
      backgroundColor: colors.accent,
      bottom: -75,
      left: -75,
    },
  });
