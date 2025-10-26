/**
 * Đây là component mới, chuyên để hiển thị nút Google Sign-in chính thức.
 * Nó tuân thủ đúng quy chuẩn của Google.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
// SỬA LỖI: Xóa 'Color' VÀ 'Size' ra khỏi import
import {
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';

// Định nghĩa props mà component này nhận vào
type GoogleLoginButtonProps = {
  onPress: () => void; // Một hàm sẽ được gọi khi bấm nút
  disabled?: boolean;  // Trạng thái mờ đi (khi đang loading)
};

export default function GoogleLoginButton({
  onPress,
  disabled = false,
}: GoogleLoginButtonProps) {
  return (
    <GoogleSigninButton
      style={styles.googleButton}
      // SỬA LỖI: Dùng thuộc tính tĩnh 'GoogleSigninButton.Size.Wide'
      size={GoogleSigninButton.Size.Wide} // Giống trong ảnh (rộng)
      // SỬA LỖI: Dùng thuộc tính tĩnh 'GoogleSigninButton.Color.Light'
      color={GoogleSigninButton.Color.Light} // Nền trắng, chữ đen
      onPress={onPress}
      disabled={disabled}
    />
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: '100%', // Tự động co giãn theo chiều rộng
    height: 58,    // Chiều cao tiêu chuẩn cho nút
    borderRadius: 16,
    marginBottom: 32, // Giữ khoảng cách
  },
});

