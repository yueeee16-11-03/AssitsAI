import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportStore } from '../../store/reportStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryTransactions'>;

export default function CategoryTransactionsScreen({ navigation, route }: Props) {
  const { category, startDate, endDate } = route.params;
  const transactions = useReportStore(state => state.transactions);
  const formatCurrency = useReportStore(state => state.formatCurrency);

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const filtered = transactions.filter(tx => {
    if (tx.category !== category) return false;
    const date = tx.date?.toDate?.() || new Date(tx.date);
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#0F1724" />
        </TouchableOpacity>
        <Text style={styles.title}>Giao dịch: {category}</Text>
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
          ListEmptyComponent={() => (
            <View style={styles.empty}><Text>Không có giao dịch cho danh mục này trong khoảng thời gian đã chọn</Text></View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  content: { padding: 12, flex: 1 },
  count: { marginBottom: 8, color: '#374151' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  itemDesc: { fontSize: 14, color: '#0F1724' },
  itemDate: { fontSize: 12, color: '#6B7280' },
  itemAmount: { fontSize: 14, fontWeight: '600' },
  income: { color: '#10B981' },
  expense: { color: '#EF4444' },
  empty: { padding: 24, alignItems: 'center' },
});
