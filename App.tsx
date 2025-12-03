/**
 * Ứng dụng mẫu React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import AppNavigation from "./src/navigation";
import { configureGoogleSignIn } from './src/services/AuthService';
import { useCheckInStore } from './src/store/checkInStore';
import { useHabitStore } from './src/store/habitStore';
import notifee, { EventType } from '@notifee/react-native';
import NotificationApi from './src/api/notificationApi';
import NotificationService from './src/services/NotificationService';

export default function App() {
  // Store initialization
  const initializeCheckInStore = useCheckInStore((state) => state.initialize);
  const initializeHabitStore = useHabitStore((state) => state.initialize);

  React.useEffect(() => {
    const initializeApp = async () => {
      console.log("🚀 [APP] Initializing app stores...");
      
      try {
        // Configure Google Sign-In
        await configureGoogleSignIn();
        console.log("✅ [APP] Google Sign-In configured");

        // Initialize stores
        await Promise.all([
          initializeHabitStore(),
          initializeCheckInStore(),
        ]);
        console.log("✅ [APP] All stores initialized");
        // Schedule the daily streak reminder at 20:00 local time
        try {
          await NotificationService.requestPermission();
          await NotificationService.scheduleDailyStreakReminder({ hour: 20, minute: 0 });
          console.log('✅ [APP] Scheduled daily streak reminder');
        } catch (err) {
          console.warn('⚠️ [APP] Failed to schedule daily streak reminder', err);
        }
      } catch (error) {
        console.error("❌ [APP] Error during initialization:", error);
      }
    };

    initializeApp();
  }, [initializeCheckInStore, initializeHabitStore]);

  // Foreground event handler - called when notification is triggered/displayed while app is open
  React.useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      console.log('NotificationService: foreground event', type, detail);
      
      if (type === EventType.DELIVERED) {
        // Notification was delivered/displayed - save to Firebase
        try {
          const notification = detail.notification;
          if (notification) {
            await NotificationApi.createNotification({
              id: notification.id,
              title: notification.title || '',
              message: notification.body || '',
              type: 'reminder',
              icon: 'bell-outline',
              color: '#10B981',
              actionRoute: null,
            });
            console.log('NotificationService: persisted foreground notification', notification.id);
          }
        } catch (err) {
          console.warn('NotificationService: failed to persist foreground notification', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E27" />
      <SafeAreaView style={styles.container}>
        <AppNavigation />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E27",
  },
});
