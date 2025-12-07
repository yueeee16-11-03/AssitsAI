import React, { useEffect, useState } from "react";
import { Alert, View, Text, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useAIProcessing } from "../../hooks/useAIProcessing";
import TextAIProcessingService from "../../services/TextAIProcessingService";
import LoadingOverlay from "./components/LoadingOverlay.tsx";
import ErrorOverlay from "./components/ErrorOverlay.tsx";
import AIProcessingResultsScreen from "./AIProcessingResultsScreen";

type Props = NativeStackScreenProps<RootStackParamList, "AIProcessingOverlay">;

export default function AIProcessingOverlay({ route, navigation }: Props) {
  const { imageUri, textNote, transactionType = 'expense' } = route.params;
  const [isTextProcessing, setIsTextProcessing] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textEditedData, setTextEditedData] = useState<any>(null);
  
  // For image OCR flow
  const {
    isProcessing: isImageProcessing,
    editedData: imageEditedData,
    error: imageError,
    processData: processImageData,
    setError: setImageError,
  } = useAIProcessing({ imageUri, enableGeminiProcessing: true, transactionType });

  // ===== EFFECT: Trigger text processing once =====
  useEffect(() => {
    if (!textNote) return;
    
    const processTextData = async () => {
      setIsTextProcessing(true);
      setTextError(null);
      
      try {
        console.log('🤖 [OVERLAY] Processing text note:', textNote);
        const result = await TextAIProcessingService.processTextNote(textNote, transactionType);
        
        console.log('✅ [OVERLAY] Text processing result:', result);
        
        setTextEditedData({
          processedText: result.processedText,
          rawText: textNote,
          items: result.items || [],
          totalAmount: result.totalAmount,
          category: result.category,
          description: result.description,
          processingTime: result.processingTime,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Lỗi xử lý";
        console.error('❌ [OVERLAY] Error:', errorMsg);
        setTextError(errorMsg);
      } finally {
        setIsTextProcessing(false);
      }
    };
    
    processTextData();
  }, [textNote, transactionType]);

  // ===== EFFECT: Trigger image processing =====
  useEffect(() => {
    if (imageUri && !textNote) {
      processImageData();
    }
  }, [imageUri, textNote, processImageData]);

  // ===== HANDLERS =====
  const handleCancel = () => {
    Alert.alert("Huỷ xử lý", "Bạn có chắc muốn huỷ?", [
      { text: "Không", onPress: () => {} },
      { text: "Có", onPress: () => navigation.goBack() },
    ]);
  };

  const handleRetryText = () => {
    setTextError(null);
    setIsTextProcessing(true);
    // Re-trigger effect by setting state - will naturally re-run
    setTextEditedData(null);
  };

  const handleRetryImage = () => {
    setImageError(null);
    processImageData();
  };

  // ===== RENDER TEXT FLOW =====
  if (textNote) {
    if (isTextProcessing) {
      return <LoadingOverlay />;
    }

    if (textError) {
      return (
        <ErrorOverlay
          error={textError}
          onRetry={handleRetryText}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <AIProcessingResultsScreen
        route={{
          params: {
            editedData: textEditedData,
            transactionType,
            isTextProcessing: true, // 🟢 Mark as text processing
          },
        } as any}
        navigation={navigation as any}
      />
    );
  }

  // ===== RENDER IMAGE FLOW =====
  if (isImageProcessing) {
    return <LoadingOverlay imageUri={imageUri} />;
  }

  if (imageError) {
    return (
      <ErrorOverlay
        error={imageError}
        onRetry={handleRetryImage}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <AIProcessingResultsScreen
      route={{
        params: {
          imageUri,
          editedData: imageEditedData,
          transactionType,
        },
      } as any}
      navigation={navigation as any}
    />
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#E0F2F1',
  },
  loadingText: {
    marginTop: 12,
    color: '#00796B',
    fontWeight: '700' as const,
  },
};
