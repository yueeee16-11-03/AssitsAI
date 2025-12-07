import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import RNBlobUtil from 'react-native-blob-util';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

// Khởi tạo AudioRecorderPlayer instance
const audioRecorderPlayer = new (AudioRecorderPlayer as any)();

class AudioRecordingService {
  private recordingPath: string = '';
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;

  constructor() {
    console.log('🎤 AudioRecordingService initialized with react-native-audio-recorder-player');
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Quyền Microphone',
            message: 'Ứng dụng cần quyền truy cập microphone để ghi âm',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Từ chối',
            buttonPositive: 'Đồng ý',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('❌ Lỗi quyền:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Start recording audio using react-native-audio-recorder-player
   */
  async startRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert('Lỗi', 'Quyền microphone bị từ chối');
        return false;
      }

      const timestamp = Date.now();
      const filename = `recording_${timestamp}.m4a`;
      
      // Create path in cache directory
      if (Platform.OS === 'android') {
        this.recordingPath = `${RNFS.CachesDirectoryPath}/${filename}`;
      } else {
        this.recordingPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      }

      console.log('🎤 Bắt đầu ghi âm (requested path):', this.recordingPath);

      // Start recording using the library
      const result = await audioRecorderPlayer.startRecorder(this.recordingPath);
      console.log('✅ Bắt đầu ghi âm thành công, result path returned by library:', result);

      // Some libraries return the real path used; update
      if (result && typeof result === 'string') {
        this.recordingPath = result;
      }

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      return true;
    } catch (error) {
      console.error('❌ Lỗi bắt đầu ghi âm:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm: ' + String(error));
      return false;
    }
  }

  /**
   * Stop recording and return file path
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording) {
        console.warn('⚠️ Không có ghi âm nào đang diễn ra');
        return null;
      }

      // Stop recording using the library
      const result = await audioRecorderPlayer.stopRecorder();
      console.log('✅ Đã dừng ghi âm, result returned by library:', result);

      // Update recordingPath if library returned final path
      if (result && typeof result === 'string') {
        this.recordingPath = result;
      }

      this.isRecording = false;
      const recordingDuration = Date.now() - this.recordingStartTime;
      console.log('✅ Thời lượng ghi âm:', recordingDuration, 'ms');
      
      // Verify file exists before returning
      let fileExists = await RNFS.exists(this.recordingPath);
      if (!fileExists) {
        // Fallback: try to find a recent recording file in caches directory
        try {
          const dir = Platform.OS === 'android' ? RNFS.CachesDirectoryPath : RNFS.DocumentDirectoryPath;
          const files = await RNFS.readDir(dir);
          // find files that match recording_*.m4a sorted by mtime descending
          const candidates = files.filter(f => f.name.startsWith('recording_') && f.name.endsWith('.m4a'))
            .sort((a,b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0));
          if (candidates.length > 0) {
            this.recordingPath = candidates[0].path;
            fileExists = true;
            console.log('🔎 Found fallback recording file:', this.recordingPath);
          }
        } catch (err) {
          console.warn('🔎 Fallback search failed:', err);
        }
      }

      if (!fileExists) {
        throw new Error('File ghi âm không tồn tại sau khi dừng: ' + this.recordingPath);
      }
      
      console.log('✅ File âm thanh tồn tại:', this.recordingPath);
      return this.recordingPath;
    } catch (error) {
      console.error('❌ Lỗi dừng ghi âm:', error);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm: ' + String(error));
      return null;
    }
  }

  /**
   * Convert audio file to base64
   * Uses RNFS to read file on React Native
   */
  async audioToBase64(filePath: string): Promise<string | null> {
    try {
      if (!filePath) {
        console.error('❌ Không có đường dẫn file');
        return null;
      }

      console.log('📝 Đang chuyển đổi âm thanh sang base64:', filePath);

      // Clean file path
      let cleanPath = filePath;
      if (cleanPath.startsWith('file://')) {
        cleanPath = cleanPath.replace('file://', '');
      }

      // Check if file exists
      const fileExists = await RNFS.exists(cleanPath);
      if (!fileExists) {
        throw new Error(`File không tồn tại: ${cleanPath}`);
      }

      // Get file info to verify it's not empty
      const fileInfo = await RNFS.stat(cleanPath);
      console.log('📊 Kích thước file:', fileInfo.size, 'bytes; path:', cleanPath);
      
      if (fileInfo.size === 0) {
        throw new Error('File ghi âm rỗng');
      }

      // For debugging: log the full file path and URI used
      console.log('🧭 audioToBase64() using path:', filePath);

      // If path is a content:// URI, use RNBlobUtil to read
      if (cleanPath.startsWith('content://')) {
        try {
          console.log('🔍 audioToBase64: reading content URI via RNBlobUtil:', cleanPath);
          const base64FromContent = await RNBlobUtil.fs.readFile(cleanPath, 'base64');
          console.log('✅ Đã đọc content URI, kích thước:', base64FromContent.length);
          return base64FromContent;
        } catch (err) {
          console.warn('⚠️ RNBlobUtil read failed for content URI, fallback to RNFS if possible', err);
        }
      }

      // Read file using RNFS
      const base64String = await RNFS.readFile(cleanPath, 'base64');
      console.log('✅ Âm thanh đã chuyển đổi sang base64, kích thước:', base64String.length);
      return base64String;
    } catch (error) {
      console.error('❌ Lỗi chuyển đổi âm thanh sang base64:', error);
      return null;
    }
  }

  /**
   * Delete audio file
   */
  async deleteAudioFile(filePath: string): Promise<boolean> {
    try {
      if (!filePath) return false;

      // Clean file path
      let cleanPath = filePath;
      if (cleanPath.startsWith('file://')) {
        cleanPath = cleanPath.replace('file://', '');
      }

      // Try to delete using RNFS
      try {
        await RNFS.unlink(cleanPath);
        console.log('🗑️ File âm thanh đã xóa:', filePath);
      } catch {
        console.warn('⚠️ Không thể xóa file:', filePath);
      }

      return true;
    } catch (error) {
      console.error('❌ Lỗi xóa file âm thanh:', error);
      return false;
    }
  }

  /**
   * Get recording status
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get current recording path
   */
  getCurrentRecordingPath(): string {
    return this.recordingPath;
  }

  /**
   * Get recording duration in milliseconds
   */
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }
}

export default new AudioRecordingService();
