# Hướng dẫn cấp quyền Camera

## 📱 Cho Android

### 1. Trong ứng dụng React Native:
Quyền camera đã được thêm vào `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

### 2. Cách cấp quyền khi chạy ứng dụng:

#### **Lần đầu tiên:**
- Khi bạn nhấn nút "📸 Chụp ảnh hóa đơn"
- Ứng dụng sẽ hiển thị hộp thoại: "Cho phép Assist truy cập camera?"
- Chọn **"Cho phép" (Allow)** hoặc **"Cho phép chỉ khi dùng ứng dụng" (Allow only while using the app)**

#### **Nếu bạn từ chối (Deny):**
- Bạn sẽ thấy màn hình "Cần quyền truy cập camera"
- Nhấn nút "🔒 Cấp quyền camera" để thử lại
- Hoặc thực hiện các bước sau:

### 3. Cấp quyền thủ công trong Cài đặt:

**Android 6.0 (API 23) trở lên:**

1. Mở **Cài đặt** (Settings) trên điện thoại
2. Chọn **Ứng dụng** (Apps) hoặc **Quản lý ứng dụng** (App Management)
3. Tìm **Assist** trong danh sách
4. Chọn **Quyền** (Permissions)
5. Tìm **Camera** và chọn **Cho phép** (Allow) hoặc **Cho phép chỉ khi dùng ứng dụng**

**Các tùy chọn quyền:**
- ✅ **Cho phép** - Camera hoạt động luôn
- ✅ **Cho phép chỉ khi dùng ứng dụng** - Camera hoạt động khi app chạy (khuyên dùng)
- ⚠️ **Cho phép mỗi lần** - Hỏi lần mỗi lần sử dụng
- ❌ **Từ chối** - Ứng dụng không thể truy cập camera

---

## 🍎 Cho iOS

### 1. Trong ứng dụng React Native:
Quyền camera đã được thêm vào `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Ứng dụng cần truy cập camera để chụp ảnh hóa đơn và ghi lại giao dịch tài chính của bạn</string>
```

### 2. Cách cấp quyền khi chạy ứng dụng:

#### **Lần đầu tiên:**
- Khi bạn nhấn nút "📸 Chụp ảnh hóa đơn"
- iOS sẽ hiển thị hộp thoại: "Assist" muốn truy cập camera?"
- Chọn **"Cho phép"** (Allow)

#### **Nếu bạn chọn "Không cho phép":**
Thực hiện các bước sau:

### 3. Cấp quyền thủ công trong Cài đặt:

1. Mở **Cài đặt** (Settings)
2. Cuộn xuống và chọn **Assist**
3. Bật **Camera**

---

## ❓ Thường gặp

### Q: Tôi bị báo lỗi "Cần quyền truy cập camera"?
**A:** Điều này có nghĩa là bạn chưa cấp quyền camera hoặc đã từ chối. Nhấn nút "🔒 Cấp quyền camera" để tiếp tục.

### Q: Tôi bị báo lỗi "Camera: 'device' is null"?
**A:** Lỗi này xảy ra khi thiết bị không có camera hoặc camera không khả dụng.
- Kiểm tra xem thiết bị có camera không
- Khởi động lại ứng dụng
- Khởi động lại thiết bị

### Q: Tôi đã cấp quyền nhưng nó vẫn hiển thị báo lỗi?
**A:** 
- Hãy **gỡ cài đặt và cài đặt lại** ứng dụng
- Hoặc **xóa dữ liệu ứng dụng** trong Cài đặt > Ứng dụng > Assist > Lưu trữ > Xóa dữ liệu

### Q: Tại sao camera không hoạt động sau khi cấp quyền?
**A:**
- Hãy kiểm tra xem ứng dụng khác có đang dùng camera không
- Khởi động lại ứng dụng
- Khởi động lại thiết bị
- Đảm bảo camera không bị che phủ

### Q: Tôi muốn từ chối quyền camera?
**A:** 
- **Android:** Vào Cài đặt > Ứng dụng > Assist > Quyền > Camera > Chọn "Từ chối"
- **iOS:** Vào Cài đặt > Assist > Camera > Tắt

### Q: Làm sao để sử dụng camera lại nếu tôi từ chối quyền?
**A:**
- **Android:** Vào Cài đặt > Ứng dụng > Assist > Quyền > Camera > Chọn "Cho phép"
- **iOS:** Vào Cài đặt > Assist > Camera > Bật

---

## 🔧 Xử lý sự cố

### Nếu camera vẫn không hoạt động:

1. **Kiểm tra quyền:**
   - **Android:** Vào Cài đặt > Ứng dụng > Assist > Quyền > Đảm bảo **Camera** được bật
   - **iOS:** Vào Cài đặt > Assist > Đảm bảo **Camera** được bật

2. **Xóa cache ứng dụng:**
   - **Android:** Vào Cài đặt > Ứng dụng > Assist > Lưu trữ > Xóa cache
   - **iOS:** Gỡ cài đặt và cài đặt lại

3. **Gỡ cài đặt và cài đặt lại:**
   ```bash
   npm run android  # Cho Android
   npm run ios      # Cho iOS
   ```

4. **Kiểm tra máy ảnh phần cứng:**
   - Mở ứng dụng Camera mặc định để kiểm tra xem máy ảnh có hoạt động không
   - Nếu camera mặc định không hoạt động, vấn đề nằm ở phần cứng

5. **Kiểm tra kết nối:**
   - Đảm bảo camera không bị che phủ hoặc bị dính bụi
   - Lau sạch camera bằng khăn sạch, mềm

---

## 📋 Tóm tắt

| Hành động | Android | iOS |
|-----------|---------|-----|
| **Cấp quyền lần đầu** | Nhấn "Cho phép" hoặc "Cho phép chỉ khi dùng ứng dụng" | Nhấn "Cho phép" |
| **Cấp quyền thủ công** | Cài đặt > Ứng dụng > Assist > Quyền > Camera | Cài đặt > Assist > Camera |
| **Từ chối quyền** | Cài đặt > Ứng dụng > Assist > Quyền > Camera > Từ chối | Cài đặt > Assist > Camera: Tắt |
| **Sử dụng lại** | Cài đặt > Ứng dụng > Assist > Quyền > Camera > Cho phép | Cài đặt > Assist > Camera: Bật |

---

## 🎯 Quy trình cấp quyền camera đơn giản:

### **Bước 1:** Nhấn nút "📸 Chụp ảnh hóa đơn"
### **Bước 2:** Chọn "Cho phép camera"
### **Bước 3:** Chọn "Cho phép" hoặc "Cho phép chỉ khi dùng ứng dụng"
### **Bước 4:** Camera sẽ mở tự động
### **Bước 5:** Chụp ảnh hóa đơn

---

## 💡 Mẹo:

- **Cho phép khi dùng ứng dụng:** Khuyên dùng vì bảo mật cao nhất
- **Ánh sáng tốt:** Chụp hình hóa đơn ở nơi ánh sáng đủ để ảnh rõ ràng
- **Không lắc tay:** Giữ tay cố định khi chụp để ảnh không bị mờ
- **Căn chỉnh khung hình:** Đặt hóa đơn vào giữa khung hình như hướng dẫn



