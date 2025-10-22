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

export default function App() {
  React.useEffect(() => {
    configureGoogleSignIn();
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
