import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  AppState,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function UnlockAppScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [currentInput, setCurrentInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [biometricAvailable] = useState(true); // Mock biometric availability

  // Mock PIN - in real app this would be stored securely
  const correctPin = '1234';
  const maxAttempts = 5;
  const lockDuration = 30; // seconds

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, show unlock screen
        setCurrentInput('');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [fadeAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const shakeAnimation = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const successAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleNumberPress = (number: string) => {
    if (isLocked) return;

    const newInput = currentInput + number;
    setCurrentInput(newInput);

    if (newInput.length === correctPin.length) {
      setTimeout(() => {
        if (newInput === correctPin) {
          successAnimation();
          setTimeout(() => {
            // Navigate to main app
            navigation.replace('Home');
          }, 300);
        } else {
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          setCurrentInput('');
          shakeAnimation();

          if (newFailedAttempts >= maxAttempts) {
            setIsLocked(true);
            setLockTimer(lockDuration);
            Alert.alert(
              'Ứng dụng bị khóa',
              `Bạn đã nhập sai mã PIN ${maxAttempts} lần. Ứng dụng sẽ bị khóa trong ${lockDuration} giây.`,
              [{ text: 'OK' }]
            );
          } else {
            const remainingAttempts = maxAttempts - newFailedAttempts;
            Alert.alert(
              'Mã PIN không đúng',
              `Còn ${remainingAttempts} lần thử. Ứng dụng sẽ bị khóa nếu nhập sai ${remainingAttempts} lần nữa.`,
              [{ text: 'OK' }]
            );
          }
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    if (currentInput.length > 0) {
      setCurrentInput(currentInput.slice(0, -1));
    }
  };

  const handleBiometricAuth = () => {
    if (isLocked) return;

    Alert.alert(
      'Xác thực sinh trắc học',
      'Sử dụng vân tay hoặc Face ID để mở khóa',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác thực',
          onPress: () => {
            // Mock biometric success
            setTimeout(() => {
              successAnimation();
              setTimeout(() => {
                navigation.replace('Home');
              }, 300);
            }, 1000);
          }
        }
      ]
    );
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Quên mã PIN?',
      'Bạn sẽ được đăng xuất và cần đăng nhập lại để thiết lập mã PIN mới.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Background Blur Effect */}
      <View style={styles.blurOverlay} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* App Logo */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🛡️</Text>
          </View>
          <Text style={styles.appName}>Assist</Text>
        </Animated.View>

        {/* Lock Status */}
        {isLocked ? (
          <View style={styles.lockContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockTitle}>Ứng dụng bị khóa</Text>
            <Text style={styles.lockSubtitle}>
              Quá nhiều lần nhập sai mã PIN
            </Text>
            <Text style={styles.lockTimer}>
              Thử lại sau: {formatTime(lockTimer)}
            </Text>
          </View>
        ) : (
          <>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Nhập mã PIN</Text>
              <Text style={styles.subtitle}>
                Mở khóa để tiếp tục sử dụng ứng dụng
              </Text>
            </View>

            {/* PIN Display */}
            <Animated.View 
              style={[
                styles.pinDisplay,
                { transform: [{ translateX: shakeAnim }] }
              ]}
            >
              {Array.from({ length: correctPin.length }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < currentInput.length && styles.pinDotFilled
                  ]}
                />
              ))}
            </Animated.View>

            {/* Failed Attempts Warning */}
            {failedAttempts > 0 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ Nhập sai {failedAttempts}/{maxAttempts} lần
                </Text>
              </View>
            )}

            {/* Number Pad */}
            <View style={styles.numberPad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(number.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={styles.numberButtonText}>{number}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Biometric Button */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                  activeOpacity={0.7}
                >
                  <Text style={styles.biometricButtonText}>👆</Text>
                </TouchableOpacity>
              )}
              
              {/* Zero Button */}
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => handleNumberPress('0')}
                activeOpacity={0.7}
              >
                <Text style={styles.numberButtonText}>0</Text>
              </TouchableOpacity>
              
              {/* Backspace Button */}
              <TouchableOpacity
                style={styles.backspaceButton}
                onPress={handleBackspace}
                activeOpacity={0.7}
              >
                <Text style={styles.backspaceText}>⌫</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot PIN */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPin}
            >
              <Text style={styles.forgotText}>Quên mã PIN?</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Emergency Exit (Hidden) */}
      <TouchableOpacity
        style={styles.emergencyExit}
        onPress={() => {
          // Emergency exit - in real app, this might require additional verification
          Alert.alert(
            'Thoát khẩn cấp',
            'Bạn có chắc chắn muốn thoát ứng dụng?',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Thoát', onPress: () => navigation.replace('Login') }
            ]
          );
        }}
      >
        <Text style={styles.emergencyText}>Thoát</Text>
      </TouchableOpacity>

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00796B',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  lockContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  lockTimer: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 137, 123, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 137, 123, 0.3)',
  },
  pinDotFilled: {
    backgroundColor: '#00897B',
    borderColor: '#00897B',
  },
  warningContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 300,
    gap: 20,
    marginBottom: 40,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 137, 123, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  biometricButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  biometricButtonText: {
    fontSize: 24,
  },
  backspaceButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backspaceText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  forgotButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 16,
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  emergencyExit: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  emergencyText: {
    fontSize: 12,
    color: '#EF4444',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.05,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366F1',
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
  decorativeCircle3: {
    width: 100,
    height: 100,
    backgroundColor: '#10B981',
    top: '40%',
    left: -50,
  },
});