import React from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { NavigationContainerRef, NavigationContainerRefWithCurrent } from '@react-navigation/native';

export default function BottomTabs({ navigationRef, currentRouteName, showFab = true, showSheet = true, overlay = false }: { navigationRef?: React.RefObject<NavigationContainerRef<any>> | NavigationContainerRefWithCurrent<any>; currentRouteName?: string; showFab?: boolean; showSheet?: boolean; overlay?: boolean; }) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [scanOptionsVisible, setScanOptionsVisible] = React.useState(false);
  const sheetAnim = React.useRef(new Animated.Value(0)).current;
  const SHEET_HEIGHT = 260;

  const openBottomSheet = () => {
    if (!showSheet) return;
    setSheetVisible(true);
    Animated.timing(sheetAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const closeBottomSheet = () => {
    setScanOptionsVisible(false);
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
        <View style={[styles.bottomTabBar]}>
          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('Home')}>
            <Icon name="home-outline" size={26} color={currentRouteName === 'Home' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.tabIconBold} />
            <Text style={[styles.tabLabelBold, { color: currentRouteName === 'Home' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('HabitDashboard')}>
            <Icon name="check-circle-outline" size={26} color={currentRouteName === 'HabitDashboard' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.tabIconBold} />
            <Text style={[styles.tabLabelBold, { color: currentRouteName === 'HabitDashboard' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Thói quen</Text>
          </TouchableOpacity>

          <View style={styles.tabCenterPlaceholder} />

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('FinanceDashboard')}>
            <Icon name="wallet-outline" size={26} color={currentRouteName === 'FinanceDashboard' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.tabIconBold} />
            <Text style={[styles.tabLabelBold, { color: currentRouteName === 'FinanceDashboard' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Tài chính</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={() => navigationRef?.current?.navigate('AIRecommendation')}>
            <Icon name="lightbulb-outline" size={26} color={currentRouteName === 'AIRecommendation' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={styles.tabIconBold} />
            <Text style={[styles.tabLabelBold, { color: currentRouteName === 'AIRecommendation' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Gợi ý</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.centerActionWrap, overlay && styles.centerActionWrapOverlay]} pointerEvents="box-none">
          <TouchableOpacity style={[styles.centerActionButton]} onPress={() => { if (showSheet) openBottomSheet(); else navigationRef?.current?.navigate('AddTransaction'); }} activeOpacity={0.9}>
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
        <TouchableOpacity style={[styles.fabButton]} onPress={() => navigationRef?.current?.navigate('AIChat')} activeOpacity={0.85}>
          <Icon name="chat-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      )}

      {sheetVisible && showSheet && (
        <>
          <TouchableOpacity activeOpacity={1} style={[styles.bottomSheetOverlay, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.32)' }]} onPress={closeBottomSheet} />
          <Animated.View pointerEvents={sheetVisible ? 'auto' : 'none'} style={[
            styles.bottomSheet,
            { backgroundColor: theme.colors.surface, transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT + 20, 0] }) }], opacity: sheetAnim },
          ]}>
            <View style={styles.bottomSheetHandleWrap} />
            <View style={styles.bottomSheetContent}>
              {!scanOptionsVisible && (
                <>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddTransaction'); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIcon]}><Icon name="cash-minus" size={22} color="#FFFFFF" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Thêm chi tiêu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddIncome'); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIcon]}><Icon name="cash-plus" size={22} color="#FFFFFF" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Thêm thu nhập</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { setScanOptionsVisible(true); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIcon]}><Icon name="qrcode-scan" size={22} color="#FFFFFF" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Quét hóa đơn</Text>
                  </TouchableOpacity>
                </>
              )}
              {scanOptionsVisible && (
                <>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { setScanOptionsVisible(false); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIconMuted]}><Icon name="chevron-left" size={22} color="#10B981" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Quay lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddTransaction', { openCamera: true }); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIcon]}><Icon name="qrcode-scan" size={22} color="#FFFFFF" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Quét hóa đơn chi tiêu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} onPress={() => { closeBottomSheet(); navigationRef?.current?.navigate('AddIncome', { openCamera: true }); }} activeOpacity={0.85}>
                    <View style={[styles.sheetIcon]}><Icon name="qrcode-scan" size={22} color="#FFFFFF" /></View>
                    <Text style={[styles.sheetText, { color: theme.colors.onSurface }]}>Quét hóa đơn thu nhập</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </>
      )}
    </>
  );
}


const getStyles = (theme: any) => StyleSheet.create({
  bottomTabBarWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', pointerEvents: 'box-none',
  },
  tabBarBg: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: theme.colors.surface, zIndex: 0 },
  bottomTabBar: {
    flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: 0, marginBottom: 0, borderRadius: 0, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, width: '100%'
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, minWidth: 60 },
  tabIconBold: { fontSize: 26, fontWeight: 'bold' },
  tabLabelBold: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: 'bold', letterSpacing: 0.2 },
  tabCenterPlaceholder: { width: 70 },
  centerActionWrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center', pointerEvents: 'box-none' },
  centerActionButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, borderWidth: 3, borderColor: '#10B981' },
  bottomTabBarWrapOverlay: { zIndex: 9999, elevation: 9999 },
  centerActionWrapOverlay: { zIndex: 9999, elevation: 9999 },
  fab: { position: 'absolute', zIndex: 20, right: 24, bottom: 110, alignItems: 'center', justifyContent: 'center' },
  fabButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, borderWidth: 3, borderColor: '#06B6D4' },
  bottomSheetOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)', zIndex: 60 },
  bottomSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, backgroundColor: theme.colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 18, paddingBottom: 28, paddingHorizontal: 18, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 20, zIndex: 70 },
  bottomSheetHandleWrap: { alignItems: 'center', marginTop: 0 },
  bottomSheetContent: { marginTop: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
  sheetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: '#10B981' },
  sheetIconMuted: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: '#10B981' },
  sheetText: { color: theme.colors.onSurface, fontSize: 16, fontWeight: '700' },
});
