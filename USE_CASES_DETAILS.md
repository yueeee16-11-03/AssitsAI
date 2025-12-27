# USE CASES - Chi Tiết các Use Case cho dự án ASSIST

> File này là template tổng hợp tất cả các use case của dự án. Dùng để mô tả đầy đủ: mục tiêu, luồng chính, luồng thay thế, ràng buộc, UI, API, tiêu chí nghiệm thu, test cases, v.v.

---

## Hướng dẫn sử dụng
- Mỗi use case có một **template** (ID, Tên, Diễn giải, Tiền đề, Hậu điều kiện, Luồng chính, Luồng thay thế, Ngoại lệ, Quy tắc nghiệp vụ, Màn hình liên quan, API / Service, Dữ liệu thay đổi, Tiêu chí nghiệm thu, Test case mẫu, Ghi chú, Ưu tiên, Ước lượng).
- Sao chép template bên dưới cho từng use case bạn muốn mô tả chi tiết.
- Viết tiếng Việt để mọi thành viên dễ theo dõi.

---

## Mục lục
1. [Quản Lý Giao Dịch](#1-quan-ly-giao-dich)
2. [Quản Lý Gia Đình](#2-quan-ly-gia-dinh)
3. [Quản Lý Hạn Mức Chi Tiêu](#3-quan-ly-han-muc-chi-tieu)
4. [Quản Lý Ngân Sách](#4-quan-ly-ngan-sach)
5. [Quản Lý Thói Quen](#5-quan-ly-thoi-quen)
6. [Báo Cáo & Phân Tích](#6-bao-cao-phan-tich)
7. [Chat & AI Assistant](#7-chat--ai-assistant)
8. [Thông Báo](#8-thong-bao)
9. [Quản Lý Tài Khoản](#9-quan-ly-tai-khoan)
10. [Cài Đặt](#10-cai-dat)

---

### Template mô tả Use Case (Sao chép và điền cho từng case)

**Use Case ID**: UC-xxx

**Tên Use Case**: 

**Actor(s)**: (ví dụ: Admin, Member, Child, System)

**Mục tiêu (Goal)**: Mục tiêu cụ thể của use case

**Tiền đề (Preconditions)**: (điều kiện phải có trước khi thực hiện)

**Hậu điều kiện (Postconditions)**: (kết quả sau khi thực hiện hoàn tất)

**Mô tả ngắn gọn**: 1-2 câu tóm tắt hành động chính

**Luồng chính (Basic Flow)**:
1. Bước 1
2. Bước 2
3. Bước 3 (hoàn thành)

**Luồng thay thế / Luồng ngoại lệ**:
- Nếu X xảy ra -> thực hiện Y
- Nếu Y xảy ra -> thực hiện Z

**Quy tắc nghiệp vụ**:
- Quy tắc 1
- Quy tắc 2

**Màn hình / UI liên quan**:
- Tên màn hình A
- Tên màn hình B

**API / Service liên quan**:
- Endpoint: POST /transactions
- Service: TransactionService.createTransaction()

**Dữ liệu thay đổi**:
- Bảng/Collection: transactions
- Fields: amount, category, userId, status

**Tiêu chí nghiệm thu (Acceptance Criteria)**:
- Kiểm tra 1: Mô tả điều kiện phải thỏa
- Kiểm tra 2: Mô tả kết quả mong muốn

**Test Cases (mẫu)**:
- TC-1: Tạo giao dịch hợp lệ -> Kỳ vọng: transaction được lưu, trạng thái = approved/normal
- TC-2: Tạo giao dịch vượt hạn mức -> Kỳ vọng: hiển thị lỗi, không lưu

**Ưu tiên**: High / Medium / Low

**Ước lượng**: (ví dụ: 3 story points)

**Ghi chú**: (bất kỳ thông tin thêm nào)

---

## 1. Quản Lý Giao Dịch

### UC-101: Tạo giao dịch chi tiêu
**Actor(s)**: Member, Child

**Mục tiêu**: Cho phép thành viên ghi nhận một giao dịch chi tiêu mới.

**Tiền đề**: Người dùng đã đăng nhập; thuộc một gia đình; có quyền tạo giao dịch.

**Luồng chính**:
1. Người dùng mở màn hình Tạo giao dịch
2. Nhập thông tin: số tiền, danh mục, mô tả, ngày, ảnh (tuỳ chọn)
3. Hệ thống kiểm tra hạn mức (nếu có)
4. Hệ thống lưu giao dịch & trả về kết quả thành công

**Luồng thay thế**:
- Nếu vượt hạn mức: hiện thông báo lỗi / yêu cầu phê duyệt
- Nếu mất mạng: lưu tạm offline hoặc thông báo lỗi

**API liên quan**: POST /transactions

(Điền template chi tiết bên trên)

---

### UC-102: Duyệt/Từ chối giao dịch (Admin)
**Actor(s)**: Admin

**Mục tiêu**: Admin có thể duyệt hoặc từ chối các giao dịch ở trạng thái chờ.

**Tiền đề**: Admin đã đăng nhập; có giao dịch chờ.

**Luồng chính**:
1. Admin mở danh sách giao dịch chờ
2. Xem chi tiết giao dịch
3. Nhấn Duyệt hoặc Từ chối
4. Hệ thống cập nhật trạng thái và gửi thông báo

**Luồng thay thế**:
- Nếu giao dịch đã bị thay đổi/xoá: hiển thị thông báo lỗi

**API liên quan**: PATCH /transactions/{id}/approve

(Điền template chi tiết bên trên)

---

## 2. Quản Lý Gia Đình

### UC-201: Tạo gia đình (Create Family)
**Use Case ID**: UC-201

**Tên Use Case**: Tạo gia đình

**Actor(s)**: Người dùng (Authenticated User)

**Mục tiêu (Goal)**: Tạo một gia đình mới và đặt người tạo làm chủ (owner). Hệ thống sinh invite code/QR để mời thành viên.

**Tiền đề (Preconditions)**: Người dùng đã đăng nhập; chưa thuộc gia đình khác hoặc có quyền tạo gia đình.

**Hậu điều kiện (Postconditions)**: Một bản ghi family mới được tạo; bản ghi family_members cho user với role = owner; inviteCode được sinh và lưu.

**Mô tả ngắn gọn**: Người dùng điền thông tin, hệ thống tạo family và trả về invite code.

**Luồng chính (Basic Flow)**:
1. Người dùng mở màn hình "Tạo gia đình".
2. Người dùng nhập tên gia đình, ảnh, mô tả, tuỳ chọn cài đặt ban đầu.
3. Người dùng nhấn "Tạo".
4. Hệ thống kiểm tra dữ liệu hợp lệ, tạo record `families` và record `family_members` (user -> owner), sinh `inviteCode`/QR.
5. Hệ thống trả về success và hiển thị invite code/QR, liên kết chia sẻ.

**Luồng thay thế / Luồng ngoại lệ**:
- Nếu tên gia đình trùng hoặc không hợp lệ -> hiển thị lỗi và yêu cầu nhập lại.
- Nếu mạng lỗi -> hiển thị thông báo lỗi và lưu tạm (nếu hỗ trợ offline).

**Quy tắc nghiệp vụ**:
- Mỗi user chỉ có thể tạo tối đa N gia đình (configurable).
- Owner không thể rời gia đình nếu không chuyển ownership trước.

**Màn hình / UI liên quan**:
- Tạo gia đình (CreateFamily)
- Màn hình chi tiết gia đình (FamilyDetail)

**API / Service liên quan**:
- Endpoint: POST /families
- Service: FamilyService.createFamily(name, options)

**Dữ liệu thay đổi**:
- Collection: families { id, name, avatar, description, ownerId, createdAt }
- Collection: family_members { familyId, userId, role: 'owner', joinedAt }
- Collection: family_invites { familyId, code, createdBy, expiresAt }

**Tiêu chí nghiệm thu (Acceptance Criteria)**:
- Gia đình mới tạo được lưu với ownerId = current user.
- Invite code tồn tại và có thể copy/scan.
- User được thêm vào family_members với role owner.

**Test Cases (mẫu)**:
- TC-201-01: Tạo gia đình hợp lệ -> Kỳ vọng: success, family record được tạo, invite code hiện.
- TC-201-02: Tạo gia đình với tên trống -> Kỳ vọng: validation error.

**Ưu tiên**: High

**Ước lượng**: 5 story points

**Ghi chú**: Cân nhắc thêm option privacy (public/private family).

---

### UC-202: Mời / Thêm thành viên vào gia đình (Invite / Add Member)
**Use Case ID**: UC-202

**Tên Use Case**: Mời / Thêm thành viên

**Actor(s)**: Admin (hoặc Owner)

**Mục tiêu (Goal)**: Thêm thành viên mới vào gia đình thông qua email invite hoặc invite code.

**Tiền đề (Preconditions)**: Admin đã đăng nhập; có familyId; người được mời có tài khoản (nếu cần gửi email invite hướng dẫn tạo tài khoản).

**Hậu điều kiện (Postconditions)**: Invite được gửi (nếu chưa chấp nhận) hoặc thành viên được thêm trực tiếp (nếu immediate add); record `family_members` được tạo khi người dùng chấp nhận/được thêm.

**Mô tả ngắn gọn**: Admin nhập email hoặc chia sẻ invite code/QR; người nhận chấp nhận để tham gia.

**Luồng chính (Basic Flow)**:
1. Admin mở màn hình Quản lý thành viên.
2. Chọn "Mời thành viên".
3. Nhập email hoặc share invite code/QR.
4. Hệ thống tạo `family_invites` (email hoặc code) và gửi email/notification.
5. Người nhận mở link hoặc nhập code -> nếu đã đăng nhập thì click "Chấp nhận" -> hệ thống tạo `family_members` cho user.

**Luồng thay thế / Ngoại lệ**:
- Nếu email đã thuộc gia đình -> hiển thị lỗi.
- Nếu invite hết hạn -> thông báo invite invalid.
- Nếu người nhận chưa có tài khoản -> gửi email kèm hướng dẫn đăng ký rồi chấp nhận.

**Quy tắc nghiệp vụ**:
- Invite có hạn sử dụng (expiration).
- Admin có thể huỷ invite.
- Hệ thống phải kiểm tra duplicate (không thêm user đã tồn tại trong family).

**Màn hình / UI liên quan**:
- FamilyMembers (list)
- Invite modal / Share sheet

**API / Service liên quan**:
- POST /families/{id}/invites
- POST /families/{id}/members (for immediate add)
- GET /families/invites/{code}
- POST /families/invites/{code}/accept

**Dữ liệu thay đổi**:
- family_invites { id, familyId, code, createdBy, expiresAt, email }
- family_members { familyId, userId, role, joinedAt }

**Tiêu chí nghiệm thu (Acceptance Criteria)**:
- Invite email/code được tạo và gửi.
- Người dùng chấp nhận invite -> `family_members` tạo đúng thông tin.
- Không thể chấp nhận invite đã hết hạn.

**Test Cases (mẫu)**:
- TC-202-01: Gửi invite tới email mới -> Kỳ vọng: invite record, email được gửi.
- TC-202-02: Người nhận nhập code hợp lệ -> Kỳ vọng: thành viên được thêm.
- TC-202-03: Người nhận nhập code hết hạn -> Kỳ vọng: lỗi "invite không hợp lệ".

**Ưu tiên**: High

**Ước lượng**: 3 story points

**Ghi chú**: Hỗ trợ resend invite và revoke invite.

---

### UC-203: Chấp nhận Invite (Accept Invite)
**Use Case ID**: UC-203

**Tên Use Case**: Chấp nhận lời mời gia nhập gia đình

**Actor(s)**: Người dùng (invitee)

**Mục tiêu (Goal)**: Người được mời tham gia gia đình bằng cách dùng invite code hoặc link.

**Tiền đề (Preconditions)**: Có invite code hợp lệ; người dùng mở link hoặc nhập code; người dùng đã đăng nhập hoặc đăng ký.

**Hậu điều kiện (Postconditions)**: `family_members` record được tạo cho user; user bắt đầu hiện trong danh sách thành viên.

**Luồng chính (Basic Flow)**:
1. Người nhận mở link invite hoặc nhập code trên màn hình "Tham gia gia đình".
2. Nếu chưa đăng nhập -> chuyển sang đăng nhập/đăng ký.
3. Người dùng click "Chấp nhận".
4. Hệ thống validate invite và tạo record `family_members` với role mặc định (ví dụ: member).
5. Hệ thống gửi thông báo cho Admin/owner về thành viên mới.

**Luồng thay thế**:
- Nếu code invalid/expired -> hiển thị lỗi và hướng dẫn liên hệ admin.
- Nếu user đã là thành viên -> hiển thị message tương ứng.

**API liên quan**:
- POST /families/invites/{code}/accept

**Tiêu chí nghiệm thu**:
- Accept invite thành công -> user xuất hiện trong family_members
- Email/notification cho admin được gửi

**Test Cases**:
- TC-203-01: Accept valid invite while logged in -> success, member created
- TC-203-02: Accept valid invite when not logged in -> redirect register -> accept

**Ưu tiên**: High

**Ước lượng**: 2 story points

---

### UC-204: Gỡ / Xóa thành viên (Remove Member)
**Use Case ID**: UC-204

**Tên Use Case**: Gỡ thành viên khỏi gia đình

**Actor(s)**: Admin

**Mục tiêu (Goal)**: Admin gỡ một thành viên khỏi gia đình vì lý do quản lý.

**Tiền đề (Preconditions)**: Admin đã đăng nhập; có familyId; memberId hợp lệ.

**Hậu điều kiện (Postconditions)**: Record `family_members` bị đánh dấu removed hoặc deleted; nếu member có dữ liệu liên quan cần xử lý (giao dịch, habits) thì xử lý theo policy (ví dụ: transfer data hoặc xoá liên quan).

**Luồng chính (Basic Flow)**:
1. Admin chọn thành viên và nhấn "Gỡ".
2. Hệ thống hiển thị xác nhận (confirmation).
3. Admin xác nhận -> Hệ thống kiểm tra: không gỡ owner cuối cùng.
4. Hệ thống xóa hoặc đánh dấu inactive bản ghi `family_members`.
5. Hệ thống gửi thông báo cho thành viên bị gỡ.

**Luồng thay thế / Ngoại lệ**:
- Nếu cố gắng xóa quản trị viên duy nhất -> hiển thị lỗi và block thao tác.
- Nếu member có vai trò owner -> yêu cầu transfer ownership trước.

**Quy tắc nghiệp vụ**:
- Không thể xóa last admin/owner.
- Có thể soft-delete (flag) thay vì hard delete.

**API liên quan**: DELETE /families/{id}/members/{memberId}

**Tiêu chí nghiệm thu**:
- Thành viên bị gỡ không còn xuất hiện trong danh sách thành viên active.
- Các data/thao tác liên quan được xử lý theo policy.

**Test Cases**:
- TC-204-01: Admin xóa member bình thường -> success, user removed
- TC-204-02: Admin cố xóa last admin -> error, blocked

**Ưu tiên**: High

---

### UC-205: Giao vai trò (Assign Role)
**Use Case ID**: UC-205

**Tên Use Case**: Giao / Thay đổi vai trò thành viên

**Actor(s)**: Admin

**Mục tiêu (Goal)**: Admin thay đổi vai trò (admin/member/child) của một thành viên.

**Tiền đề (Preconditions)**: Admin đã đăng nhập; có memberId; không làm mất owner cuối cùng khi hạ vai trò.

**Hậu điều kiện (Postconditions)**: Trường role trong `family_members` cập nhật; permissions cập nhật theo role.

**Luồng chính (Basic Flow)**:
1. Admin mở trang chi tiết thành viên.
2. Chọn "Thay đổi vai trò" và chọn role mới.
3. Hệ thống kiểm tra business rule (không hạ admin nếu chỉ còn 1 admin)
4. Hệ thống cập nhật role và permissions; gửi thông báo cho thành viên.

**Luồng thay thế**:
- Nếu việc chuyển role sang owner -> xác nhận extra (transfer ownership flow).

**API liên quan**: PATCH /families/{id}/members/{memberId}

**Tiêu chí nghiệm thu**:
- Role thay đổi và permissions tương ứng được áp dụng.
- Không vi phạm rule last admin.

**Test Cases**:
- TC-205-01: Đổi member -> admin -> success
- TC-205-02: Hạ last admin -> blocked

**Ưu tiên**: High

---

### UC-206: Chuyển chủ gia đình (Transfer Ownership)
**Use Case ID**: UC-206

**Tên Use Case**: Chuyển ownership cho thành viên khác

**Actor(s)**: Owner (current)

**Mục tiêu (Goal)**: Chủ gia đình có thể chuyển quyền chủ (owner) cho một thành viên khác.

**Tiền đề (Preconditions)**: Chủ gia đình đã đăng nhập; target member phải là thành viên của gia đình.

**Hậu điều kiện (Postconditions)**: `families.ownerId` cập nhật; cũ owner hạ xuống admin hoặc member theo lựa chọn.

**Luồng chính (Basic Flow)**:
1. Owner chọn "Chuyển chủ" trên trang quản lý thành viên.
2. Chọn thành viên làm owner mới và xác nhận.
3. Hệ thống cập nhật `families.ownerId` và role của cũ/new owner.
4. Gửi thông báo cho các bên liên quan.

**Luồng thay thế**:
- Nếu chọn thành viên không hợp lệ -> lỗi.

**API liên quan**: POST /families/{id}/transferOwnership

**Tiêu chí nghiệm thu**:
- Owner mới được cập nhật đúng; cũ owner không còn là owner.

**Test Cases**:
- TC-206-01: Transfer ownership thành công -> ownerId thay đổi
- TC-206-02: Transfer to non-member -> blocked

**Ưu tiên**: High

---

### UC-207: Rời gia đình (Leave Family)
**Use Case ID**: UC-207

**Tên Use Case**: Rời gia đình

**Actor(s)**: Member, Child

**Mục tiêu (Goal)**: Thành viên có thể rời gia đình (self-remove).

**Tiền đề (Preconditions)**: Người dùng đã đăng nhập; không phải owner (hoặc owner đã transfer ownership trước).

**Hậu điều kiện (Postconditions)**: `family_members` record của user bị xóa/flagged; quyền truy cập gia đình được thu hồi.

**Luồng chính (Basic Flow)**:
1. Người dùng vào trang cài đặt gia đình -> chọn "Rời gia đình".
2. Xác nhận hành động.
3. Hệ thống kiểm tra: nếu user là owner -> yêu cầu transfer ownership trước.
4. Xóa hoặc đánh dấu inactive record `family_members`.
5. Gửi thông báo tới admin.

**API liên quan**: POST /families/{id}/members/{memberId}/leave

**Tiêu chí nghiệm thu**:
- User không còn truy cập dữ liệu gia đình.

**Test Cases**:
- TC-207-01: Member rời gia đình -> success
- TC-207-02: Owner cố rời mà chưa transfer -> blocked

**Ưu tiên**: Medium

---

### UC-208: Xem danh sách thành viên (View Members)
**Use Case ID**: UC-208

**Tên Use Case**: Xem danh sách thành viên

**Actor(s)**: Member, Admin

**Mục tiêu (Goal)**: Hiển thị danh sách thành viên, vai trò, trạng thái, hạn mức.

**Tiền đề (Preconditions)**: Người dùng đã đăng nhập và thuộc gia đình.

**Hậu điều kiện (Postconditions)**: Không thay đổi dữ liệu (read-only)

**Luồng chính (Basic Flow)**:
1. Mở màn hình Gia đình -> tab Thành viên
2. Hệ thống gọi API lấy members và hiển thị thông tin (name, role, avatar, spendingLimit, canSpend)

**API liên quan**: GET /families/{id}/members

**Tiêu chí nghiệm thu**:
- Danh sách hiển thị đầy đủ và chính xác theo dữ liệu server.

**Test Cases**:
- TC-208-01: Member xem danh sách -> success

**Ưu tiên**: High

---

### UC-209: Quản lý invite (Revoke / Resend)
**Use Case ID**: UC-209

**Tên Use Case**: Quản lý invite (Revoke, Resend)

**Actor(s)**: Admin

**Mục tiêu (Goal)**: Admin có thể hủy hoặc gửi lại invite.

**Tiền đề (Preconditions)**: Admin đã đăng nhập; có invite tồn tại.

**Hậu điều kiện (Postconditions)**: Invite được hủy hoặc gửi lại; trạng thái invite cập nhật.

**Luồng chính (Basic Flow)**:
1. Admin vào danh sách invite
2. Chọn invite -> Resend hoặc Revoke
3. Hệ thống thực hiện và cập nhật trạng thái

**API liên quan**: PATCH /families/{id}/invites/{inviteId} (action: revoke/resend)

**Tiêu chí nghiệm thu**:
- Invite bị revoke không thể dùng.
- Resend sẽ gửi email mới.

**Test Cases**:
- TC-209-01: Revoke invite -> code không hợp lệ khi accept
- TC-209-02: Resend invite -> email mới được gửi

**Ưu tiên**: Medium

---

## 3. Quản Lý Hạn Mức Chi Tiêu


## 3. Quản Lý Hạn Mức Chi Tiêu

### UC-301: Đặt hạn mức chi tiêu cho thành viên
**Actor(s)**: Admin

**Mục tiêu**: Thiết lập hạn mức (VNĐ) cho từng thành viên.

**Tiền đề**: Admin đã đăng nhập.

**Luồng chính**:
1. Admin vào mục Quản lý thành viên
2. Chọn thành viên -> Chỉnh hạn mức
3. Nhập số tiền mới -> Lưu
4. Hệ thống cập nhật và phát cảnh báo nếu cần

**API**: PATCH /family_members/{id}

(Điền template chi tiết bên trên)

---

## 4. Quản Lý Ngân Sách

### UC-401: Tạo ngân sách gia đình
**Actor(s)**: Admin

**Mục tiêu**: Tạo ngân sách theo tháng/chu kỳ cho gia đình.

**Tiền đề**: Admin đã đăng nhập.

**Luồng chính**:
1. Admin mở màn hình Ngân sách
2. Tạo ngân sách mới (tên, tổng, phân bổ danh mục)
3. Lưu & hệ thống thể hiện dashboard ngân sách

**API**: POST /budgets

(Điền template chi tiết bên trên)

---

## 5. Quản Lý Thói Quen

### UC-501: Tạo thói quen gia đình
**Actor(s)**: Admin

**Mục tiêu**: Tạo thói quen, gán cho thành viên, đặt nhắc nhở.

**Tiền đề**: Admin đã đăng nhập.

**Luồng chính**:
1. Admin tạo thói quen: tên, mô tả, tần suất, gán thành viên
2. Lưu -> Gửi thông báo nhắc nhở theo lịch
3. Thành viên đánh dấu hoàn thành
4. Hệ thống cập nhật streak

**API**: POST /habits

(Điền template chi tiết bên trên)

---

## 6. Báo Cáo & Phân Tích

### UC-601: Xem báo cáo chi tiêu hàng tháng
**Actor(s)**: Admin, Member

**Mục tiêu**: Hiển thị tổng chi tiêu, biểu đồ theo danh mục, so sánh tháng.

**Tiền đề**: Người dùng đã đăng nhập; có dữ liệu giao dịch.

**Luồng chính**:
1. Mở màn hình Báo cáo
2. Chọn khoảng thời gian
3. Hệ thống hiển thị biểu đồ, bảng, số liệu

**API**: GET /analytics/monthly

(Điền template chi tiết bên trên)

---

## 7. Chat & AI Assistant

### UC-701: Chat với AI trợ lý tài chính
**Actor(s)**: Member

**Mục tiêu**: Trao đổi bằng conversation text, nhận gợi ý, tóm tắt chi tiêu.

**Tiền đề**: Người dùng đã đăng nhập; có kết nối internet.

**Luồng chính**:
1. Mở chat AI
2. Gửi câu hỏi / câu lệnh
3. AI trả lời, có thể kèm gợi ý/khuyến nghị/đề xuất hành động

**API**: POST /ai/chat

(Điền template chi tiết bên trên)

---

## 8. Thông Báo

### UC-801: Gửi cảnh báo vượt hạn mức
**Actor(s)**: System, Admin

**Mục tiêu**: Khi giao dịch khiến thành viên vượt hạn mức, gửi cảnh báo push/email.

**Tiền đề**: Hệ thống có cấu hình thông báo.

**Luồng chính**:
1. Giao dịch được tạo
2. Hệ thống kiểm tra hạn mức -> Phát hiện vượt
3. Gửi thông báo push/email/Inbox

**API**: POST /notifications

(Điền template chi tiết bên trên)

---

## 9. Quản Lý Tài Khoản

### UC-901: Đăng nhập / Đăng ký
**Actor(s)**: Người dùng

**Mục tiêu**: Authentication, tạo session, đăng ký mới.

**Tiền đề**: none

**Luồng chính**:
1. Màn hình đăng nhập/đăng ký
2. Nhập thông tin, xác thực
3. Tạo token/session
4. Chuyển tới dashboard

**API**: POST /auth/login, POST /auth/register

(Điền template chi tiết bên trên)

---

## 10. Cài Đặt

### UC-1001: Thay đổi ngôn ngữ
**Actor(s)**: Người dùng

**Mục tiêu**: Đổi ngôn ngữ hiển thị giữa VN/EN.

**Tiền đề**: Người dùng đã đăng nhập.

**Luồng chính**:
1. Vào màn hình cài đặt
2. Chọn ngôn ngữ
3. Lưu -> UI cập nhật

(Điền template chi tiết bên trên)

---

## Phần bổ sung (Nếu cần)
- Bổ sung danh sách các business rules chung
- Mapping user roles -> permissions
- Mẫu email/invite messages
- Các API contracts (request/response mẫu)

---

## Ghi chú
- Nếu bạn muốn, tôi có thể:  
  - Giúp bạn điền chi tiết cho một hoặc nhiều use case (tôi có thể soạn chi tiết luồng, test cases, tiêu chí nghiệm thu),  
  - Hoặc xuất file PlantUML từ danh sách này để vẽ sơ đồ use case.

---

*File được tạo: `USE_CASES_DETAILS.md`*
