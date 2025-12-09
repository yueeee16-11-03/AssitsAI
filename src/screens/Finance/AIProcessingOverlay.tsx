import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
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

  // ===== CALLBACK: Text processing (extract into callback so retry can call it) =====
  const processTextData = React.useCallback(async () => {
    if (!textNote) return;
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
  }, [textNote, transactionType]);

  // ===== EFFECT: Trigger text processing once =====
  useEffect(() => {
    processTextData();
  }, [processTextData]);

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
    setTextEditedData(null);
    processTextData();
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
            isTextProcessing: isTextProcessing,
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

// This screen uses shared overlay components (LoadingOverlay / ErrorOverlay)
// so local styles aren't required here.
