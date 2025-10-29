import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

type SetupStep = 'choose-length' | 'enter-pin' | 'confirm-pin' | 'complete';

export default function SetupPinScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));
  const [step, setStep] = useState<SetupStep>('choose-length');
  const [pinLength, setPinLength] = useState(4);
  const [pin, setPin] = useState('');
  const [_confirmPin, setConfirmPin] = useState('');
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const shakeAnimation = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const isWeakPin = (pinCode: string) => {
    // Check for common weak patterns
    const weakPatterns = [
      /^(\d)\1+$/, // All same digits (1111, 2222, etc.)
      /^1234$/, /^2345$/, /^3456$/, /^4567$/, /^5678$/, /^6789$/, // Sequential
      /^9876$/, /^8765$/, /^7654$/, /^6543$/, /^5432$/, /^4321$/, // Reverse sequential
      /^0000$/, /^1111$/, /^2222$/, /^3333$/, /^4444$/, /^5555$/, /^6666$/, /^7777$/, /^8888$/, /^9999$/, // Repetitive
      /^0123$/, /^1230$/, /^2301$/, /^3012$/, // Common patterns
    ];

    return weakPatterns.some(pattern => pattern.test(pinCode));
  };

  const handleNumberPress = (number: string) => {
    if (currentInput.length >= pinLength) return;

    const newInput = currentInput + number;
    setCurrentInput(newInput);

    if (newInput.length === pinLength) {
      setTimeout(() => {
        if (step === 'enter-pin') {
          if (isWeakPin(newInput)) {
            Alert.alert(
              'Mã PIN không an toàn',
              'Vui lòng chọn mã PIN khó đoán hơn. Tránh sử dụng số lặp lại hoặc số liên tiếp.',
              [{ text: 'OK', onPress: () => setCurrentInput('') }]
            );
            shakeAnimation();
            return;
          }
          setPin(newInput);
          setCurrentInput('');
          setStep('confirm-pin');
        } else if (step === 'confirm-pin') {
          if (newInput === pin) {
            setConfirmPin(newInput);
            setStep('complete');
            setTimeout(() => {
              Alert.alert(
                'Thiết lập thành công',
                'Mã PIN đã được thiết lập. Ứng dụng sẽ được bảo vệ bởi mã này.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.goBack();
                    }
                  }
                ]
              );
            }, 500);
          } else {
            Alert.alert(
              'Mã PIN không khớp',
              'Vui lòng nhập lại mã PIN xác nhận',
              [{ text: 'OK', onPress: () => setCurrentInput('') }]
            );
            shakeAnimation();
          }
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    if (currentInput.length > 0) {
      setCurrentInput(currentInput.slice(0, -1));
    }
  };

  const handleStartOver = () => {
    setStep('enter-pin');
    setPin('');
    setConfirmPin('');
    setCurrentInput('');
  };

  const renderPinLength = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Chọn độ dài mã PIN</Text>
      <Text style={styles.stepSubtitle}>
        Mã PIN dài hơn sẽ an toàn hơn
      </Text>

      <View style={styles.lengthOptions}>
        {[4, 6].map((length) => (
          <TouchableOpacity
            key={length}
            style={[
              styles.lengthOption,
              pinLength === length && styles.lengthOptionSelected
            ]}
            onPress={() => setPinLength(length)}
          >
            <Text style={[
              styles.lengthOptionText,
              pinLength === length && styles.lengthOptionTextSelected
            ]}>
              {length} chữ số
            </Text>
            <Text style={styles.lengthOptionSubtext}>
              {length === 4 ? 'Tiêu chuẩn' : 'Bảo mật cao'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep('enter-pin')}
      >
        <Text style={styles.continueButtonText}>Tiếp tục</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPinInput = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      <Text style={styles.stepTitle}>
        {step === 'enter-pin' ? 'Tạo mã PIN' : 'Xác nhận mã PIN'}
      </Text>
      <Text style={styles.stepSubtitle}>
        {step === 'enter-pin' 
          ? `Nhập mã PIN ${pinLength} chữ số`
          : 'Nhập lại mã PIN để xác nhận'
        }
      </Text>

      {/* PIN Display */}
      <View style={styles.pinDisplay}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentInput.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <TouchableOpacity
            key={number}
            style={styles.numberButton}
            onPress={() => handleNumberPress(number.toString())}
          >
            <Text style={styles.numberButtonText}>{number}</Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.numberButton} />
        
        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => handleNumberPress('0')}
        >
          <Text style={styles.numberButtonText}>0</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.numberButton}
          onPress={handleBackspace}
        >
          <Text style={styles.backspaceText}>⌫</Text>
        </TouchableOpacity>
      </View>

      {step === 'confirm-pin' && (
        <TouchableOpacity
          style={styles.startOverButton}
          onPress={handleStartOver}
        >
          <Text style={styles.startOverText}>Bắt đầu lại</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.successEmoji}>✅</Text>
      </View>
      
      <Text style={styles.successTitle}>Thiết lập thành công!</Text>
      <Text style={styles.successSubtitle}>
        Mã PIN của bạn đã được thiết lập và sẵn sàng bảo vệ ứng dụng
      </Text>

      <View style={styles.successDetails}>
        <View style={styles.successDetailItem}>
          <Text style={styles.successDetailIcon}>🔒</Text>
          <Text style={styles.successDetailText}>Ứng dụng được bảo vệ</Text>
        </View>
        <View style={styles.successDetailItem}>
          <Text style={styles.successDetailIcon}>{pinLength === 4 ? '🔢' : '🛡️'}</Text>
          <Text style={styles.successDetailText}>{pinLength} chữ số</Text>
        </View>
      </View>
    </View>
  );

  const getProgressPercentage = () => {
    switch (step) {
      case 'choose-length': return 25;
      case 'enter-pin': return 50;
      case 'confirm-pin': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thiết lập mã PIN</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { width: `${getProgressPercentage()}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% hoàn thành
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'choose-length' && renderPinLength()}
        {(step === 'enter-pin' || step === 'confirm-pin') && renderPinInput()}
        {step === 'complete' && renderComplete()}
      </View>

      {/* Security Tips */}
      {step === 'enter-pin' && (
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Mẹo bảo mật</Text>
          <Text style={styles.tipsText}>
            • Không sử dụng ngày sinh hoặc số điện thoại{'\n'}
            • Tránh số lặp lại (1111, 2222){'\n'}
            • Không dùng số liên tiếp (1234, 4321)
          </Text>
        </View>
      )}

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#00897B',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00796B',
  },
  headerPlaceholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  lengthOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  lengthOption: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  lengthOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  lengthOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00796B',
    marginBottom: 4,
  },
  lengthOptionTextSelected: {
    color: '#6366F1',
  },
  lengthOptionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
    gap: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pinDotFilled: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 300,
    gap: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  backspaceText: {
    fontSize: 20,
    color: '#333333',
  },
  startOverButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startOverText: {
    fontSize: 16,
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  successDetails: {
    width: '100%',
    gap: 16,
  },
  successDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  successDetailIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  successDetailText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00796B',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
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
});