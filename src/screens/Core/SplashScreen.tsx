import React, { useEffect, useState } from "react";
import auth from '@react-native-firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [logoScale] = useState(new Animated.Value(0));
  const [logoRotate] = useState(new Animated.Value(0));
  const [textFade] = useState(new Animated.Value(0));
  const [progressWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Text fade in
    Animated.timing(textFade, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Progress bar
    Animated.timing(progressWidth, {
      toValue: width - 48,
      duration: 2500,
      delay: 500,
      useNativeDriver: false,
    }).start();

    // Navigate after animation — if user already authenticated, go Home
    const timer = setTimeout(() => {
      const current = auth().currentUser;
      if (current) {
        navigation.replace("Home");
      } else {
        navigation.replace("Onboarding");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, logoScale, logoRotate, textFade, progressWidth]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground}>
        <View style={styles.circleTop} />
        <View style={styles.circleMiddle} />
        <View style={styles.circleBottom} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }, { rotate: spin }],
            },
          ]}
        >
          <View style={[styles.logo, { backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)', borderColor: theme.dark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)' }]}>
            <Icon name="robot-outline" size={60} color={theme.colors.primary} />
          </View>
          <View style={[styles.logoRing, { borderColor: theme.dark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)' }]} />
          <View style={[styles.logoRingOuter, { borderColor: theme.dark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }]} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textFade }]}>
          <Text style={styles.title}>Assist AI</Text>
          <Text style={styles.subtitle}>Trợ lý thông minh của bạn</Text>
        </Animated.View>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>

      <Animated.Text style={[styles.footer, { opacity: textFade }]}>
        Powered by Advanced AI
      </Animated.Text>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circleTop: {
    position: "absolute",
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
  },
  circleMiddle: {
    position: "absolute",
    top: "40%",
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.dark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
  },
  circleBottom: {
    position: "absolute",
    bottom: -200,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 3,
    borderColor: "rgba(99, 102, 241, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: -2,
  },
  logoRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  logoRingOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: theme.colors.primary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  progressContainer: {
    width: width - 48,
    height: 4,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
});