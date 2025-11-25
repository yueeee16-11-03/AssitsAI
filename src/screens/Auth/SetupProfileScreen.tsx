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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "SetupProfile">;

export default function SetupProfileScreen({ navigation: _navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(0|84|\+84)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateDateOfBirth = (date: string) => {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return dateRegex.test(date);
  };

  const handleSetupProfile = async () => {
    // Reset errors
    setErrors({ fullName: "", phoneNumber: "", dateOfBirth: "" });

    // Validation
    let hasError = false;
    if (!fullName.trim()) {
      setErrors(prev => ({ ...prev, fullName: "Vui lòng nhập họ và tên" }));
      hasError = true;
    } else if (fullName.trim().length < 3) {
      setErrors(prev => ({ ...prev, fullName: "Họ và tên phải có ít nhất 3 ký tự" }));
      hasError = true;
    }

    if (!phoneNumber.trim()) {
      setErrors(prev => ({ ...prev, phoneNumber: "Vui lòng nhập số điện thoại" }));
      hasError = true;
    } else if (!validatePhoneNumber(phoneNumber)) {
      setErrors(prev => ({ ...prev, phoneNumber: "Số điện thoại không hợp lệ" }));
      hasError = true;
    }

    if (!dateOfBirth.trim()) {
      setErrors(prev => ({ ...prev, dateOfBirth: "Vui lòng nhập ngày sinh" }));
      hasError = true;
    } else if (!validateDateOfBirth(dateOfBirth)) {
      setErrors(prev => ({ ...prev, dateOfBirth: "Ngày sinh không hợp lệ (DD/MM/YYYY)" }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      // Gọi API cập nhật profile
      // await profileAPI.update({ fullName, phoneNumber, dateOfBirth, address });
      
      // Giả lập API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
      
      // Chuyển đến Home screen
      _navigation.replace("Home");
    } catch {
      Alert.alert("Lỗi", "Không thể thiết lập hồ sơ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Bỏ qua thiết lập",
      "Bạn có thể thiết lập hồ sơ sau trong phần cài đặt",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Bỏ qua", 
          onPress: () => _navigation.replace("Home")
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.gradientBackground}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                <Icon name="account-circle" size={50} color="#EC4899" />
              </View>
              <View style={styles.avatarRing} />
              <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                <Icon name="camera" size={18} color="#0A0E27" />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Hoàn thiện hồ sơ</Text>
            <Text style={styles.subtitle}>Giúp chúng tôi hiểu bạn hơn</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Họ và tên <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Icon name="account" size={20} color="#EC4899" style={styles.inputIcon} />
                <TextInput
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#999"
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
              <Text style={styles.label}>
                Số điện thoại <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={20} color="#EC4899" style={styles.inputIcon} />
                <TextInput
                  placeholder="0912345678"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrors(prev => ({ ...prev, phoneNumber: "" }));
                  }}
                  style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Ngày sinh <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Icon name="calendar" size={20} color="#EC4899" style={styles.inputIcon} />
                <TextInput
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={dateOfBirth}
                  onChangeText={(text) => {
                    setDateOfBirth(text);
                    setErrors(prev => ({ ...prev, dateOfBirth: "" }));
                  }}
                  style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Địa chỉ (tùy chọn)</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Icon name="map-marker" size={20} color="#EC4899" style={styles.inputIcon} />
                <TextInput
                  placeholder="123 Đường ABC, Quận XYZ"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={setAddress}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={2}
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSetupProfile}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#00897B" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Hoàn tất</Text>
                  <Text style={styles.submitButtonIcon}>✓</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Bỏ qua bước này</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2F1",
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
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  circleBottom: {
    position: "absolute",
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderWidth: 3,
    borderColor: "rgba(236, 72, 153, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 50,
  },
  avatarRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(236, 72, 153, 0.2)",
    top: -10,
    left: -10,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0A0E27",
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00796B",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00796B",
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: "#EC4899",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#333333",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
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
  submitButton: {
    backgroundColor: "#EC4899",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(236, 72, 153, 0.5)",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  submitButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  skipButton: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(0, 137, 123, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#00897B",
  },
  skipButtonText: {
    color: "#00796B",
    fontSize: 15,
    fontWeight: "600",
  },
});