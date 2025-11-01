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
  const { imageUri, handwritingText, onConfirm } = route.params;
  const {
    isProcessing,
    processedData,
    editedData,
    error,
    selectedItems,
    processData,
    setError,
  } = useAIProcessing({ imageUri, handwritingText });

  // Start processing on component mount
  useEffect(() => {
    processData();
  }, [processData]);

  const handleConfirm = () => {
    if (!editedData || !editedData.items || editedData.items.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một mục");
      return;
    }

    const selectedItemsData =
      selectedItems.length > 0
        ? selectedItems.map((i) => editedData.items![i])
        : editedData.items;

    const result = {
      items: selectedItemsData,
      totalAmount: selectedItemsData.reduce((sum, item) => sum + item.amount, 0),
      date: editedData.date,
      note: editedData.note,
      confidence: editedData.confidence,
    };

    onConfirm?.(result);
    navigation.goBack();
  };

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
          processedData,
          editedData,
          selectedItems,
          onConfirm: handleConfirm,
        },
      } as any}
      navigation={navigation as any}
    />
  );
}
