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
      } catch (error) {
        console.error("❌ [APP] Error during initialization:", error);
      }
    };

    initializeApp();
  }, [initializeCheckInStore, initializeHabitStore]);

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
