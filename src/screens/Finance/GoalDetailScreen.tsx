import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalDetail'>;

export default function GoalDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const initial = route.params?.goal ?? null;
  const onSave = route.params?.onSave as ((g: any) => void) | undefined;

  const [goal, setGoal] = useState<any>(initial ? { ...initial } : null);
  const [addAmount, setAddAmount] = useState('');
  const [note, setNote] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState('');

  if (!goal) {
    return (
      <View style={styles.containerCentered}>
        <Text>Không tìm thấy mục tiêu</Text>
      </View>
    );
  }

  const formatVND = (v: number) => {
    if (!isFinite(v)) return '0 VNĐ';
    return `₫${v.toLocaleString('vi-VN')} VNĐ`;
  };

  const commitAddMoney = () => {
    const amt = Math.round(parseFloat(addAmount.replace(/[^0-9.-]/g, '')) || 0);
    if (amt <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
    const newTx = { id: Date.now().toString(), amount: amt, note: note || '', date: new Date().toISOString() };
    const updated = { ...goal, currentAmount: goal.currentAmount + amt, transactions: [newTx, ...(goal.transactions || [])] };
    setGoal(updated);
    onSave?.(updated);
    setAddAmount(''); setNote('');
    Alert.alert('Thành công', `Đã thêm ${formatVND(amt)} vào mục tiêu`);
  };

  const commitTx = () => {
    const amt = Math.round(parseFloat(txAmount.replace(/[^0-9.-]/g, '')) || 0);
    if (amt <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
    const d = txDate && /\d{4}-\d{2}-\d{2}/.test(txDate) ? txDate : new Date().toISOString();
    const newTx = { id: Date.now().toString(), amount: amt, note: txNote || '', date: d };
    const updated = { ...goal, currentAmount: goal.currentAmount + amt, transactions: [newTx, ...(goal.transactions || [])] };
    setGoal(updated);
    onSave?.(updated);
    setTxAmount(''); setTxNote(''); setTxDate('');
    Alert.alert('Thành công', `Đã thêm chi tiết ${formatVND(amt)}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết mục tiêu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <View style={[styles.iconWrap, { backgroundColor: `${goal.color}22` }]}>
              <Icon name={goal.icon || 'piggy-bank'} size={28} color="#6B7280" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.title}>{goal.title}</Text>
              <Text style={styles.sub}>{new Date(goal.deadline).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Hiện tại</Text>
              <Text style={styles.metricValue}>{formatVND(goal.currentAmount)}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Mục tiêu</Text>
              <Text style={styles.metricValue}>{formatVND(goal.targetAmount)}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Tiến độ</Text>
              <Text style={styles.metricValue}>{Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thêm tiền nhanh</Text>
            <TextInput value={addAmount} onChangeText={setAddAmount} placeholder="Số tiền (vd: 500000)" keyboardType="numeric" style={styles.input} placeholderTextColor="#6B7280" />
            <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú" style={[styles.input, styles.textArea]} placeholderTextColor="#6B7280" />
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={commitAddMoney}><Text style={styles.btnText}>Xác nhận thêm</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => { setAddAmount(''); setNote(''); }}><Text style={styles.btnGhostText}>Hủy</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thêm chi tiết giao dịch</Text>
            <TextInput value={txAmount} onChangeText={setTxAmount} placeholder="Số tiền (vd: 100000)" keyboardType="numeric" style={styles.input} placeholderTextColor="#6B7280" />
            <TextInput value={txDate} onChangeText={setTxDate} placeholder="Ngày (YYYY-MM-DD)" style={styles.input} placeholderTextColor="#6B7280" />
            <TextInput value={txNote} onChangeText={setTxNote} placeholder="Ghi chú" style={[styles.input, styles.textArea]} placeholderTextColor="#6B7280" />
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={commitTx}><Text style={styles.btnText}>Thêm chi tiết</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => { setTxAmount(''); setTxNote(''); setTxDate(''); }}><Text style={styles.btnGhostText}>Hủy</Text></TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
              {(goal.transactions || []).length === 0 ? (
                <Text style={styles.empty}>Chưa có giao dịch</Text>
              ) : (
                (goal.transactions || []).map((t: any) => (
                  <View key={t.id} style={styles.txRow}>
                    <View>
                      <Text style={styles.txAmt}>{formatVND(t.amount)}</Text>
                      <Text style={styles.txDate}>{t.date.split('T')[0]}</Text>
                    </View>
                    {t.note ? <Text style={styles.txNote}>{t.note}</Text> : null}
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  containerCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  metricCol: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 12, color: 'rgba(0,0,0,0.6)' },
  metricValue: { fontSize: 15, fontWeight: '900', marginTop: 6, color: '#111827' },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', marginBottom: 8 },
  textArea: { minHeight: 80 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#10B981' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnGhost: { backgroundColor: 'rgba(15,23,36,0.06)' },
  btnGhostText: { color: '#111827', fontWeight: '700' },
  empty: { color: 'rgba(0,0,0,0.5)', marginTop: 8 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  txAmt: { fontWeight: '800', color: '#111827' },
  txDate: { fontSize: 12, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  txNote: { color: 'rgba(0,0,0,0.7)', marginLeft: 12, maxWidth: 180, textAlign: 'right' },
});
