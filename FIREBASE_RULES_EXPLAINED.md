# Firebase Security Rules - Chi Tiết Lỗi & Sửa Lỗi

## Các Vấn Đề Trong Rule Ban Đầu

### ❌ LỖI 1: Chat Histories - Missing Null Check
**Vấn đề:**
```javascript
match /chatHistories/{chatId} {
  allow create, read, update, delete: if request.auth.uid == resource.data.userId;
}
```

**Tại sao sai:**
- Khi **tạo mới** (create), `resource.data` không tồn tại → lỗi
- Phải dùng `request.resource.data` cho create

**Sửa đúng:**
```javascript
match /chatHistories/{chatId} {
  // Create: check request.resource.data (dữ liệu sắp được ghi)
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
  
  // Read/Update/Delete: check resource.data (dữ liệu hiện tại)
  allow read, update, delete: if request.auth != null 
    && resource.data.userId == request.auth.uid;
}
```

---

### ❌ LỖI 2: Chat Messages - Cùng vấn đề
**Vấn đề:**
```javascript
match /chatMessages/{messageId} {
  allow create, read: if request.auth.uid == resource.data.userId;
}
```

**Sửa đúng:**
```javascript
match /chatMessages/{messageId} {
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
  
  allow read: if request.auth != null 
    && resource.data.userId == request.auth.uid;
}
```

---

### ❌ LỖI 3: Default Deny Rule Không Rõ Ràng
**Vấn đề:**
```javascript
// Bất kỳ đường dẫn nào khác không khớp ở trên sẽ tự động bị từ chối.
// Bạn KHÔNG cần rule "allow read, write: if false;" ở cuối.
```

**Sai vì:** Điều này chỉ đúng nếu:
- Firestore version 2.0+ (chúng ta dùng)
- Nhưng **tốt hơn là rõ ràng**

**Sửa đúng:**
```javascript
// Mặc định từ chối tất cả truy cập không khớp
match /{document=**} {
  allow read, write: if false;
}
```

---

## Bảng So Sánh: request.resource vs resource

| Thao Tác | request.resource | resource | Giải Thích |
|---------|------------------|----------|-----------|
| **create** | ✅ Dùng | ❌ Không tồn tại | Dữ liệu sắp được tạo |
| **read** | ❌ Không cần | ✅ Dùng | Dữ liệu hiện tại |
| **update** | ✅ Có thể dùng | ✅ Dùng | Cả hai tồn tại |
| **delete** | ❌ Không cần | ✅ Dùng | Dữ liệu đang được xóa |

---

## Rule Đúng Cho Chat App

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Chat histories - User tạo và quản lý chat của riêng mình
    match /chatHistories/{chatId} {
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
      
      allow read, update, delete: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
    
    // Chat messages - User tạo và đọc message của riêng mình
    match /chatMessages/{messageId} {
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
      
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Áp Dụng Vào Firebase Console

1. Vào **[Firebase Console](https://console.firebase.google.com/)**
2. Chọn project → **Firestore Database**
3. Tab **Rules**
4. Xóa toàn bộ default rules
5. Paste rule sửa lỗi
6. Click **Publish**
7. Xem **Logs** để check nếu có lỗi syntax

---

## Test Rules Trên Firebase Console

1. Tab **Rules** → bên dưới có **Simulator**
2. Test case:
   - **Collection:** `chatHistories`
   - **Document:** `chat-001`
   - **Operation:** `create`
   - **Data:** `{ userId: "user-123", title: "Chat" }`
   - **Auth:** `{ uid: "user-123" }` → ✅ Allow

---

## Tóm Tắt Sửa Lỗi

| Lỗi | Nguyên Nhân | Cách Sửa |
|-----|------------|---------|
| Permission denied on create | Dùng `resource.data` | Dùng `request.resource.data` |
| Permission denied on read | Thiếu auth check | Thêm `request.auth != null` |
| Unclear default behavior | Không rõ default deny | Thêm `match /{document=**}` |

