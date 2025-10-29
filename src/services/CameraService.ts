import { Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export class CameraService {
  /**
   * Request camera permission using Vision Camera
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      console.log('📸 Camera permission requested:', cameraPermission);
      return cameraPermission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Check if camera permission is granted
   */
  static async checkCameraPermission(): Promise<boolean> {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      console.log('📸 Camera permission status:', cameraPermission);
      return cameraPermission === 'granted';
    } catch (error) {
      console.error('❌ Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Take photo with Vision Camera
   */
  static async takePhoto(cameraRef: React.RefObject<any>): Promise<string | null> {
    try {
      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not initialized');
        return null;
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'auto',
        enableShutterSound: true,
      });

      // Vision Camera returns { path, metadata }
      return `file://${photo.path}`;
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }

  /**
   * Toggle flash on/off
   */
  static toggleFlash(currentState: boolean): boolean {
    return !currentState;
  }

  /**
   * Get flash mode for Vision Camera
   */
  static getFlashMode(isFlashOn: boolean): 'on' | 'off' | 'auto' {
    return isFlashOn ? 'on' : 'off';
  }
}

export default CameraService;
