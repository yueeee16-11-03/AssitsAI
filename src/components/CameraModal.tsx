/**
 * 📸 Camera Modal - Using react-native-vision-camera
 * 
 * Features:
 * - High-performance camera preview
 * - Real-time flash control
 * - Scanning frame overlay
 * - Permission handling
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { X, Zap, ZapOff } from 'lucide-react-native';
import CameraService from '../services/CameraService';

interface CameraModalProps {
  visible: boolean;
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ visible, onCapture, onClose }) => {
  const cameraRef = useRef<Camera>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');

  // Request camera permission on component mount
  useEffect(() => {
    if (visible) {
      requestPermission();
    }
  }, [visible]);

  const requestPermission = async () => {
    try {
      const permissionGranted = await CameraService.requestCameraPermission();
      setHasPermission(permissionGranted);
      
      if (!permissionGranted) {
        Alert.alert(
          '⚠️ Camera Permission Required',
          'Please grant camera permission in settings to use this feature.'
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setHasPermission(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setIsLoading(true);
    try {
      const photo = await CameraService.takePhoto(cameraRef);
      
      if (photo) {
        console.log('✅ Photo captured:', photo);
        onCapture(photo);
        onClose();
      } else {
        Alert.alert('Error', 'Failed to capture photo');
      }
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };

  // Return null if modal is not visible to prevent rendering off-screen
  if (!visible) return null;

  // Show error if camera device is not available
  if (!device) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📷</Text>
            <Text style={styles.errorTitle}>Camera Not Available</Text>
            <Text style={styles.errorText}>
              Your device doesn't have a back camera, or it's not accessible.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={onClose}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Show error if permission not granted
  if (!hasPermission) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>🔒</Text>
            <Text style={styles.errorTitle}>Permission Denied</Text>
            <Text style={styles.errorText}>
              Camera permission is required to take photos. Please grant permission in settings.
            </Text>
            <TouchableOpacity style={styles.errorButton} onPress={onClose}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Camera Preview */}
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible}
          photo={true}
          video={false}
          audio={false}
        />

        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={28} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>📸 Chụp ảnh</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleFlash}
            activeOpacity={0.7}
          >
            {isFlashOn ? (
              <Zap size={28} color="#FFD700" strokeWidth={2.5} />
            ) : (
              <ZapOff size={28} color="#fff" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        {/* Scanning Frame Overlay */}
        <View style={styles.frameContainer}>
          <View style={styles.scanFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Center crosshair */}
            <View style={styles.crosshair} />
          </View>

          {/* Instructions */}
          <Text style={styles.frameInstructions}>
            Align your document within the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.footer}>
          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size={32} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.buttonSpacer} />
        </View>

        {/* Flash Status Badge */}
        {isFlashOn && (
          <View style={styles.flashBadge}>
            <Text style={styles.flashBadgeText}>⚡ Flash On</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
  },
  
  // Header Styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Scanning Frame Styles
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanFrame: {
    width: 280,
    height: 340,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  crosshair: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    position: 'relative',
  },
  frameInstructions: {
    position: 'absolute',
    bottom: -50,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  cancelButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: '700',
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonSpacer: {
    width: 56,
  },

  // Flash Badge
  flashBadge: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flashBadgeText: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    overflow: 'hidden',
  },

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CameraModal;
