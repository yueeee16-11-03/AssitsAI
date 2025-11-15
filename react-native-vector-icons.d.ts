declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { ComponentType } from 'react';
  import { TextProps } from 'react-native';
  const MaterialCommunityIcons: ComponentType<TextProps & { name?: string; size?: number; color?: string }>;
  export default MaterialCommunityIcons;
}

// Fallback for other react-native-vector-icons imports
declare module 'react-native-vector-icons/*' {
  const content: any;
  export default content;
}
