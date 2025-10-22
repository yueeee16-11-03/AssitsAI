# 🔐 Hướng Dẫn Tích Hợp Firebase Authentication

## ✅ Hoàn Thành

Tôi đã cập nhật **RegisterScreen.tsx** và **LoginScreen.tsx** để tích hợp hoàn toàn với Firebase thông qua **AuthService.js**.

---

## 📝 Các Thay Đổi

### 1. **RegisterScreen.tsx**

#### Import AuthService
```typescript
import { registerAndCreateProfile, onGoogleButtonPress } from "../../services/AuthService";
```

#### handleRegister - Đăng ký Email/Password
**Trước:**
```typescript
// Mock delay 1.5s
await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
navigation.replace("SetupProfile");
```

**Sau:**
```typescript
// Gọi Firebase registerAndCreateProfile
await registerAndCreateProfile({
  email: email.trim(),
  password,
  name: fullName.trim(),
});

Alert.alert("Thành công", "Đăng ký thành công! Vui lòng hoàn tất hồ sơ.");
navigation.replace("SetupProfile");
```

**Tính năng:**
- ✅ Tạo tài khoản Email/Password trên Firebase Authentication
- ✅ Tạo hồ sơ người dùng trên Firestore
- ✅ Xác thực email hợp lệ
- ✅ Xác thực mật khẩu >= 6 ký tự
- ✅ Thông báo lỗi rõ ràng (Email đã tồn tại, Mật khẩu yếu, etc.)

#### handleGoogleRegister - Đăng ký Google
**Trước:**
```typescript
Alert.alert("Thông báo", "Tính năng đăng ký Google đang được phát triển");
```

**Sau:**
```typescript
const handleGoogleRegister = async () => {
  setLoading(true);
  try {
    await onGoogleButtonPress();
    Alert.alert("Thành công", "Đăng ký Google thành công!");
    navigation.replace("SetupProfile");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đăng ký Google thất bại";
    Alert.alert("Lỗi", errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Tính năng:**
- ✅ Đăng ký qua Google Sign-In
- ✅ Tự động tạo hồ sơ trên Firestore
- ✅ Hỗ trợ user mới và user cũ
- ✅ Cập nhật `lastLogin` timestamp

---

### 2. **LoginScreen.tsx**

#### Import AuthService
```typescript
import { loginWithEmail, onGoogleButtonPress } from "../../services/AuthService";
```

#### handleLogin - Đăng nhập Email/Password
**Trước:**
```typescript
// Mock delay 1.5s
await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
navigation.replace("SetupProfile"); // Luôn đi SetupProfile
```

**Sau:**
```typescript
// Gọi Firebase loginWithEmail
await loginWithEmail(email.trim(), password);

