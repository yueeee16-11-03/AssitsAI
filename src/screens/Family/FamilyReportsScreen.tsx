import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyReportsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Mock data
  const mockReports = [
    {
      id: '1',
      title: 'Báo cáo tài chính tháng 12',
      icon: 'file-chart',
      color: '#FF6B6B',
      date: '2024-12-27',
      description: 'Tổng quan chi tiêu, thu nhập và tiết kiệm',
    },
    {
      id: '2',
      title: 'Xu hướng chi tiêu',
      icon: 'trending-down',
      color: '#4ECDC4',
      date: '2024-12-25',
      description: 'So sánh chi tiêu 3 tháng gần nhất',
    },
    {
      id: '3',
      title: 'Phân tích danh mục',
      icon: 'chart-pie',
      color: '#FFD93D',
      date: '2024-12-20',
      description: 'Tỷ lệ chi tiêu theo từng danh mục',
    },
    {
      id: '4',
      title: 'Báo cáo thành viên',
      icon: 'account-multiple',
      color: '#6BCF7F',
      date: '2024-12-15',
      description: 'Chi tiêu và tiết kiệm của từng thành viên',
    },
    {
      id: '5',
      title: 'Mục tiêu tài chính',
      icon: 'target',
      color: '#95E1D3',
      date: '2024-12-10',
      description: 'Tiến độ hoàn thành các mục tiêu đặt ra',
    },
  ];

  const monthlyStats = {
    totalIncome: 45000000,
    totalExpense: 18000000,
    totalSaving: 27000000,
    savingRate: 60,
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
        <Text style={styles.headerTitle}>Báo cáo</Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Monthly Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tóm tắt tháng 12</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                  ₫{(monthlyStats.totalIncome / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Chi tiêu</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  ₫{(monthlyStats.totalExpense / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiết kiệm</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  ₫{(monthlyStats.totalSaving / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
            <View style={styles.savingRate}>
              <Text style={styles.savingRateLabel}>Tỷ lệ tiết kiệm:</Text>
              <Text style={[styles.savingRateValue, { color: theme.colors.secondary }]}>
                {monthlyStats.savingRate}%
              </Text>
            </View>
          </View>

          {/* Reports List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Báo cáo gần đây</Text>
            {mockReports.map((report) => (
              <Pressable
                key={report.id}
                style={styles.reportCard}
                onPress={() =>
                  Alert.alert(report.title, report.description)
                }
              >
                <View
                  style={[
                    styles.reportIcon,
                    { backgroundColor: `${report.color}20` },
                  ]}
                >
                  <Icon
                    name={report.icon}
                    size={28}
                    color={report.color}
                  />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportDescription}>
                    {report.description}
                  </Text>
                  <Text style={styles.reportDate}>{report.date}</Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ))}
          </View>

          {/* Export Button */}
          <Pressable style={styles.exportButton}>
            <Icon name="download" size={24} color="#FFFFFF" style={styles.exportIcon} />
            <Text style={styles.exportButtonText}>Xuất báo cáo</Text>
          </Pressable>
        </Animated.View>
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
    content: {
      flex: 1,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    savingRate: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    savingRateLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginRight: 8,
    },
    savingRateValue: {
      fontSize: 20,
      fontWeight: '800',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    reportCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    reportIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    reportInfo: {
      flex: 1,
    },
    reportTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    reportDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    reportDate: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    exportIcon: {
      marginRight: 4,
    },
    exportButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
