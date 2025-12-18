import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const slides = [
  {
    id: 1,
    title: "Trí tuệ nhân tạo\nthế hệ mới",
    description: "Trải nghiệm công nghệ AI tiên tiến nhất, giúp bạn giải quyết mọi vấn đề nhanh chóng",
    icon: "🤖",
    colorKey: "primary",
  },
  {
    id: 2,
    title: "Hỗ trợ 24/7\nmọi lúc mọi nơi",
    description: "Trợ lý AI luôn sẵn sàng phục vụ bạn bất cứ khi nào, bất cứ nơi đâu",
    icon: "💬",
    colorKey: "secondary",
  },
  {
    id: 3,
    title: "Bảo mật tuyệt đối\nvà riêng tư",
    description: "Dữ liệu của bạn được mã hóa và bảo vệ với tiêu chuẩn cao nhất",
    icon: "🔒",
    colorKey: "primary",
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  const getSlideColor = (colorKey: string) => {
    return colorKey === 'primary' ? theme.colors.primary : theme.colors.secondary;
  };

  const handleNext = React.useCallback(() => {
    if (currentIndex < slides.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate("Login");
    }
  }, [currentIndex, fadeAnim, navigation]);

  const handleSkip = React.useCallback(() => {
    navigation.navigate("Login");
  }, [navigation]);

  const currentSlide = slides[currentIndex];
  const slideColor = getSlideColor(currentSlide.colorKey);

  return (
    <View style={styles.container}>
      <View style={styles.gradientBackground}>
        <View style={[styles.circle, { backgroundColor: `${slideColor}33` }]} />
        <View style={[styles.circleSmall, { backgroundColor: `${slideColor}22` }]} />
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: `${slideColor}22` }]}>
            <Text style={styles.icon}>{currentSlide.icon}</Text>
          </View>
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                index === currentIndex && { backgroundColor: slideColor },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: slideColor }]}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? "Bắt đầu" : "Tiếp tục"}
            </Text>
            <Text style={styles.nextButtonIcon}>→</Text>
          </TouchableOpacity>

          {currentIndex === slides.length - 1 && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.9}
            >
              <Text style={styles.registerButtonText}>Đăng ký tài khoản mới</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2F1",
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    top: -200,
    right: -200,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  circleSmall: {
    position: "absolute",
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 24,
    padding: 12,
    zIndex: 10,
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 44,
    letterSpacing: -1,
  },
  description: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 32,
    borderRadius: 4,
  },
  buttonContainer: {
    gap: 16,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nextButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  registerButton: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(0, 137, 123, 0.1)",
    borderWidth: 1,
    borderColor: "#00897B",
    alignItems: "center",
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});