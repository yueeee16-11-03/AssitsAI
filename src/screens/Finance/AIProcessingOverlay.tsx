import React, { useEffect } from "react";
import { Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useAIProcessing } from "../../hooks/useAIProcessing";
import LoadingOverlay from "./components/LoadingOverlay.tsx";
import ErrorOverlay from "./components/ErrorOverlay.tsx";
import AIProcessingResultsScreen from "./AIProcessingResultsScreen";

type Props = NativeStackScreenProps<RootStackParamList, "AIProcessingOverlay">;

export default function AIProcessingOverlay({ route, navigation }: Props) {
  // ✅ SimpleFlow: Không cần onConfirm callback nữa
  const { imageUri, transactionType = 'expense' } = route.params; // 🟢 Lấy loại giao dịch
  const {
    isProcessing,
    editedData,
    error,
    processData,
    setError,
  } = useAIProcessing({ imageUri, enableGeminiProcessing: true });

  // Start processing on component mount
  useEffect(() => {
    processData();
  }, [processData]);

  const handleCancel = () => {
    Alert.alert("Huỷ xử lý", "Bạn có chắc muốn huỷ?", [
      { text: "Không", onPress: () => {} },
      { text: "Có", onPress: () => navigation.goBack() },
    ]);
  };

  const handleRetry = () => {
    setError(null);
    processData();
  };

  // ===== RENDER STATES =====
  if (isProcessing) {
    return <LoadingOverlay imageUri={imageUri} />;
  }

  if (error) {
    return (
      <ErrorOverlay
        error={error}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
    );
  }

  // Render full screen results
  return (
    <AIProcessingResultsScreen
      route={{
        params: {
          imageUri,
          editedData,
          transactionType, // 🟢 TRUYỀN loại giao dịch
        },
      } as any}
      navigation={navigation as any}
    />
  );
};
