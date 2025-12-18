import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useReportStore } from '../../store/reportStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryTransactions'>;

const EmptyTransactionsList = () => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.empty}>
      <Text style={styles.count}>Không có giao dịch trong khoảng thời gian đã chọn</Text>
    </View>
  );
};

export default function CategoryTransactionsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { category, startDate, endDate } = route.params;
  const transactions = useReportStore(state => state.transactions);
  const formatCurrency = useReportStore(state => state.formatCurrency);

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const filtered = transactions.filter(tx => {
    const date = tx.date?.toDate?.() || new Date(tx.date);
    if (start && date < start) return false;
    if (end && date > end) return false;
    if (category && category !== '' && tx.category !== category) return false;
    return true;
  });

  const title = category && category !== '' ? `Giao dịch: ${category}` : `Giao dịch (${start ? start.toLocaleDateString('vi-VN') : ''}${start && end ? ' - ' : ''}${end ? end.toLocaleDateString('vi-VN') : ''})`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.count}>{filtered.length} giao dịch</Text>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemDate}>{(item.date?.toDate ? item.date.toDate() : new Date(item.date)).toLocaleDateString('vi-VN')}</Text>
              </View>
              <Text style={[styles.itemAmount, item.type === 'income' ? styles.income : styles.expense]}> 
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          )}
          ListEmptyComponent={EmptyTransactionsList}
        />
      </View>
    </SafeAreaView>
  );
}

function getStyles(theme: any): any {
  const surface = theme.colors.surface;
  const onSurfaceVariant = theme.colors.onSurfaceVariant || '#9CA3AF';
  const outline = theme.colors.outline || 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
  container: { flex: 1, backgroundColor: surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: outline },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: onSurfaceVariant },
  content: { padding: 12, flex: 1 },
  count: { marginBottom: 8, color: onSurfaceVariant },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: outline },
  itemDesc: { fontSize: 14, color: onSurfaceVariant },
  itemDate: { fontSize: 12, color: onSurfaceVariant },
  itemAmount: { fontSize: 14, fontWeight: '600' },
  income: { color: '#10B981' },
  expense: { color: '#EF4444' },
  empty: { padding: 24, alignItems: 'center' },
  });
}