Alert.alert("Thành công", "Đăng nhập thành công!");
navigation.replace("Home"); // Đi Home sau khi đăng nhập
```

**Tính năng:**
- ✅ Xác thực Email/Password với Firebase
- ✅ Cập nhật `lastLogin` timestamp trên Firestore
- ✅ Thông báo lỗi rõ ràng (Sai email/mật khẩu, Email không hợp lệ)
- ✅ Chuyển hướng đến Home (không phải SetupProfile)

#### handleGoogleLogin - Đăng nhập Google
**Trước:**
```typescript
Alert.alert("Thông báo", "Tính năng đăng nhập Google đang được phát triển");
```

**Sau:**
```typescript
const handleGoogleLogin = async () => {
  setLoading(true);
  try {
    await onGoogleButtonPress();
    Alert.alert("Thành công", "Đăng nhập Google thành công!");
    navigation.replace("Home");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Đăng nhập Google thất bại";
    Alert.alert("Lỗi", errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Tính năng:**
- ✅ Đăng nhập qua Google Sign-In
- ✅ Cập nhật hồ sơ trên Firestore
- ✅ Hỗ trợ user mới và user cũ

---

## 🔄 Flow Đăng Ký / Đăng Nhập

### Đăng Ký (Register)
```
┌─────────────────────────────────────┐
│ 1. User nhập Email, Password, Name  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 2. Validate dữ liệu (Client-side)   │
│    - Email hợp lệ                   │
│    - Password >= 6 ký tự            │
│    - Name >= 3 ký tự                │
│    - Password khớp                  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 3. registerAndCreateProfile()        │
│    - Tạo Auth User                  │
│    - Tạo Firestore Profile          │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 4. Navigasi → SetupProfile          │
│    (Hoàn tất hồ sơ chi tiết)        │
└─────────────────────────────────────┘
```

### Đăng Nhập (Login)
```
┌─────────────────────────────────────┐
│ 1. User nhập Email, Password        │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 2. Validate dữ liệu (Client-side)   │
│    - Email hợp lệ                   │
│    - Password >= 6 ký tự            │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 3. loginWithEmail()                 │
│    - Xác thực Email/Password        │
│    - Cập nhật lastLogin             │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 4. Navigasi → Home                  │
│    (Bảng điều khiển chính)          │
└─────────────────────────────────────┘
```

### Đăng Nhập Google
```
┌─────────────────────────────────────┐
│ 1. User bấm "Google" Button         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 2. onGoogleButtonPress()            │
│    - Kiểm tra Play Services         │
│    - Lấy ID Token từ Google         │
│    - Đăng nhập vào Firebase         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 3. createOrUpdateSocialProfile()    │
│    - Tạo hoặc cập nhật Firestore    │
│    - Ghi nhận lastLogin             │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│ 4. Navigasi → SetupProfile (Register)│
│    hoặc → Home (Login)              │
└─────────────────────────────────────┘
```

---

## 🗄️ Firestore Schema

### Collection: `users`
```javascript
{
  uid: "user_id_from_firebase_auth",
  name: "Họ và tên",
  email: "user@example.com",
  photoURL: "https://...",
  joinedAt: Timestamp,        // serverTimestamp()
  lastLogin: Timestamp,       // serverTimestamp()
  mainGoal: "Chưa thiết lập",
  familyId: null              // null hoặc family_id
}
```

**Các trường:**
- `uid`: Được tạo tự động bởi Firebase
- `name`: Họ và tên (từ RegisterScreen hoặc Google displayName)
- `email`: Email đã xác thực
- `photoURL`: Avatar URL (từ Google hoặc null)
- `joinedAt`: Thời điểm đăng ký (chỉ set lần đầu)
- `lastLogin`: Lần đăng nhập cuối (cập nhật mỗi lần đăng nhập)
- `mainGoal`: Mục tiêu chính (mặc định: "Chưa thiết lập")
- `familyId`: ID gia đình (null nếu chưa tham gia)

---

## 📊 Error Handling

### Register Errors
| Error Code | Message | Nguyên nhân |
|------------|---------|-----------|
| `auth/email-already-in-use` | "Email này đã được sử dụng." | Email đã tồn tại |
| `auth/invalid-email` | "Địa chỉ email không hợp lệ." | Format email sai |
| `auth/weak-password` | "Mật khẩu quá yếu (cần ít nhất 6 ký tự)." | Mật khẩu < 6 ký tự |

### Login Errors
| Error Code | Message | Nguyên nhân |
|------------|---------|-----------|
| `auth/user-not-found` | "Sai email hoặc mật khẩu." | Tài khoản không tồn tại |
| `auth/wrong-password` | "Sai email hoặc mật khẩu." | Mật khẩu sai |
| `auth/invalid-email` | "Địa chỉ email không hợp lệ." | Format email sai |

### Google Sign-In Errors
| Error Code | Message | Nguyên nhân |
|------------|---------|-----------|
| `PLAY_SERVICES_NOT_AVAILABLE` | "Google Play Services không khả dụng." | Google Play Services bị tắt |
| (Generic) | "Đăng nhập Google thất bại." | Lỗi khác |

---

## 🚀 Cài Đặt & Khởi Động

### 1. **Gọi configureGoogleSignIn() khi App khởi động**

Thêm vào **App.tsx** hoặc **index.js**:
```typescript
import { configureGoogleSignIn } from "./src/services/AuthService";

// Gọi lần duy nhất khi app khởi động
useEffect(() => {
  configureGoogleSignIn();
}, []);
```

### 2. **Kiểm tra Firebase config**

Đảm bảo Firebase đã cấu hình đúng trong project:
- ✅ `google-services.json` đã thêm vào Android
- ✅ Google Cloud Console ID client đúng
- ✅ Firebase Authentication đã enable Email/Password & Google Sign-In
- ✅ Firestore Database đã tạo

### 3. **Cài đặt Dependencies**

```bash
npm install @react-native-firebase/auth @react-native-firebase/firestore @react-native-google-signin/google-signin
```

---

## ✨ Tính Năng Đã Hoàn Thành

✅ Đăng ký Email/Password với xác thực  
✅ Đăng nhập Email/Password  
✅ Đăng ký Google Sign-In  
✅ Đăng nhập Google Sign-In  
✅ Tự động tạo hồ sơ Firestore  
✅ Cập nhật `lastLogin` timestamp  
✅ Error handling rõ ràng  
✅ Loading state chính xác  
✅ Navigation sau khi thành công  

---

## 🔜 Tiếp Theo

### Tùy chọn 1: Tạo ForgotPassword Screen
```typescript
- Nhập email
- Gửi password reset link
- Xác nhận reset
```

### Tùy chọn 2: Cải thiện SetupProfile
```typescript
- Lưu profile details vào Firestore
- Chọn avatar/photo
- Chọn mục tiêu chính
```

### Tùy chọn 3: Thêm 2FA (Two-Factor Authentication)
```typescript
- SMS OTP
- Email OTP
- Google Authenticator
```

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra Console logs
2. Xác minh Firebase Config
3. Kiểm tra Firestore Rules
4. Kiểm tra Google Play Services trên thiết bị
