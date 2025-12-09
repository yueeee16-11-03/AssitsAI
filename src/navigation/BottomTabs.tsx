import React from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainerRef } from '@react-navigation/native';

export default function BottomTabs({ navigationRef, currentRouteName, showFab = true, showSheet = true, overlay = false }: { navigationRef?: React.RefObject<NavigationContainerRef<any>>; currentRouteName?: string; showFab?: boolean; showSheet?: boolean; overlay?: boolean; }) {
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const sheetAnim = React.useRef(new Animated.Value(0)).current;
  const SHEET_HEIGHT = 260;

  const openBottomSheet = () => {
    if (!showSheet) return;
    setSheetVisible(true);
    Animated.timing(sheetAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const closeBottomSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setSheetVisible(false));
  };

  const chatPulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(chatPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(chatPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
    ])).start();
  }, [chatPulse]);

  // Hide bottom tabs on auth / core screens
  const hiddenRoutes = ['Splash', 'Onboarding', 'Login', 'Register', 'SetupProfile', 'UnlockApp', 'GeminiTest', 'AIChat', 'AddTransaction', 'AddIncome'];
  if (hiddenRoutes.includes(currentRouteName || '')) return null;

  return (
    <>
      <View style={[styles.bottomTabBarWrap, overlay && styles.bottomTabBarWrapOverlay]} pointerEvents="box-none">
        <View style={styles.tabBarBg} />
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('Home')}>
            <Icon name="home-outline" size={26} color="#6B7280" style={styles.tabIconBold} />
            <Text style={styles.tabLabelBold}>Trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('HabitDashboard')}>
            <Icon name="check-circle-outline" size={26} color="#6B7280" style={styles.tabIconBold} />
            <Text style={styles.tabLabelBold}>Thói quen</Text>
          </TouchableOpacity>

          <View style={styles.tabCenterPlaceholder} />

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('FinanceDashboard')}>
            <Icon name="wallet-outline" size={26} color="#6B7280" style={styles.tabIconBold} />
            <Text style={styles.tabLabelBold}>Tài chính</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('AIRecommendation')}>
            <Icon name="lightbulb-outline" size={26} color="#6B7280" style={styles.tabIconBold} />
            <Text style={styles.tabLabelBold}>Gợi ý</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.centerActionWrap, overlay && styles.centerActionWrapOverlay]} pointerEvents="box-none">
          <TouchableOpacity style={styles.centerActionButton} onPress={() => { if (showSheet) openBottomSheet(); else navigationRef?.current?.navigate('AddTransaction'); }} activeOpacity={0.9}>
            <Icon name="plus" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showFab && (
      <Animated.View style={[
        styles.fab,
        {
          transform: [{ scale: chatPulse.interpolate({ inputRange: [0,1], outputRange: [1,1.08] }) }],
        }
      ]}>
        <TouchableOpacity style={styles.fabButton} onPress={() => navigationRef?.current?.navigate('AIChat')} activeOpacity={0.85}>
          <Icon name="chat-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </Animated.View>
      )}

      {sheetVisible && showSheet && (
        <>
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheetOverlay} onPress={closeBottomSheet} />
          <Animated.View pointerEvents={sheetVisible ? 'auto' : 'none'} style={[
            styles.bottomSheet,
            { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT + 20, 0] }) }], opacity: sheetAnim },
          ]}>
            <View style={styles.bottomSheetHandleWrap} />
            <View style={styles.bottomSheetContent}>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddTransaction'); }} activeOpacity={0.85}>
                <View style={styles.sheetIcon}><Icon name="cash-minus" size={22} color="#FFFFFF" /></View>
                <Text style={styles.sheetText}>Thêm chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddIncome'); }} activeOpacity={0.85}>
                <View style={styles.sheetIcon}><Icon name="cash-plus" size={22} color="#FFFFFF" /></View>
                <Text style={styles.sheetText}>Thêm thu nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('Home', { openCamera: true }); }} activeOpacity={0.85}>
                <View style={styles.sheetIcon}><Icon name="qrcode-scan" size={22} color="#FFFFFF" /></View>
                <Text style={styles.sheetText}>Quét hóa đơn</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bottomTabBarWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', pointerEvents: 'box-none',
  },
  tabBarBg: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: '#FFFFFF', zIndex: 0 },
  bottomTabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 0, marginBottom: 0, borderRadius: 0, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, width: '100%'
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, minWidth: 60 },
  tabIconBold: { fontSize: 26, color: '#6B7280', fontWeight: 'bold' },
  tabLabelBold: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: 'bold', letterSpacing: 0.2 },
  tabCenterPlaceholder: { width: 70 },
  centerActionWrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center', pointerEvents: 'box-none' },
  centerActionButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 4, borderColor: '#FFFFFF' },
  bottomTabBarWrapOverlay: { zIndex: 9999, elevation: 9999 },
  centerActionWrapOverlay: { zIndex: 9999, elevation: 9999 },
  fab: { position: 'absolute', zIndex: 20, right: 24, bottom: 110, alignItems: 'center', justifyContent: 'center' },
  fabButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 3, borderColor: '#E0E7FF' },
  bottomSheetOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)', zIndex: 60 },
  bottomSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 18, paddingBottom: 28, paddingHorizontal: 18, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20, zIndex: 70 },
  bottomSheetHandleWrap: { alignItems: 'center', marginTop: 0 },
  bottomSheetContent: { marginTop: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  sheetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sheetText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
