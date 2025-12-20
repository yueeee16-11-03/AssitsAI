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
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { registerAndCreateProfile, onGoogleButtonPress } from "../../services/AuthService";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fadeAnim] = useState(new Animated.Value(0));

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

  const handleRegister = async () => {
    setErrors({ fullName: "", email: "", password: "", confirmPassword: "" });

    let hasError = false;

    if (!fullName.trim()) {
      setErrors(prev => ({ ...prev, fullName: "Vui lòng nhập họ và tên" }));
      hasError = true;
    } else if (fullName.trim().length < 3) {
      setErrors(prev => ({ ...prev, fullName: "Họ và tên phải có ít nhất 3 ký tự" }));
      hasError = true;
    }

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

    if (!confirmPassword.trim()) {
      setErrors(prev => ({ ...prev, confirmPassword: "Vui lòng xác nhận mật khẩu" }));
      hasError = true;
    } else if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Mật khẩu không khớp" }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      // Gọi Firebase registerAndCreateProfile
      await registerAndCreateProfile({
        email: email.trim(),
        password,
        name: fullName.trim(),
      });
      
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng hoàn tất hồ sơ.");
      navigation.replace("SetupProfile");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Không thể đăng ký. Vui lòng thử lại!";
      Alert.alert("Lỗi đăng ký", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await onGoogleButtonPress();
      Alert.alert("Thành công", "Đăng ký Google thành công!");
      navigation.replace("SetupProfile");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đăng ký Google thất bại";
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>AI</Text>
              </View>
            </View>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>Đăng ký để bắt đầu hành trình cùng AI</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="account" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Họ và tên"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setErrors(prev => ({ ...prev, fullName: "" }));
                  }}
                  style={[styles.input, errors.fullName ? styles.inputError : null]}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="email-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email của bạn"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
                <Icon name="lock-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Mật khẩu"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="lock-check-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors(prev => ({ ...prev, confirmPassword: "" }));
                  }}
                  secureTextEntry
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Đăng ký</Text>
                  <Text style={styles.registerButtonIcon}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleLoginButton onPress={handleGoogleRegister} disabled={loading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              Bằng việc đăng ký, bạn đồng ý với{"\n"}
              <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> và{" "}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </View>
        </Animated.View>
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
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline || 'rgba(99, 102, 241, 0.3)',
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
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
    borderColor: theme.colors.error || '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: theme.colors.secondary,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: theme.dark ? '#000' : '#FFFFFF',
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  registerButtonIcon: {
    color: theme.dark ? '#000' : '#FFFFFF',
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
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
    marginBottom: 24,
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
    marginBottom: 20,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 15,
  },
  loginText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  terms: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: "600",
  }
});