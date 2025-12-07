import { useState, useCallback, useRef } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import GeminiSpeechService from '../services/GeminiSpeechService';
import RNFS from 'react-native-fs';
import AudioRecordingService from '../services/AudioRecordingService';

interface UseVoiceRecognitionReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  errorMsg: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  clearTranscript: () => void;
  clearError: () => void;
}

/**
 * Hook for voice recording and Gemini transcription
 * Fallback to simple solution if native module not available
 */
export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recordingPathRef = useRef<string>('');

  /**
   * Request microphone permission (Android)
   */
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs microphone access to record audio',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('❌ Permission error:', err);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMsg(null);
      setTranscript('');

      // Check permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setErrorMsg('Microphone permission denied');
        Alert.alert('Error', 'Please grant microphone permission');
        return;
      }

      console.log('🎤 Starting audio recording...');

      // Generate recording path
      const timestamp = Date.now();
      const fileName = `recording_${timestamp}.m4a`;
      const recordingPath = Platform.OS === 'ios'
        ? `${RNFS.LibraryDirectoryPath}/${fileName}`
        : `${RNFS.CachesDirectoryPath}/${fileName}`;

      recordingPathRef.current = recordingPath;

      // Try using AudioRecordingService to start recording
      try {
        const started = await AudioRecordingService.startRecording();
        if (started) {
          setIsRecording(true);
          // Update recordingPathRef from service
          recordingPathRef.current = AudioRecordingService.getCurrentRecordingPath();
          console.log('✅ Recording started (AudioRecordingService), path:', recordingPathRef.current);
          return;
        }
      } catch (svcErr) {
        console.warn('⚠️ Service recorder failed:', svcErr);
      }

      // Fallback: Try legacy native recorder (if present)
      try {
        const { RNAudioRecorder } = (await import('react-native')).NativeModules as any;
        if (RNAudioRecorder && RNAudioRecorder.startRecording) {
          try {
            await RNAudioRecorder.startRecording(recordingPath);
            setIsRecording(true);
            console.log('✅ Recording started (legacy native)');
            return;
          } catch (nativeErr) {
            console.warn('⚠️ Legacy native recorder failed:', nativeErr);
          }
        }
      } catch (err) {
        console.warn('⚠️ Legacy native import failed:', err);
      }

      // Fallback: Just show alert that user should record externally
      setIsRecording(true);
      Alert.alert(
        '🎤 Recording Mode',
        'Please record your message. Tap Stop when done.'
      );
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to start recording';
      console.error('❌ Error starting recording:', errorMessage);
      setErrorMsg(errorMessage);
      Alert.alert('Error', errorMessage);
    }
  }, [requestMicrophonePermission]);

  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) {
        console.warn('Not currently recording');
        return;
      }

      setIsProcessing(true);
      console.log('⏹️ Stopping recording...');

      // Try using AudioRecordingService first
      try {
        const audioPath = await AudioRecordingService.stopRecording();
        if (audioPath) {
          recordingPathRef.current = audioPath;
        }
      } catch (nativeErr) {
        console.warn('⚠️ AudioRecordingService stop failed:', nativeErr);
      }

      // If not set yet, try old NativeModules route (legacy)
      if (!recordingPathRef.current) {
        try {
          const { RNAudioRecorder } = (await import('react-native')).NativeModules as any;
          if (RNAudioRecorder && RNAudioRecorder.stopRecording) {
            const audioPathLegacy = await RNAudioRecorder.stopRecording();
            if (audioPathLegacy) recordingPathRef.current = audioPathLegacy;
          }
        } catch (legacyErr) {
          console.warn('⚠️ Legacy native stop failed:', legacyErr);
        }
      }

      // Send to Gemini if file exists
      if (recordingPathRef.current) {
        console.log('📝 Sending to Gemini:', recordingPathRef.current);
        const result = await GeminiSpeechService.transcribeAudioFile(
          recordingPathRef.current,
          'audio/mp4'
        );

        if (result) {
          setTranscript(result);
          Alert.alert('✅ Success', `Transcribed: ${result.substring(0, 100)}...`);
        } else {
          setErrorMsg('Failed to transcribe audio');
          Alert.alert('Error', 'Failed to transcribe. Please try again.');
        }

        // Cleanup
        try {
          await RNFS.unlink(recordingPathRef.current);
        } catch (cleanupErr) {
          console.warn('Cleanup warning:', cleanupErr);
        }
      } else {
        setErrorMsg('No recording found');
        Alert.alert('Error', 'No recording to process');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error during transcription';
      console.error('❌ Error stopping recording:', errorMessage);
      setErrorMsg(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [isRecording]);

  const cancelRecording = useCallback(async () => {
    try {
      console.log('❌ Cancelling recording...');

      // Use AudioRecordingService cancel if available
      try {
        await AudioRecordingService.stopRecording();
      } catch (svcErr) {
        console.warn('AudioRecordingService cancel failed:', svcErr);
      }

      // Fallback native module if present
      try {
        const { RNAudioRecorder } = (await import('react-native')).NativeModules as any;
        if (RNAudioRecorder && RNAudioRecorder.stopRecording) {
          try {
            await RNAudioRecorder.stopRecording();
          } catch (err) {
            console.warn('Legacy native cancel warning:', err);
          }
        }
      } catch { }

      // Cleanup file
      if (recordingPathRef.current) {
        try {
          await RNFS.unlink(recordingPathRef.current);
        } catch (err) {
          console.warn('File cleanup warning:', err);
        }
      }

      setIsRecording(false);
      setTranscript('');
      setErrorMsg(null);
      recordingPathRef.current = '';
    } catch (err: any) {
      console.error('❌ Error cancelling:', err?.message);
      setErrorMsg(err?.message || 'Error cancelling recording');
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setErrorMsg(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    errorMsg,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
    clearError,
  };
};

export default useVoiceRecognition;
