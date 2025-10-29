import { launchImageLibrary } from 'react-native-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
}

export class ImageService {
  /**
   * Pick image from library
   */
  static async pickImageFromLibrary(): Promise<ImagePickerResult | null> {
    return new Promise((resolve) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          includeBase64: false,
        },
        (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
            resolve(null);
          } else if (response.errorCode) {
            console.error('ImagePicker Error:', response.errorMessage);
            Alert.alert('Error', response.errorMessage || 'Failed to pick image');
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            resolve({
              uri: asset.uri || '',
              type: asset.type || 'image/jpeg',
              name: asset.fileName || 'image.jpg',
            });
          }
        }
      );
    });
  }

  /**
   * Crop and resize image
   */
  static async processImage(imageUri: string): Promise<string> {
    try {
      // TODO: Implement image cropping/resizing logic
      // For now, return the original URI
      return imageUri;
    } catch (error) {
      console.error('❌ Error processing image:', error);
      throw error;
    }
  }

  /**
   * Validate image
   */
  static validateImage(imageUri: string): boolean {
    return !!(imageUri && imageUri.length > 0);
  }

  /**
   * Get image info
   */
  static async getImageInfo(imageUri: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const Image = require('react-native').Image;
      Image.getSize(
        imageUri,
        (width: number, height: number) => {
          resolve({ width, height });
        },
        (error: any) => {
          console.error('❌ Error getting image size:', error);
          resolve(null);
        }
      );
    });
  }
}

export default ImageService;
