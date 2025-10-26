# 🔧 Cách sửa lỗi Firestore Permission Denied

## Lỗi hiện tại
```
Error: [firestore/permission-denied] The caller does not have permission to execute the specified operation.
```

## Nguyên nhân
Firestore Security Rules chưa được cấu hình cho phép người dùng đăng nhập thêm/xóa/sửa giao dịch.

---

## ✅ GIẢI PHÁP - Cấu hình Firestore Rules

### Bước 1: Mở Firebase Console
1. Đi tới: https://console.firebase.google.com
2. Chọn project **AssitsAI**
3. Menu bên trái → **Firestore Database**

### Bước 2: Vào Security Rules
1. Click tab **Rules** (bên cạnh Data)
2. Bạn sẽ thấy rules hiện tại

### Bước 3: Thay thế bằng Rules mới

**XÓA** tất cả rules cũ, **PASTE** code này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Cho phép người dùng đăng nhập truy cập dữ liệu của họ
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Giao dịch của người dùng
      match /transactions/{transactionId} {
        allow read, write, delete: if request.auth.uid == userId;
      }
    }
    
    // Từ chối tất cả truy cập khác
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Bước 4: Lưu Rules
- Click nút **Publish** (xanh lá cây)
- Chọn **Publish** khi confirm

---

## 🔍 Giải thích Rules

```javascript
// Cho phép người dùng chỉ truy cập dữ liệu của chính họ
allow read, write: if request.auth.uid == userId;

// request.auth.uid = ID của người dùng đăng nhập hiện tại
// userId = ID lấy từ đường dẫn (/users/{userId})
```

---

## ✨ Kết quả sau khi cấu hình
✅ Thêm giao dịch mới - **HOẠT ĐỘNG**  
✅ Lấy danh sách giao dịch - **HOẠT ĐỘNG**  
✅ Xóa giao dịch - **HOẠT ĐỘNG**  
✅ Sửa giao dịch - **HOẠT ĐỘNG**  

---

## 🎯 Cấu trúc Firestore sau cấu hình

```
Firestore Database
│
└── users/
    └── {userId}  (ID của người dùng)
        └── transactions/
            ├── transaction1/
            ├── transaction2/
            └── transaction3/
```

---

## ⚠️ Lưu ý bảo mật

**KHÔNG** sử dụng rules này trong production:
```javascript
match /{document=**} {
  allow read, write: if true;  // ❌ NGUY HIỂM!
}
```

---

## 🧪 Test Rules

Sau khi publish, chạy lại:
```bash
npm start -- --reset-cache
npm run android
```

Thử thêm giao dịch → Lỗi phải biến mất! ✅

---

## ❓ Nếu vẫn bị lỗi

1. **Xác nhận authentication**
   - Bạn đã đăng nhập chưa?
   - Check console: `auth().currentUser` phải không null

2. **Kiểm tra Rules**
   - Bạn đã Publish chưa?
   - Firestore Console → Rules → có hiển thị rules mới không?

3. **Clear cache**
   ```bash
   npm start -- --reset-cache
   ```

4. **Kiểm tra data path**
   - Phải là: `/users/{uid}/transactions/{docId}`
   - Không được: `/transactions/{docId}` (sai path)

---

## 📚 Tài liệu thêm
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/firestore/security/rules-structure
