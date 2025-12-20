import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { loginWithEmail, onGoogleButtonPress } from "../../services/AuthService";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [successAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleLogin = async () => {
    setErrors({ email: "", password: "" });

    let hasError = false;
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: "Vui lòng nhập email" }));
      hasError = true;
    } else if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Email không hợp lệ" }));
      hasError = true;
    }

    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: "Vui lòng nhập mật khẩu" }));
      hasError = true;
    } else if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: "Mật khẩu phải có ít nhất 6 ký tự" }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      // Gọi Firebase loginWithEmail
      await loginWithEmail(email.trim(), password);
      
      // show polished success UI then navigate
      setShowSuccess(true);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(successAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(async () => {
          setShowSuccess(false);
          const inviteStore = (await import('../../store/inviteStore')).useInviteStore;
          const pending = inviteStore.getState().pendingInviteCode;
          if (pending) {
            inviteStore.getState().setPendingInviteCode(null);
            navigation.replace('JoinFamily', { code: pending });
          } else {
            navigation.replace('Home');
          }
        });
      }, 900);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi đăng nhập", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await onGoogleButtonPress();
      setShowSuccess(true);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(successAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(async () => {
          setShowSuccess(false);
          const inviteStore = (await import('../../store/inviteStore')).useInviteStore;
          const pending = inviteStore.getState().pendingInviteCode;
          if (pending) {
            inviteStore.getState().setPendingInviteCode(null);
            navigation.replace('JoinFamily', { code: pending });
          } else {
            navigation.replace('Home');
          }
        });
      }, 900);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đăng nhập Google thất bại";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.gradientBackground}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(styles.scrollContent?.padding || 24, insets.bottom + TAB_BAR_HEIGHT) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>AI</Text>
              </View>
            </View>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>Đăng nhập để trải nghiệm AI Assistant</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="email-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email của bạn"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Mật khẩu"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors(prev => ({ ...prev, password: "" }));
                  }}
                  secureTextEntry
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert("Thông báo", "Tính năng quên mật khẩu đang được phát triển")}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#00897B" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                  <Text style={styles.loginButtonIcon}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleLoginButton onPress={handleGoogleLogin} disabled={loading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("Register")}
                disabled={loading}
              >
                <Text style={styles.registerText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        {/* Success overlay */}
        {showSuccess && (
          <Animated.View pointerEvents="none" style={[styles.successOverlay, { opacity: successAnim }]}>
            <Animated.View style={[styles.successCard, { transform: [{ scale: successAnim.interpolate({ inputRange: [0,1], outputRange: [0.96,1] }) }] } ]}>
              <Icon name="check-circle" size={40} color="#fff" />
              <Text style={styles.successTitle}>Đăng nhập thành công</Text>
              <Text style={styles.successSub}>Chào mừng bạn trở lại — đang chuyển hướng...</Text>
            </Animated.View>
          </Animated.View>
        )}
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circleTop: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.secondary,
    opacity: 0.15,
  },
  circleBottom: {
    position: "absolute",
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.colors.secondary,
    opacity: 0.10,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline || 'rgba(0,0,0,0.07)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.onSurfaceVariant,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 32,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 15,
  },
  registerText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  /* Success overlay */
  successOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  successCard: {
    width: 300,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  successTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 6 },
  successSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
});