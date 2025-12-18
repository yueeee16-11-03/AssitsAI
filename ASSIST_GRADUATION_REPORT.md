# LỜI MỞ ĐẦU

Trong thế giới hiện đại, mỗi cá nhân phải quản lý nhiều khía cạnh của cuộc sống: chi tiêu hàng ngày, quản lý ngân sách, theo dõi thói quen lành mạnh và các mục tiêu cá nhân. Tuy nhiên, hầu hết mọi người gặp khó khăn trong việc theo dõi chi tiêu một cách có hệ thống, phân loại chi tiêu, và hiểu rõ các thói quen tiêu dùng của mình. Nhiều ứng dụng tồn tại nhưng hầu hết chỉ tập trung vào một khía cạnh, hoặc không cung cấp những phân tích sâu sắc về hành vi tài chính và thói quen cá nhân. Từ nhu cầu thực tiễn ấy, dự án Assist được hình thành với mong muốn giúp mỗi cá nhân quản lý tài chính hiệu quả, theo dõi thói quen, và đạt được các mục tiêu cá nhân thông qua công nghệ.

Assist là một ứng dụng di động được xây dựng nhằm hỗ trợ người dùng trong việc quản lý chi tiêu, theo dõi thói quen hàng ngày, đặt mục tiêu tài chính, và nhận được những gợi ý thông minh dựa trên dữ liệu AI. Ứng dụng được phát triển trên nền tảng React Native, tích hợp dịch vụ Firebase (Authentication, Firestore, Storage, Cloud Messaging) cho quản lý dữ liệu thời gian thực, và backend Node.js cho các dịch vụ như xử lý hình ảnh, phân tích dữ liệu và API. Đồng thời, ứng dụng sử dụng Gemini AI để cung cấp những gợi ý cá nhân hóa về quản lý tài chính, phân tích chi tiêu và định hướng thói quen sống.

Trong quá trình thực hiện đồ án, em đã học hỏi nhiều điều về kỹ thuật, thiết kế giao diện, quản lý dữ liệu và quy trình phát triển phần mềm. Sự hướng dẫn tận tình và những góp ý quý báu từ GV hướng dẫn đã giúp em từng bước hoàn thiện sản phẩm của mình.

Em xin chân thành cảm ơn!

# CHƯƠNG 1: MÔ TẢ BÀI TOÁN VÀ YÊU CẦU HỆ THỐNG ASSIST

## 1.1. Bài toán của Assist

### 1.1.1. Vấn đề thực tiễn

Trong thực tế, hầu hết mọi người gặp khó khăn trong việc quản lý chi tiêu cá nhân, theo dõi thói quen hàng ngày, và đặt mục tiêu tài chính hiệu quả. Nhiều người không biết mình đã chi tiêu bao nhiêu, tiền đã đi đâu, hoặc làm thế nào để tiết kiệm hơn. Thêm vào đó, việc duy trì những thói quen lành mạnh (tập thể dục, đọc sách, học tập) cũng là thách thức lớn.

**Các vấn đề cụ thể gặp phải:**

1. **Quản lý chi tiêu:**
   - Không theo dõi chi tiêu hàng ngày → không biết tiền đi đâu
   - Khó phân loại chi tiêu (thực phẩm, giao thông, giải trí, v.v.)
   - Không có ước tính chi tiêu tối đa cho mỗi danh mục
   - Khó so sánh chi tiêu giữa các kỳ (tuần vs tuần, tháng vs tháng)
   - Lưu tệp hóa đơn không có hệ thống → khó tra cứu lại

2. **Theo dõi thói quen:**
   - Khó theo dõi tiến độ thói quen lâu dài (vì quên, lười ghi chép)
   - Không có cơ chế khuyến khích (streak, badges, progress bars)
   - Không nhận được lời động viên hay nhắc nhở

3. **Tài chính & Tiết kiệm:**
   - Không lên kế hoạch tài chính / đặt mục tiêu tiết kiệm
   - Không có gợi ý thông minh về cách tiết kiệm dựa trên hành vi
   - Không hiểu rõ xu hướng chi tiêu của mình (chi tiêu nhiều vào mục đích gì nhất)

4. **Cộng đồng & Kinh nghiệm:**
   - Khó tìm mẹo tiết kiệm từ người khác
   - Không có nơi chia sẻ kinh nghiệm quản lý tài chính
   - Cảm thấy cô độc trong quá trình quản lý tài chính

**Giải pháp:** Assist là ứng dụng di động hỗ trợ quản lý chi tiêu chi tiết, theo dõi thói quen cá nhân, đặt và theo dõi mục tiêu, cung cấp phân tích thông minh và gợi ý dựa trên AI để giúp người dùng sống hiệu quả hơn.

### 1.1.2. Mục tiêu chính của Assist

1. **Quản lý tài chính:**
   - Giúp người dùng ghi nhận chi tiêu hàng ngày một cách dễ dàng
   - Tự động phân loại chi tiêu theo danh mục
   - Cung cấp biểu đồ, báo cáo chi tiêu chi tiết
   - So sánh chi tiêu giữa các kỳ để nhận diện xu hướng

2. **Theo dõi & Động viên thói quen:**
   - Giúp người dùng tạo và theo dõi thói quen lành mạnh
   - Ghi nhận check-in hàng ngày với tính năng streak (chuỗi liên tiếp)
   - Gửi reminder nhắc nhở check-in
   - Hiển thị tiến độ & motivation badges

3. **Phân tích thông minh (AI):**
   - Phân tích dữ liệu chi tiêu để nhận diện mô hình tiêu dùng
   - Gợi ý cách tiết kiệm dựa trên hành vi cá nhân
   - Cảnh báo chi tiêu quá mức
   - Đưa ra lời khuyên về quản lý tài chính & thói quen

4. **Xây dựng cộng đồng:**
   - Tạo nền tảng chia sẻ kinh nghiệm & mẹo tiết kiệm
   - Cho phép người dùng bình luận, thảo luận với nhau
   - Xây dựng môi trường tích cực & hỗ trợ lẫn nhau

## 1.2. Khảo sát nghiệp vụ

Khảo sát nghiệp vụ giúp nhận diện các yêu cầu cốt lõi, tương tác người dùng và quy trình chính của ứng dụng Assist. Ứng dụng phục vụ ba loại người dùng chính: người dùng cá nhân quản lý chi tiêu và thói quen; cộng đồng chia sẻ kinh nghiệm và mẹo tiết kiệm; và quản trị viên duyệt nội dung cộng đồng.

## 1.2. Khảo sát nghiệp vụ (Business Requirements)

Khảo sát nghiệp vụ giúp nhận diện các yêu cầu cốt lõi, tương tác người dùng và quy trình chính của ứng dụng Assist. Ứng dụng phục vụ ba loại người dùng chính: người dùng cá nhân quản lý chi tiêu và thói quen; cộng đồng chia sẻ kinh nghiệm và mẹo tiết kiệm; và quản trị viên duyệt nội dung cộng đồng.

### 1.2.1. Các loại người dùng (Actors) & Personas

#### **Actor 1: Personal User (Người dùng cá nhân)**
- **Mô tả**: Người muốn quản lý tài chính cá nhân và theo dõi thói quen hàng ngày
- **Đặc điểm**:
  - Độ tuổi: 18-45 tuổi
  - Giáo dục: Cao đẳng trở lên
  - Kỹ năng công nghệ: Trung bình trở lên
  - Mục tiêu: Tiết kiệm tiền, quản lý chi tiêu, duy trì thói quen tốt
  - Thói quen sử dụng: Sử dụng app hàng ngày (check-in, xem insights)
- **Nhu cầu cụ thể**:
  - Ghi nhận chi tiêu nhanh chóng (< 30 giây)
  - Xem biểu đồ chi tiêu dễ hiểu
  - Nhận gợi ý cá nhân hóa từ AI
  - Được động viên duy trì thói quen
  - Xem tiến độ & thành tích cá nhân

#### **Actor 2: Community Member (Thành viên cộng đồng)**
- **Mô tả**: Người muốn chia sẻ kinh nghiệm & học từ người khác
- **Đặc điểm**:
  - Quan tâm đến quản lý tài chính & thói quen sống
  - Muốn chia sẻ & giúp đỡ người khác
  - Yêu thích đọc bài viết & bình luận
- **Nhu cầu cụ thể**:
  - Đọc bài viết hay từ cộng đồng
  - Chia sẻ mẹo tiết kiệm riêng
  - Bình luận & thảo luận
  - Like, bookmark bài viết yêu thích
  - Follow người dùng hay đóng góp

#### **Actor 3: Admin (Quản trị viên)**
- **Mô tả**: Người duyệt bài viết chuyên gia, xử lý báo cáo, quản lý hệ thống
- **Đặc điểm**:
  - Là nhân viên đội ngũ quản lý ứng dụng
  - Hiểu rõ về chính sách cộng đồng
  - Cần xem toàn bộ dữ liệu (users, posts, reports)
- **Nhu cầu cụ thể**:
  - Duyệt bài viết chuyên gia (Articles) nhanh chóng
  - Xem & xử lý báo cáo từ cộng đồng
  - Quản lý danh mục chi tiêu
  - Xem thống kê & dashboard hệ thống
  - Ghi lại lịch sử hành động (audit log)

### 1.2.2. Mục tiêu và chức năng chính

**Mục tiêu chính**: Phát triển một ứng dụng di động cho phép quản lý chi tiêu chi tiết, theo dõi thói quen cá nhân, phân tích tài chính với AI, và kết nối cộng đồng chia sẻ kinh nghiệm.

**Chức năng chính**:
- Ghi nhận và phân loại chi tiêu hàng ngày, theo dõi ví và nguồn thu nhập.
- Quản lý thói quen cá nhân (check-in hàng ngày, theo dõi tiến độ, đặt mục tiêu).
- Phân tích tài chính với biểu đồ, báo cáo chi tiêu theo thời gian và danh mục.
- Gợi ý thông minh từ Gemini AI dựa trên hành vi chi tiêu và thói quen.
- Tạo và chia sẻ bài viết cộng đồng, bình luận, và đánh giá.
- Quản trị nội dung và xử lý báo cáo vi phạm.

### 1.2.3. Quy trình nghiệp vụ chi tiết

#### **1. Quy trình ghi nhận chi tiêu (Add Transaction Flow)**

Quy trình ghi nhận chi tiêu là một trong những tính năng cốt lõi của Assist. Người dùng cần có khả năng ghi nhận chi tiêu một cách nhanh chóng (dưới 30 giây) để không quên. Quy trình chi tiết như sau:

1. **Bước 1 - Mở Add Transaction Screen**: Người dùng nhấn nút "+" (FAB - Floating Action Button) trên Dashboard. Ứng dụng sẽ chuyển đến màn hình "Add Transaction".

2. **Bước 2 - Nhập thông tin chi tiêu**:
   - **Số tiền (Amount)**: Nhập số tiền chi tiêu (VND hoặc loại tiền khác)
   - **Danh mục (Category)**: Chọn từ danh sách danh mục có sẵn (Food & Dining, Transport, Shopping, Entertainment, Healthcare, Education, Utilities, Other)
   - **Ví (Wallet)**: Chọn ví sẽ bị trừ (Tiền mặt, Thẻ tín dụng, Tài khoản ngân hàng, E-wallet)
   - **Ghi chú (Description)**: Nhập ghi chú tùy chọn (ví dụ: "Cơm trưa tại nhà hàng X")
   - **Ngày (Date)**: Chọn ngày chi tiêu (mặc định là hôm nay)
   - **Hình ảnh (Receipt Image)**: Tùy chọn upload ảnh hóa đơn từ camera hoặc gallery

3. **Bước 3 - Kiểm tra dữ liệu**: Trước khi lưu, ứng dụng kiểm tra:
   - Số tiền phải > 0
   - Danh mục bắt buộc
   - Ví bắt buộc
   - Định dạng dữ liệu hợp lệ

4. **Bước 4 - Lưu vào Firestore**: 
   - Tạo document mới trong collection "transactions"
   - Document id được tự động sinh
   - Lưu các field: userId, amount, category, walletId, description, date, imageUrl (nếu có), createdAt, updatedAt, status (verified/pending)

5. **Bước 5 - Cập nhật ví**: 
   - Giảm balance của ví đã chọn đi số tiền chi tiêu
   - Cập nhật trường "updatedAt" trong wallet

6. **Bước 6 - Xử lý hình ảnh (nếu có)**:
   - Upload ảnh lên Cloud Storage tại đường dẫn: `transactions/{userId}/{transactionId}_timestamp.jpg`
   - Gọi Gemini AI để phân loại tự động (OCR) nếu cần
   - Cập nhật imageUrl trong transaction document

7. **Bước 7 - Xử lý mặt sau (Backend)**:
   - Trigger Cloud Function để tạo thống kê hàng ngày
   - Cập nhật tổng chi tiêu tháng này
   - Kiểm tra xem có vượt budget không (gửi thông báo cảnh báo nếu cần)

8. **Bước 8 - Hiển thị phản hồi**:
   - Hiển thị toast notification: "Ghi nhận chi tiêu thành công ✓"
   - Cập nhật lại Dashboard (hiển thị tổng chi tiêu hôm nay)
   - Cập nhật lại Finance Screen (danh sách giao dịch)
   - Quay lại Dashboard hoặc cho phép tiếp tục thêm chi tiêu mới

#### **2. Quy trình quản lý thói quen (Habit Management Flow)**

Quy trình quản lý thói quen giúp người dùng duy trì các thói quen tốt và theo dõi tiến độ dài hạn.

1. **Bước 1 - Tạo thói quen mới**: 
   - Người dùng nhấn nút "Create Habit" trên Habit Screen
   - Mở form tạo thói quen với các field:
     - **Tên thói quen**: "Tập thể dục buổi sáng", "Đọc sách 30 phút", "Uống nước 2L mỗi ngày"
     - **Mô tả chi tiết**: Mô tả chi tiết để có động lực hơn
     - **Danh mục**: Health, Learning, Productivity, Financial, Social
     - **Tần suất**: Hàng ngày (Daily), Hàng tuần (Weekly - chọn ngày), Hàng tháng (Monthly - chọn ngày)
     - **Nhắc nhở**: Bật/tắt, chọn thời gian (ví dụ: 6:00 AM hàng ngày)
     - **Mục tiêu**: Số ngày liên tiếp cần đạt được (ví dụ: 100 ngày)

2. **Bước 2 - Lưu thói quen**:
   - Tạo document trong collection "habits" với id tự động sinh
   - Lưu các field: userId, title, description, category, frequency, reminderTime, targetDays, createdAt, updatedAt, status (active/paused/completed)

3. **Bước 3 - Bật thông báo (Notifications)**:
   - Thiết lập Cloud Messaging để gửi notification hàng ngày ở thời gian đã chọn
   - Notification sẽ nhắc nhở người dùng check-in thói quen
   - Nếu bị bỏ qua 2 ngày liên tiếp, có thể reset streak

4. **Bước 4 - Check-in hàng ngày**:
   - Khi người dùng mở app, sẽ thấy danh sách thói quen hôm nay
   - Người dùng nhấn checkbox ✓ để đánh dấu hoàn thành hoặc ✗ để bỏ qua
   - (Optional) Thêm ghi chú: "Ran 6.2km in 35 mins"

5. **Bước 5 - Tính toán streak & progress**:
   - Lưu check-in vào sub-collection "checkIns" với document id = `{habitId}_{date}`
   - Kiểm tra ngày hôm qua đã check-in chưa
   - Nếu hôm nay completed + hôm qua completed = streak += 1
   - Nếu hôm nay bỏ qua hoặc hôm qua không completed = streak reset về 0
   - Nếu streak mới > longestStreak = cập nhật longestStreak

6. **Bước 6 - Hiển thị thành tích**:
   - Hiển thị streak: "🔥 25 days" với icon lửa
   - Hiển thị completion rate: "85% this month" (tính từ số ngày completed / tổng ngày)
   - Hiển thị timeline 7 ngày gần nhất: ✓ ✓ ✗ ✓ ✓ ✓ ✓
   - Hiển thị milestone: "3 more days to 100-day streak!" và gợi ý "Keep going!"

7. **Bước 7 - Gửi thông báo Milestone**:
   - Khi streak đạt milestone (7, 30, 100, 365 ngày), gửi notification đặc biệt
   - Badge achievement: "🏆 100-Day Champion" được mở khóa
   - Lưu achievement vào user profile

#### **3. Quy trình phân tích tài chính (Financial Analytics Flow)**

Quy trình phân tích tài chính giúp người dùng hiểu rõ hành vi chi tiêu của mình và có quyết định tài chính tốt hơn.

1. **Bước 1 - Mở Finance Screen**:
   - Người dùng nhấn tab "Finance" ở bottom navigation
   - Ứng dụng tải dữ liệu giao dịch từ Firestore

2. **Bước 2 - Chọn thời gian phân tích**:
   - Người dùng có thể chọn một trong các khoảng thời gian:
     - **Hôm nay (Today)**: Chi tiêu từ 00:00 đến 23:59 hôm nay
     - **Tuần này (This Week)**: Chi tiêu từ thứ 2 đến chủ nhật tuần hiện tại
     - **Tháng này (This Month)**: Chi tiêu từ ngày 1 đến ngày cuối tháng
     - **Năm này (This Year)**: Chi tiêu từ 1/1 đến 31/12
     - **Tùy chỉnh (Custom)**: Chọn từ ngày đến ngày tùy ý

3. **Bước 3 - Chọn loại biểu đồ**:
   - **Pie Chart**: Phân bổ chi tiêu theo danh mục (%)
     - Tap vào từng slice để xem chi tiết giao dịch trong danh mục đó
   - **Bar Chart**: So sánh chi tiêu giữa các ngày hoặc tuần
     - Hiển thị đường trung bình (avg line)
     - Highlight kỳ hiện tại (trong màu sáng hơn)
   - **Line Chart**: Xu hướng chi tiêu theo thời gian
     - Thấy được pattern (ví dụ: chi tiêu tăng vào cuối tháng)

4. **Bước 4 - Xem chi tiết**:
   - Tap vào chart slice/bar để xem chi tiết các giao dịch trong khoảng đó
   - Danh sách giao dịch hiển thị: description, amount, category, date, wallet

5. **Bước 5 - So sánh với kỳ trước**:
   - Ứng dụng tự động tính toán và so sánh với kỳ trước
   - Hiển thị: "Chi tiêu tháng này: 5,000,000 VND (+ 15% vs tháng trước)"
   - Nếu tăng quá nhiều (>20%), hiển thị cảnh báo: "⚠️ Chi tiêu tăng đột ngột!"

6. **Bước 6 - Phân tích chi tiêu theo danh mục**:
   - Bảng chi tiết cho từng danh mục: Tổng chi tiêu, % so với tổng, trand (↑/↓)
   - Top spending category được highlight
   - Danh mục tiết kiệm nhiều nhất so với budget

7. **Bước 7 - Tạo báo cáo**:
   - Nút "Export Report": Xuất báo cáo dạng PDF
   - Báo cáo bao gồm: Biểu đồ, thống kê, nhận xét chi tiêu
   - Có thể chia sẻ với bạn bè hoặc lưu để xem lại

#### **4. Quy trình AI gợi ý (Gemini AI Recommendation Flow)**

Quy trình AI gợi ý sử dụng Gemini AI để phân tích dữ liệu của người dùng và đưa ra gợi ý cá nhân hóa.

1. **Bước 1 - Trigger gợi ý**:
   - **Tự động**: Mỗi tuần (Thứ 2 sáng 8:00 AM), hệ thống tự động sinh insight
   - **Manual**: Người dùng nhấn "Get AI Insights" trên Home Screen
   - Backend trigger Cloud Function để gọi Gemini API

2. **Bước 2 - Chuẩn bị dữ liệu**:
   - Lấy tất cả giao dịch của người dùng trong 7 ngày gần nhất
   - Lấy thông tin thói quen (check-in status, streak)
   - Lấy mục tiêu tài chính (goals) nếu có
   - Tính toán: Tổng chi tiêu, chi tiêu theo danh mục, thay đổi so với tuần trước

3. **Bước 3 - Gọi Gemini AI**:
   - Gửi prompt với đầy đủ dữ liệu đến Gemini API
   - Prompt yêu cầu Gemini:
     - Phân tích chi tiêu: Category nào chi tiêu nhiều nhất, xu hướng
     - Nhận dạng pattern bất thường: Chi tiêu quá cao hay bất thường
     - Gợi ý tiết kiệm: Đề xuất cách giảm chi tiêu cho từng danh mục
     - Đánh giá thói quen: Thói quen nào tốt, nào cần cải thiện
     - Động viên: Lời khuyên khuyến khích dựa trên tiến độ

4. **Bước 4 - Nhận kết quả từ Gemini**:
   - Gemini trả về insight text có cấu trúc
   - Kết quả bao gồm: Tiêu đề, nội dung chi tiết, gợi ý hành động, confidence level

5. **Bước 5 - Lưu Insight vào Firestore**:
   - Tạo document trong collection "insights"
   - Lưu: userId, type (spending_analysis/saving_tip/habit_advice/goal_progress), title, content, generatedAt, createdAt, read (false)

6. **Bước 6 - Gửi thông báo**:
   - Gửi push notification: "💡 New insight: You spent 15% more on Food this week. Check recommendations!"
   - Người dùng có thể nhấn notification để đi thẳng đến Insights screen

7. **Bước 7 - Hiển thị Insight**:
   - Danh sách insights hiển thị trên "Insights" tab
   - Insights mới được hiển thị ở đầu (newest first)
   - Insight chưa đọc có badge "NEW" hoặc indicator khác biệt
   - Tap vào insight để xem full content
   - Có thể lưu, chia sẻ, hoặc đánh dấu là hữu ích

#### **5. Quy trình cộng đồng (Community Posts & Interactions)**

Quy trình cộng đồng cho phép người dùng chia sẻ kinh nghiệm và học từ nhau.

1. **Bước 1 - Tạo bài viết**:
   - Người dùng nhấn "+" trên Community tab
   - Mở form tạo bài viết với field:
     - **Tiêu đề (Title)**: Tiêu đề bài viết (bắt buộc)
     - **Nội dung (Content)**: Nội dung chính (hỗ trợ rich text: bold, italic, link)
     - **Hình ảnh (Images)**: Có thể upload 1-5 ảnh (carousel)
     - **Tags**: Thêm tags để phân loại (#tiết_kiệm, #thói_quen, #tài_chính)
     - **Danh mục (Category)**: Financial Tips, Habit Advice, General, Story
     - **Status**: Draft hoặc Publish ngay

2. **Bước 2 - Xác thực & lưu bài viết**:
   - Kiểm tra tiêu đề & nội dung không để trống
   - Kiểm tra content không chứa từ ngữ nhạy cảm (dùng keyword filter)
   - Nếu từ ngữ nhạy cảm, bài viết cần duyệt bởi admin trước khi publish
   - Tạo document trong collection "posts" với: authorId, title, content, tags, category, imageUrls, createdAt, updatedAt, status (published/draft/archived), likes, comments

3. **Bước 3 - Hiển thị trên Community Feed**:
   - Bài viết published hiển thị trên Community feed
   - Order theo: newest (mặc định), trending (by likes + comments), popular (all-time)
   - Infinite scroll, load 10 bài viết mỗi lần

4. **Bước 4 - Tương tác với bài viết**:
   - **Like**: Nhấn ❤️ để like bài viết (toggle on/off)
   - **Comment**: Nhấn bình luận để thêm comment
   - **Share**: Chia sẻ qua messaging, social media, hoặc copy link
   - **Bookmark**: Lưu bài viết vào "Saved" để xem sau
   - **Report**: Report bài viết nếu vi phạm community guidelines

5. **Bước 5 - Bình luận & thảo luận**:
   - Người dùng viết comment dưới bài viết
   - Support nested comments (reply to comment)
   - Có thể edit/delete comment của mình trong 24 giờ
   - Mention người dùng khác bằng @username
   - Emoji support

6. **Bước 6 - Follow & Notification**:
   - Người dùng có thể follow tác giả bài viết
   - Khi follow user tạo bài viết mới, sẽ nhận notification
   - Khi được reply, sẽ nhận notification

#### **6. Quy trình quản trị (Admin Report Processing)**

Quy trình quản trị giúp admin duyệt nội dung và xử lý report từ cộng đồng.

1. **Bước 1 - Nhận báo cáo từ cộng đồng**:
   - Người dùng report bài viết/comment vi phạm
   - Chọn lý do report: spam, inappropriate, misleading, offensive, other
   - Thêm mô tả chi tiết (optional)
   - Report được lưu trong collection "reports"

2. **Bước 2 - Admin xem Report Queue**:
   - Admin mở Admin Panel → Reports section
   - Xem danh sách reports (sorted by newest)
   - Filter by: status (open/processing/resolved), reason, date range
   - Xem số report chưa xử lý (notification badge)

3. **Bước 3 - Preview nội dung**:
   - Admin click vào report để xem chi tiết
   - Hiển thị: content được report, lý do report, mô tả, số lần report tương tự

4. **Bước 4 - Đưa ra quyết định**:
   - Admin có 4 options:
     - **Approve**: Báo cáo hợp lệ, nội dung vi phạm
     - **Dismiss**: Báo cáo không hợp lệ, nội dung hợp lệ
     - **Request Review**: Cần kiểm tra lại, chuyển cho admin khác
     - **Contact User**: Gửi warning message cho tác giả

5. **Bước 5 - Áp dụng hành động**:
   - Nếu approve report:
     - **Hide content**: Ẩn bài viết/comment, người dùng khác không thấy
     - **Delete content**: Xóa vĩnh viễn bài viết/comment
     - **Ban user**: Cấm user posting/commenting (temporary hoặc permanent)
     - **Soft delete**: Archive bài viết, có thể khôi phục trong 30 ngày
   - Ghi reason: "Posted adult content", "Spam", "Misleading information"
   - Gửi message cho tác giả: "Your post has been removed due to violation of guidelines: [reason]. Appeal here."

6. **Bước 6 - Cập nhật status**:
   - Đánh dấu report status: resolved
   - Ghi timestamp & admin id
   - Lưu lịch sử action vào auditLogs

7. **Bước 7 - Monitoring**:
   - Admin có dashboard stats: Total reports, resolved, pending, users with most violations
   - Có trend chart: reports by reason, by date
   - Alert nếu có user với quá nhiều violations (auto-ban có thể được triggered)

### 1.2.4. Liên kết đến các chương tiếp theo

## 1.3. Phân tích thị trường & các ứng dụng tương tự (Competitive Analysis)

Sau khi khảo sát thị trường, một số sản phẩm tương tự có thể tham khảo được liệt kê dưới đây:

### 1.3.1. **Spendee** - Ứng dụng quản lý chi tiêu di động

**Mô tả**: Ứng dụng quản lý chi tiêu cá nhân được phát triển bởi đội ngũ Ađá, hỗ trợ đồng bộ hóa đa thiết bị và phân loại chi tiêu thông minh.

**Đặc điểm chính:**
- Giao diện đẹp, thân thiện, dễ sử dụng
- Phân loại chi tiêu tự động (hỗ trợ 50+ danh mục)
- Đồng bộ hóa real-time giữa các thiết bị (web, mobile)
- Báo cáo chi tiêu chi tiết với biểu đồ đa dạng
- Hỗ trợ 150+ loại tiền tệ
- Chia sẻ ví với gia đình/bạn bè (shared wallets)

**Ưu điểm:**
- UX/UI rất tốt, tập trung vào tính năng cốt lõi
- Đồng bộ hóa nhanh, ổn định
- Báo cáo chi tiêu chi tiết & dễ hiểu
- Hỗ trợ multiple currencies

**Nhược điểm:**
- Không có tính năng theo dõi thói quen
- Không có cộng đồng chia sẻ
- Không tích hợp AI gợi ý thông minh
- Chỉ tập trung vào quản lý chi tiêu, thiếu holistic approach

**So sánh với Assist:**
| Tính năng | Spendee | Assist |
|---|---|---|
| Quản lý chi tiêu | ✅ | ✅ |
| Biểu đồ & báo cáo | ✅ | ✅ |
| Theo dõi thói quen | ❌ | ✅ |
| AI gợi ý | ❌ | ✅ |
| Cộng đồng chia sẻ | ❌ | ✅ |
| Shared wallets | ✅ | 🔄 (planned) |

### 1.3.2. **YNAB (You Need A Budget)** - Ứng dụng quản lý ngân sách

**Mô tả**: YNAB là một ứng dụng quản lý ngân sách theo phương pháp YNAB (4 rules), giúp người dùng lập kế hoạch tài chính toàn diện.

**Đặc điểm chính:**
- Phương pháp YNAB 4 rules: Give every dollar a job, Embrace your true expenses, Roll with the punches, Age your money
- Tích hợp với tài khoản ngân hàng (bank sync)
- Báo cáo chi tiêu chi tiết & dashboard trực quan
- Hỗ trợ iOS, Android, Web
- Cộng đồng hỗ trợ & tài liệu học tập phong phú

**Ưu điểm:**
- Phương pháp quản lý ngân sách mạnh mẽ & hiệu quả
- Tích hợp ngân hàng, tự động hóa transaction sync
- Báo cáo chi tiết & thống kê về tiến độ budget
- Cộng đồng lớn với nhiều tài liệu hướng dẫn
- Dịch vụ tốt, hỗ trợ khách hàng tuyệt vời

**Nhược điểm:**
- Chi phí subscription cao ($ 14.99/tháng hoặc $179.99/năm)
- Giao diện & UX hơi phức tạp, có curve learning
- Không có tính năng theo dõi thói quen
- Không có AI gợi ý cá nhân hóa
- Tập trung vào ngân sách, không phải tiêu dùng hàng ngày

**So sánh với Assist:**
| Tính năng | YNAB | Assist |
|---|---|---|
| Quản lý ngân sách | ✅ (Specialized) | ✅ (Basic) |
| Tích hợp ngân hàng | ✅ | ❌ |
| Theo dõi thói quen | ❌ | ✅ |
| AI gợi ý | ❌ | ✅ |
| Cộng đồng | ✅ (Limited) | ✅ |
| Giá cả | $$ (Freemium/Paid) | Free / Premium (TBD) |

### 1.3.3. **Habitica** - Ứng dụng theo dõi thói quen & quản lý công việc

**Mô tả**: Habitica là một ứng dụng gamified để theo dõi thói quen, quản lý task, và xây dựng kỹ năng sống. Nó biến cuộc sống thực thành một trò chơi RPG.

**Đặc điểm chính:**
- Hệ thống gamification: Character customization, leveling, quests, rewards
- Theo dõi habits, daily tasks, one-time to-dos
- Social features: Parties (team), guilds, challenges
- Boss battles (team vs shared boss)
- Daily login streaks & achievement badges
- Cộng đồng rất tích cực & engaged

**Ưu điểm:**
- Gamification tuyệt vời, rất motivating
- Tính năng theo dõi thói quen toàn diện
- Cộng đommunity rất sôi động & supportive
- Miễn phí với paid premium features
- Hỗ trợ team/social challenges

**Nhược điểm:**
- Không có tính năng quản lý chi tiêu
- Không có AI gợi ý thông minh
- UX hơi phức tạp với quá nhiều tính năng
- Gamification có thể quá distracting cho một số người
- Không tập trung vào quản lý tài chính

**So sánh với Assist:**
| Tính năng | Habitica | Assist |
|---|---|---|
| Quản lý chi tiêu | ❌ | ✅ |
| Theo dõi thói quen | ✅ | ✅ |
| Gamification | ✅ (Intensive) | 🔄 (Planned) |
| AI gợi ý | ❌ | ✅ |
| Cộng đồng & Social | ✅ | ✅ |
| Miễn phí | ✅ | ✅ |

### 1.3.4. **Mint** - Ứng dụng quản lý tài chính toàn diện

**Mô tả**: Mint (được tạo bởi Intuit, sau đó acquire bởi Credit Karma) là ứng dụng quản lý tài chính toàn diện, tích hợp ngân hàng, theo dõi đầu tư, phân tích chi tiêu.

**Đặc điểm chính:**
- Tích hợp 12,000+ tài khoản ngân hàng & credit card (USA/Canada)
- Quản lý chi tiêu, budget, savings goals
- Theo dõi đầu tư & net worth
- Gợi ý thông minh từ AI (Tip-based recommendations)
- Cảnh báo chi tiêu quá budget / unusual transactions
- Báo cáo chi tiêu chi tiết & credit score monitoring

**Ưu điểm:**
- Tích hợp ngân hàng rất mạnh mẽ (automatic sync)
- Toàn diện: quản lý chi tiêu, budget, đầu tư, credit
- Gợi ý thông minh & cảnh báo tự động
- Miễn phí & không quảng cáo
- Dashboard tổng hợp tất cả tài chính

**Nhược điểm:**
- Chỉ có sẵn ở USA/Canada (không dùng ở Việt Nam)
- Không có tính năng theo dõi thói quen
- Không có cộng đồng chia sẻ
- Tập trung vào investment & wealth management, không phải personal spending
- Privacy concerns với việc tích hợp ngân hàng

**So sánh với Assist:**
| Tính năng | Mint | Assist |
|---|---|---|
| Quản lý chi tiêu | ✅ | ✅ |
| Tích hợp ngân hàng | ✅ (USA/CA) | ❌ |
| Quản lý đầu tư | ✅ | ❌ |
| Theo dõi thói quen | ❌ | ✅ |
| AI gợi ý | ✅ | ✅ |
| Cộng đồng | ❌ | ✅ |
| Khu vực | USA/Canada | Global/Vietnam |

### 1.3.5. Bảng so sánh tổng hợp

| Tính năng | Spendee | YNAB | Habitica | Mint | **Assist** |
|---|---|---|---|---|---|
| 💰 Quản lý chi tiêu | ✅ | ✅ | ❌ | ✅ | ✅ |
| 📊 Biểu đồ & báo cáo | ✅ | ✅ | ❌ | ✅ | ✅ |
| 📋 Quản lý ngân sách | ❌ | ✅ | ❌ | ✅ | 🔄 |
| 💪 Theo dõi thói quen | ❌ | ❌ | ✅ | ❌ | ✅ |
| 🎮 Gamification | ❌ | ❌ | ✅ | ❌ | 🔄 |
| 🤖 AI gợi ý | ❌ | ❌ | ❌ | ✅ | ✅ |
| 🏦 Tích hợp ngân hàng | ✅ | ✅ | ❌ | ✅ | ❌ |
| 👥 Cộng đồng chia sẻ | ❌ | 🔄 | ✅ | ❌ | ✅ |
| 📱 Platform | iOS/Android/Web | iOS/Android/Web | iOS/Android/Web | iOS/Android/Web | iOS/Android |
| 💲 Giá | Freemium | $ 14.99/mo | Free/Premium | Free | Free/Premium |

### 1.3.6. Lợi thế cạnh tranh của Assist

**Kết hợp 3 tính năng chính:**
1. **Quản lý chi tiêu** (như Spendee, YNAB, Mint)
2. **Theo dõi thói quen** (như Habitica)
3. **AI gợi ý cá nhân hóa** (sử dụng Gemini AI)
4. **Cộng đồng chia sẻ** (tương tự Habitica)

Không có ứng dụng nào hiện tại kết hợp đầy đủ cả 4 tính năng này.

**Advantage:**
- Holistic approach: Quản lý cả tài chính lẫn thói quen sống
- AI-powered insights: Gợi ý thông minh dựa trên hành vi riêng
- Community support: Chia sẻ & học từ người khác
- Miễn phí để truy cập: Giúp dân số lớn tiếp cận
- Phù hợp với thị trường Việt Nam: Không yêu cầu tích hợp ngân hàng

### 1.3.7. Khả năng mở rộng tương lai

Assist có thể mở rộng sang các tính năng:
- **Tích hợp ngân hàng** (Fintech partnerships)
- **Quản lý đầu tư** (Stock, crypto tracking)
- **Bill payment & reminders** (Hóa đơn điện, nước, Internet)
- **Gamification levels** (Badges, achievements, leaderboards)
- **Multi-user households** (Chia sẻ ví gia đình)

#### **B. Chức năng của Thành viên cộng đồng (Community Member) - Chi tiết**

Ngoài các chức năng cá nhân, thành viên cộng đồng có các chức năng bổ sung:

| STT | Chức năng | Mô tả chi tiết | Priority |
|---|---|---|---|
| 1 | Tạo bài viết (Posts) | Viết bài chia sẻ kinh nghiệm tiết kiệm, quản lý tài chính, thói quen sống. Bài viết có thể chứa text, images (1-5 ảnh), tags, category. Draft tự động lưu, có thể publish sau. | HIGH |
| 2 | Xem feed cộng đồng | Danh sách bài viết từ tất cả users, infinite scroll (load thêm khi scroll xuống). Filter by: category, tags, popularity, newest. Search bài viết. | HIGH |
| 3 | Xem bài viết chuyên gia (Articles) | Bài viết chính thức từ admin/experts với badge "Official". Curated list hoặc bài viết hàng tuần. Xem số lượt view và feedback. | MEDIUM |
| 4 | Like & Bookmark | Like bài viết (toggle, hiển thị số likes realtime). Bookmark để xem sau (lưu vào "Saved" collection). Xem tất cả bài đã like/bookmark. | MEDIUM |
| 5 | Bình luận bài viết | Thêm comment dưới bài viết. Reply bình luận khác (nested comment). Edit/delete comment trong 24 giờ. Mention user (@username). Emoji support. | HIGH |
| 6 | Share bài viết | Chia sẻ link bài viết qua Whatsapp, Messenger, Facebook, Twitter hoặc copy link. Tracking share count. | MEDIUM |
| 7 | Follow người dùng | Follow/unfollow user hay đóng góp. Xem posts từ followed users. Notification khi follow user có bài mới. | MEDIUM |
| 8 | Báo cáo nội dung | Report bài viết/comment vi phạm (reason: spam, inappropriate, misleading, offensive). Thêm mô tả chi tiết. Được theo dõi bởi admin. | MEDIUM |
| 9 | Tìm kiếm & Lọc bài viết | Tìm kiếm theo: từ khóa (tiêu đề + nội dung), tag, danh mục, tác giả, date range. Sort by: popularity (likes), date (newest/oldest), relevance. | MEDIUM |
| 10 | Quản lý profile công khai | Xem profile của user khác (avatar, displayName, bio, posts, followers count). Xem bài viết và comment của họ. | MEDIUM |

#### **C. Chức năng của Quản trị viên (Admin) - Chi tiết**

| STT | Chức năng | Mô tả chi tiết | Priority |
|---|---|---|---|
| 1 | Quản lý người dùng | Xem danh sách users: total, active users (DAU/MAU), new users today. Search user (email, displayName, userId). Khóa/mở khóa tài khoản. Thay đổi role (user → expert → admin). Xem lịch sử login & hoạt động của user. | HIGH |
| 2 | Duyệt bài viết chuyên gia (Articles) | Xem articles pending (chờ duyệt). Preview nội dung. Approve/reject với reason. Pin/unpin bài viết official lên top. Set featured article. | HIGH |
| 3 | Quản lý bài viết cộng đồng (Posts) | Ẩn/xóa posts vi phạm. Phục hồi posts đã xóa (trong 30 ngày). Xem engagement metrics (views, likes, comments, shares). Detect spam/fake posts. | MEDIUM |
| 4 | Xử lý báo cáo (Reports Queue) | Xem danh sách reports (open/processing/resolved). Filter by reason, by date. Preview content được report. Review & take action (hide/delete/ban user). Ghi reason. Bulk action. | HIGH |
| 5 | Quản lý danh mục chi tiêu | CRUD danh mục (create, read, update, delete). Đặt danh mục mặc định. Hiển thị order/priority. Lock/unlock danh mục. Xem số lần dùng mỗi danh mục. | MEDIUM |
| 6 | Dashboard & Thống kê | Dashboard hiển thị: Total users, Active users (DAU/MAU), Avg spending per user, Top spending categories, Pending articles, Open reports, System health, Revenue metrics. Trend chart. | MEDIUM |
| 7 | Audit Log Viewer | Xem lịch sử hành động admin (approve/reject articles, ban users, delete content, hide posts). Timestamp, adminId, action, targetId, reason. Export audit log. | MEDIUM |
| 8 | Cấu hình hệ thống | Cài đặt: max spending warning threshold, report resolution SLA, default categories, notification settings, community guidelines, content moderation rules. | LOW |

### 1.4.2. Yêu cầu phi chức năng - Chi tiết mở rộng

#### **1.4.2.1. Hiệu năng (Performance) - Tiêu chuẩn chi tiết**

Hiệu năng là yếu tố quan trọng vì ứng dụng sẽ được sử dụng trên các thiết bị khác nhau với kết nối mạng khác nhau.

| Yêu cầu | Mục tiêu | Tiêu chí đánh giá | Implementation Strategy |
|---|---|---|---|
| App launch time | < 2 giây | Tính từ khi nhấn app icon đến UI interactive | Lazy load screens, preload critical data, optimize bundling |
| Initial load | < 1s | Tải giao diện chính (Dashboard) lần đầu | Firestore query optimization, Redux cache, image optimization |
| API response time | < 500ms (p95) | Firestore queries, Gemini API calls | Connection pooling, query optimization, CDN |
| List rendering (50 items) | < 1s | Scroll mượt, FlatList performance | Virtualization, pagination, memo components |
| Image loading | < 3s | Load ảnh hóa đơn, avatar | Compression, CDN, progressive loading |
| Memory usage | < 100MB | App running in background | Cleanup listeners, garbage collection, image cache management |
| Battery consumption | < 5% per hour | Idle usage | Optimize background tasks, reduce polling, use FCM instead of polling |
| Network usage | < 5MB per day | Regular usage (100 transactions/month) | Image compression, delta sync, efficient serialization |

#### **1.4.2.2. Khả năng mở rộng (Scalability) - Chiến lược tăng trưởng**

Assist phải có khả năng phục vụ từ vài trăm user hiện tại lên hàng triệu user trong tương lai.

| Yêu cầu | Target | Approach | Metrics |
|---|---|---|---|
| Concurrent users | 100K DAU (Year 1) | Firestore auto-scaling, Cloud Functions on-demand | Monitor connections per second |
| Data storage | 1TB (Year 1) | Firestore pricing, Cloud Storage archiving | Monitor usage, implement retention policy |
| Transactions per second | 1K TPS (peak) | Batch operations, Firestore sharding, collection pagination | Monitor latency, error rate |
| User growth | 50% month-over-month | Auto-scaling resources, load testing, database optimization | Monitor metrics, capacity planning |
| Geographic distribution | Support Vietnam & Southeast Asia | Regional deployments, CDN edge locations | Latency monitoring |

#### **1.4.2.3. Bảo mật (Security) - Chiến lược bảo vệ dữ liệu**

Dữ liệu tài chính người dùng là rất nhạy cảm, cần bảo vệ cấp cao.

| Yêu cầu | Mô tả | Implementation | Verification |
|---|---|---|---|
| Authentication | Đăng nhập an toàn | Firebase Authentication (email, OAuth Google/Facebook), 2FA support | Test login flow, verify tokens |
| Authorization | Kiểm tra quyền truy cập | Firebase Security Rules + backend validation, JWT tokens | Test unauthorized access |
| Data encryption | Mã hoá dữ liệu nhạy cảm | Encryption at rest (Firestore), HTTPS for transport, sensitive fields encrypted | Audit encryption, test decryption |
| Password policy | Password mạnh | Min 8 chars, mixed case, numbers, symbols, no dictionary words | Test weak passwords, force reset |
| API key protection | Giới hạn API key exposure | Environment variables, backend proxy, rotate keys monthly | Audit key usage, monitor leaks |
| Rate limiting | Chống brute force, DDoS | 10 requests/minute per IP, exponential backoff | Test with multiple requests |
| Data backup | Sao lưu dữ liệu | Firestore automated backups (daily), cross-region replication | Test restore procedure |
| Audit logging | Ghi lại hành động | /auditLogs collection, log all admin actions | Review logs, detect anomalies |
| Privacy compliance | Tuân thủ GDPR, local laws | Privacy policy, data retention, right to be forgotten, data export | Legal review, audit compliance |
| Vulnerability testing | Phát hiện lỗ hổng | Penetration testing, security scanning, code review | Regular testing, fix critical issues |

#### **1.4.2.4. Tính khả dụng (Availability) - Đảm bảo dịch vụ liên tục**

| Yêu cầu | Target | Method | SLA |
|---|---|---|---|
| Uptime | 99.5% (mục tiêu năm 1), 99.9% (năm 2+) | Multi-region deployment, redundancy, failover | 3.6 hours downtime/month (99.5%) |
| MTTR (Mean Time To Recovery) | < 1 hour | Automated failover, health checks, alert system | Page on-call engineer if issue |
| Backup frequency | Hàng ngày | Cloud Firestore automated backups | Test restore monthly |
| Disaster recovery | RPO < 1 hour, RTO < 2 hours | Cross-region replication, hot standby | Test DR procedure quarterly |
| Load balancing | Even distribution | Cloud Load Balancer, auto-scaling | Monitor traffic distribution |

#### **1.4.2.5. Trải nghiệm người dùng (User Experience) - Thiết kế thân thiện**

| Yêu cầu | Mô tả | Implementation |
|---|---|---|
| Responsive design | Hỗ trợ tất cả screen sizes | Design from 4.5" to 6.7" phones, test on multiple devices |
| Dark mode | Tùy chọn giao diện sáng/tối | Implement dark theme, persist preference to local storage |
| Offline support | Một số tính năng offline | Cache transaction list, allow offline check-in, sync on reconnect |
| Accessibility | WCAG 2.1 Level AA compliance | Screen reader support, high contrast, keyboard navigation, min touch targets 44x44 |
| Localization (i18n) | Hỗ trợ Vietnamese & English | Translate all strings, format dates/numbers by locale, RTL support (future) |
| Error handling | Friendly error messages | User-friendly errors, recovery suggestions, retry logic, offline indicators |
| Performance feedback | User feedback on actions | Toast notifications, loading states, progress indicators |

#### **1.4.2.6. Tính tuân thủ (Compliance) - Các quy định pháp lý**

| Yêu cầu | Mô tả | Action |
|---|---|---|
| GDPR | Quyền xóa dữ liệu, export data, privacy policy | Implement right to be forgotten, data export API, consent management |
| App store policies | Apple App Store, Google Play Store guidelines | Review content policy, implement parental controls if needed, metadata accuracy |
| Data residency | Data stored in regional servers (Vietnam preferred) | Use Google Cloud regions (asia-southeast1) for Vietnam, enable backups in same region |
| Privacy policy | Transparent data usage disclosure | Publish clear privacy policy, list data usage, 3rd party services |
| Terms of service | Clear community guidelines & usage terms | Publish ToS, community guidelines, enforce moderation |
| Financial data handling | Secure handling of financial information | Encryption, audit logging, compliance with finance regulations |

### 1.4.3. Mô hình dữ liệu chi tiết

#### **Entities & Relationships**

Hệ thống Assist sử dụng Firestore (NoSQL) với cấu trúc dữ liệu tối ưu. Tất cả dữ liệu được tổ chức thành 11 collection chính.

#### **1. Users Collection - Thông tin người dùng**

Mỗi user document chứa:
- **uid** (string, primary key): Firebase Authentication UID
- **email** (string): Email đăng nhập
- **displayName** (string): Tên hiển thị
- **avatar** (string): URL ảnh avatar (stored in Cloud Storage)
- **phone** (string, optional): Số điện thoại
- **bio** (string, optional): Tiểu sử cá nhân
- **currency** (string): Loại tiền tệ mặc định (VND, USD, etc.)
- **locale** (string): Ngôn ngữ (vi, en)
- **role** (string): Vai trò (user, expert, admin)
- **settings** (object): Cài đặt người dùng (notification preferences, dark mode, language)
- **createdAt** (timestamp): Thời điểm tạo tài khoản
- **updatedAt** (timestamp): Lần cập nhật gần nhất
- **status** (string): active, inactive, banned, deleted

Sub-collections:
- **wallets**: Danh sách ví của user
- **goals**: Danh sách mục tiêu tài chính
- **posts**: Danh sách bài viết của user
- **insights**: Gợi ý AI của user

#### **2. Transactions Collection - Ghi nhận chi tiêu**

Lưu tất cả giao dịch chi tiêu/thu nhập của tất cả users.

- **id** (string, primary key): Tự động sinh
- **userId** (string, FK): ID người dùng
- **walletId** (string, FK): Ví được sử dụng
- **amount** (number): Số tiền (positive cho expense, có dấu cho income)
- **category** (string): Danh mục (Food & Dining, Transport, etc.)
- **type** (string): expense, income, transfer
- **description** (string): Ghi chú chi tiêu
- **imageUrl** (string, optional): URL ảnh hóa đơn
- **date** (date): Ngày chi tiêu (format: YYYY-MM-DD)
- **tags** (array): Tags tự do (ví dụ: ["lunch", "restaurant"])
- **status** (string): verified, pending (nếu cần manual review)
- **createdAt** (timestamp): Thời điểm ghi nhận
- **updatedAt** (timestamp): Lần sửa cuối

Indexes: userId + date, category, walletId

#### **3. Habits Collection - Thói quen cá nhân**

- **id** (string, primary key): Tự động sinh
- **userId** (string, FK): Chủ sở hữu thói quen
- **title** (string): Tên thói quen
- **description** (string, optional): Mô tả chi tiết
- **category** (string): Health, Learning, Productivity, Financial, Social
- **frequency** (string): daily, weekly, monthly
- **frequencyDays** (array): Nếu weekly, chọn ngày [MON, TUE, ..., SUN]
- **reminderTime** (string): Thời gian nhắc nhở (HH:MM format)
- **reminderEnabled** (boolean): Bật/tắt nhắc nhở
- **targetDays** (number): Số ngày cần duy trì (100, 365, etc.)
- **currentStreak** (number): Số ngày liên tiếp hiện tại
- **longestStreak** (number): Streak dài nhất từng đạt
- **status** (string): active, paused, completed, archived
- **createdAt** (timestamp): Ngày tạo
- **completedAt** (timestamp, optional): Ngày hoàn thành (nếu đã complete)

Sub-collections:
- **checkIns**: Ghi nhận check-in hàng ngày (document id: habitId_YYYY-MM-DD)

#### **4. Posts Collection - Bài viết cộng đồng**

- **id** (string, primary key): Tự động sinh
- **authorId** (string, FK): ID tác giả
- **title** (string): Tiêu đề bài viết
- **content** (string): Nội dung (rich text)
- **category** (string): Financial Tips, Habit Advice, General, Story
- **tags** (array): Tags (#tiết_kiệm, #thói_quen, etc.)
- **imageUrls** (array): URLs ảnh đính kèm (1-5 ảnh)
- **status** (string): published, draft, archived, rejected
- **likes** (number): Số lượng likes
- **commentCount** (number): Số lượng comments
- **shareCount** (number): Số lần share
- **viewCount** (number): Số lần view
- **createdAt** (timestamp): Thời điểm tạo
- **updatedAt** (timestamp): Lần sửa cuối
- **rejectionReason** (string, optional): Lý do reject nếu status=rejected

Sub-collections:
- **comments**: Bình luận dưới bài viết
- **likedBy**: Danh sách user đã like (optimization cho realtime updates)

#### **5. Comments Collection - Bình luận**

- **id** (string, primary key): Tự động sinh
- **postId** (string, FK): Bài viết được bình luận
- **authorId** (string, FK): Tác giả bình luận
- **parentCommentId** (string, FK optional): ID comment cha (nếu là reply)
- **content** (string): Nội dung bình luận
- **mentions** (array): Danh sách user được mention (@username)
- **likes** (number): Số likes cho comment
- **status** (string): published, archived, hidden
- **createdAt** (timestamp): Thời điểm bình luận
- **updatedAt** (timestamp): Lần sửa cuối

#### **6. Insights Collection - Gợi ý AI**

- **id** (string, primary key): Tự động sinh
- **userId** (string, FK): User nhận insight
- **type** (string): spending_analysis, saving_tip, habit_advice, goal_progress
- **title** (string): Tiêu đề insight
- **content** (string): Nội dung chi tiết
- **category** (string): Finance, Health, Productivity
- **actionable** (boolean): Có thể thực hiện hành động không
- **read** (boolean): Đã đọc chưa
- **generatedAt** (timestamp): Thời điểm Gemini tạo
- **createdAt** (timestamp): Thời điểm lưu vào DB
- **expiresAt** (timestamp): Insight hết hạn sau bao lâu

#### **7. Reports Collection - Báo cáo vi phạm**

- **id** (string, primary key): Tự động sinh
- **contentId** (string, FK): ID bài viết/comment được report
- **contentType** (string): post, comment
- **reporterId** (string, FK): Người report
- **reason** (string): spam, inappropriate, misleading, offensive, other
- **description** (string, optional): Mô tả chi tiết lý do
- **status** (string): open, processing, resolved, dismissed
- **actionTaken** (string, optional): hide, delete, ban, none
- **adminId** (string, FK optional): Admin xử lý
- **createdAt** (timestamp): Thời điểm report
- **resolvedAt** (timestamp, optional): Thời điểm giải quyết

#### **8. Wallets Collection (Sub-collection của Users)**

- **id** (string, primary key): Tự động sinh
- **name** (string): Tên ví
- **type** (string): cash, credit_card, bank_account, e_wallet, crypto
- **balance** (number): Số dư hiện tại
- **currency** (string): VND, USD, etc.
- **color** (string): Hex color cho UI (#FF5733)
- **isDefault** (boolean): Ví mặc định hay không
- **icon** (string): Emoji hoặc icon name
- **createdAt** (timestamp): Ngày tạo
- **updatedAt** (timestamp): Lần cập nhật balance

#### **9. AuditLogs Collection - Ghi nhận hành động Admin**

- **id** (string, primary key): Tự động sinh
- **adminId** (string, FK): Admin thực hiện action
- **action** (string): approve_article, reject_article, ban_user, delete_post, hide_post, hide_comment
- **targetId** (string): ID của đối tượng bị action (postId, userId, etc.)
- **targetType** (string): post, comment, user, article
- **reason** (string, optional): Lý do action
- **metadata** (object, optional): Chi tiết bổ sung
- **createdAt** (timestamp): Thời điểm action

#### **10. Categories Collection - Danh mục chi tiêu**

- **id** (string, primary key): Tự động sinh hoặc "FOOD", "TRANSPORT"
- **name** (string): Tên danh mục
- **color** (string): Hex color
- **icon** (string): Emoji hoặc icon name
- **order** (number): Thứ tự sắp xếp
- **isDefault** (boolean): Danh mục mặc định hệ thống
- **description** (string, optional): Mô tả danh mục

#### **11. Goals Collection (Sub-collection của Users)**

- **id** (string, primary key): Tự động sinh
- **title** (string): Tên mục tiêu
- **description** (string): Mô tả chi tiết
- **targetAmount** (number): Số tiền cần tiết kiệm
- **currentAmount** (number): Số tiền đã tích lũy
- **category** (string): savings, debt_payoff, investment, other
- **deadline** (date): Ngày hạn (YYYY-MM-DD)
- **priority** (string): high, medium, low
- **status** (string): active, paused, completed, abandoned
- **createdAt** (timestamp): Ngày tạo
- **completedAt** (timestamp, optional): Ngày hoàn thành

### 1.4.4. Data Validation Rules - Quy tắc kiểm tra dữ liệu

Tất cả dữ liệu phải được kiểm tra ở cả client-side (để UX tốt) và server-side (để bảo mật).

**Transaction Validation:**
- amount > 0 và <= 1,000,000,000 (1 tỷ VND)
- category phải có trong danh mục hợp lệ
- walletId phải tồn tại và thuộc sở hữu user
- date không được sau hôm nay
- description <= 1000 characters

**Habit Validation:**
- title required, <= 100 characters
- frequency phải là: daily, weekly, monthly
- reminderTime có format HH:MM hợp lệ
- targetDays > 0

**Post Validation:**
- title required, 5-200 characters
- content required, <= 10000 characters
- category required, phải valid
- images <= 5, file size <= 5MB each
- tags <= 10 tags, mỗi tag <= 30 characters

### 1.4.5. Tóm tắt Chương 1 - Kiến thức nền tảng

Chương 1 đã trình bày chi tiết:

1. **Bài toán & vấn đề thực tiễn**: Mọi người khó quản lý chi tiêu, theo dõi thói quen, và nhận gợi ý tài chính → Assist là giải pháp toàn diện

2. **Mục tiêu & phạm vi**: 4 mục tiêu chính (quản lý tài chính, theo dõi thói quen, AI gợi ý, cộng đồng chia sẻ)

3. **Phân tích thị trường**: So sánh với 4 ứng dụng tương tự (Spendee, YNAB, Habitica, Mint) → Assist là duy nhất kết hợp đầy đủ cả 4 tính năng

4. **Ba loại người dùng**: Personal User, Community Member, Admin → mỗi loại có chức năng riêng

5. **Sáu quy trình nghiệp vụ chi tiết**: Ghi chi tiêu → Check-in thói quen → Phân tích tài chính → AI gợi ý → Tạo bài viết → Xử lý báo cáo

6. **Yêu cầu chức năng**: 28 chức năng chi tiết cho 3 loại user (priority: HIGH/MEDIUM/LOW)

7. **Yêu cầu phi chức năng**: Performance (<2s launch), Scalability (100K DAU), Security (encryption + 2FA), Availability (99.5% uptime), UX (responsive + accessibility), Compliance (GDPR)

8. **Mô hình dữ liệu**: 11 collections, 50+ fields, relationships, indexes, validation rules

Tiến sĩ đơn lắc đảm bảo Assist là một ứng dụng **toàn diện, an toàn, và có khả năng mở rộng** cho thị trường Việt Nam.

# CHƯƠNG 2: TÌM HIỂU VỀ CÔNG CỤ PHÁT TRIỂN HỆ THỐNG

## 2.1. Tổng quan về ngôn ngữ lập trình JavaScript và TypeScript

### 2.1.1. Giới thiệu chi tiết về JavaScript

**JavaScript là gì?**

JavaScript là một ngôn ngữ lập trình script được tạo ra năm 1995 bởi Brendan Eich cho trình duyệt Netscape Navigator. Mặc dù ban đầu chỉ được sử dụng để làm các hiệu ứng nhỏ trên web, nhưng ngày nay nó đã trở thành một ngôn ngữ toàn năng (general-purpose) có thể chạy ở nhiều môi trường khác nhau:

- **Trình duyệt web**: Là nơi khai sinh, JavaScript vẫn là tiêu chuẩn cho các ứng dụng web hiện đại
- **Server-side (Node.js)**: Có thể xây dựng backend, APIs, CLI tools
- **Mobile apps (React Native)**: Xây dựng ứng dụng iOS/Android bằng JavaScript
- **Desktop (Electron)**: Tạo ứng dụng desktop (VSCode, Slack, Discord đều dùng Electron)
- **IoT & Embedded**: Chạy trên các thiết bị IoT thông qua Node.js

**Đặc điểm nổi bật của JavaScript:**

1. **Ngôn ngữ động (Dynamically typed)**: 
   - Không cần khai báo kiểu dữ liệu
   - Biến có thể chứa bất kỳ giá trị nào
   - Linh hoạt nhưng dễ gây lỗi runtime

2. **Hỗ trợ lập trình hàm (Functional Programming)**:
   - Functions là first-class objects (có thể assign cho biến, truyền làm parameter)
   - Closures: Hàm có thể truy cập biến từ scope cha
   - Higher-order functions: Hàm nhận/trả về hàm khác
   - Map, filter, reduce: Các phương thức hàm được tích hợp sẵn

3. **Xử lý bất đồng bộ (Asynchronous)**:
   - Callbacks: Truyền function để gọi khi có kết quả
   - Promises: Đối tượng đại diện cho giá trị có thể chưa có sẵn
   - Async/await: Cú pháp modern để xử lý async như synchronous
   - Phù hợp cho các tác vụ I/O như network requests, file operations

4. **Prototype-based OOP**:
   - Không có concept "class" truyền thống (trước ES6)
   - Objects được tạo từ prototypes
   - ES6 thêm class syntax (nhưng vẫn là syntax sugar)

5. **Cộng đồng & Ecosystem lớn**:
   - npm (Node Package Manager): 3 triệu+ packages có sẵn
   - Rất nhiều frameworks, libraries, tools

**Tại sao chọn JavaScript cho Assist?**

- **Cross-platform**: Viết 1 lần, chạy ở web, mobile, backend
- **Ecosystem phong phú**: React Native, Express, Firebase, Gemini API đều có SDK JavaScript
- **Learning curve thấp**: Cú pháp dễ, nhiều người học hỏi
- **Performance tốt**: V8 engine tối ưu, async model phù hợp cho realtime apps
- **Developer experience**: Hot reload, rich tooling, large community

### 2.1.2. TypeScript - Tinh chỉnh JavaScript với kiểu tĩnh

**TypeScript là gì?**

TypeScript là một superset của JavaScript được Microsoft phát triển (2012) và duy trì. Nó thêm static type checking trên top của JavaScript. TypeScript code phải compile thành JavaScript trước khi chạy.

**Các tính năng TypeScript bổ sung:**

1. **Static Typing**:
   - Kiểu dữ liệu được kiểm tra ở compile-time (trước khi chạy)
   - Giảm lỗi liên quan đến kiểu dữ liệu
   - IDE có thể cảnh báo lỗi realtime

2. **Interfaces & Types**:
   - Định nghĩa hợp đồng dữ liệu
   - Đảm bảo object có đúng shape
   - Self-documenting code

3. **Classes & OOP**:
   - Support proper class syntax (access modifiers: public, private, protected)
   - Inheritance, polymorphism
   - Abstract classes, interfaces

4. **Enums**:
   - Liệt kê các hằng số hợp lệ
   - Ví dụ: enum TransactionType { EXPENSE, INCOME }

5. **Generics**:
   - Hỗ trợ kiểu generic (generic functions, generic classes)
   - Reuse logic cho nhiều kiểu dữ liệu

6. **Decorators**:
   - Syntax để thêm metadata vào classes/methods
   - Hữu ích cho frameworks như Angular, NestJS

**Lợi ích của TypeScript:**

| Lợi ích | Giải thích | Ví dụ |
|---|---|---|
| **Phát hiện lỗi sớm** | Lỗi type được catch ở compile-time | Function nhận số, gọi với string → lỗi ngay |
| **IDE support** | Autocomplete, IntelliSense, refactoring an toàn | Refactor tên field → tự update tất cả references |
| **Self-documenting** | Code rõ ràng hơn vì có type hints | Xem signature function → biết nhập/xuất gì |
| **Easier refactoring** | Đổi kiểu dữ liệu → tự động báo chỗ cần sửa | Thay object type → IDE gợi ý sửa tất cả |
| **Better collaboration** | Teammates biết rõ API, khó sai | Shared types giữa frontend/backend |
| **Performance** | TypeScript compiler tối ưu, tree-shaking dễ hơn | Production bundle nhỏ hơn, nhanh hơn |

### 2.1.3. So sánh JavaScript vs TypeScript

| Tiêu chí | JavaScript | TypeScript |
|---|---|---|
| **Kiểu dữ liệu** | Động (kiểm tra lúc runtime) | Tĩnh (kiểm tra lúc compile) |
| **Setup** | Chạy ngay, không cần build | Cần compile → JavaScript |
| **Learning curve** | Dễ, cú pháp đơn giản | Trung bình, thêm kiến thức types |
| **Debugging** | Khó, lỗi ở runtime | Dễ, lỗi được phát hiện sớm |
| **IDE support** | Tốt (IntelliSense cơ bản) | Tuyệt vời (full-featured) |
| **Development speed** | Nhanh ban đầu, chậm khi codebase lớn | Chậm ban đầu, nhanh với codebase lớn |
| **Team size** | Tốt cho small teams (1-5 người) | Tốt cho large teams (10+ người) |
| **Project complexity** | OK với projects nhỏ-trung bình | Tuyệt vời cho projects lớn |

**Khuyến cáo cho Assist:**

- **Frontend (React Native)**: **TypeScript** → code quality cao, maintain dễ, team > 2 người
- **Backend (Node.js)**: **TypeScript** → type safety cho APIs, refactoring an toàn
- **Scripts/Tools**: JavaScript → đơn giản, không cần compile

### 2.1.4. Best Practices JavaScript/TypeScript trong Assist

**1. Naming Conventions:**
- **Variables/Functions**: camelCase (`getUserTransactions`, `currentBalance`)
- **Classes/Interfaces**: PascalCase (`UserProfile`, `ITransaction`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`, `DEFAULT_CURRENCY`)
- **Private fields**: Prefix underscore (`_internalCache`, `_calculateStreak`)

**2. Error Handling:**
- Luôn sử dụng try-catch cho async operations
- Define custom error classes
- Log errors với context (userId, action, timestamp)
- Gửi user-friendly error messages

**3. Async/Await Best Practices:**
- Ưu tiên async/await thay vì Promises (dễ đọc hơn)
- Đặt timeout cho API calls để tránh hang
- Implement retry logic cho network errors
- Parallel execution: `Promise.all()` thay vì sequential awaits

## 2.2. Giới thiệu React Native - Framework phát triển di động

### 2.2.1. React Native là gì?

**Định nghĩa:**

React Native là framework open-source được Facebook (Meta) phát triển cho phép xây dựng native mobile applications (iOS & Android) sử dụng JavaScript/TypeScript. Slogan nổi tiếng của nó là "Learn once, write anywhere" - học 1 lần, viết mọi nơi.

**Cách hoạt động cơ bản:**

1. **Code JavaScript**: Lập trình bằng JavaScript/TypeScript
2. **React Bridge**: Giao tiếp giữa JavaScript code và native modules
3. **Native Components**: React Native components ánh xạ tới native components (UIView/UIButton cho iOS, View/Button cho Android)
4. **Kết quả**: Ứng dụng native thực sự, không phải web wrapper

**Ưu điểm React Native:**

1. **Code Sharing**: Viết 1 codebase, chạy trên iOS/Android → tiết kiệm thời gian & chi phí
2. **Native Performance**: Sử dụng native components → hiệu suất gần như app native 100%
3. **Fast Development**: Hot reload, changes visible instantly (không cần rebuild)
4. **Large Ecosystem**: 10,000+ libraries, active community
5. **Developer Experience**: Familiar tools (VS Code, Chrome DevTools), debugging tốt
6. **Maintained**: Meta liên tục update, fix bugs, add features

**Nhược điểm:**

1. **Learning curve**: Cần hiểu cả JavaScript lẫn native (iOS/Android)
2. **Performance tuning**: Một số tác vụ heavy cần native modules
3. **Platform-specific code**: Đôi khi cần code riêng cho iOS/Android
4. **Size**: App size lớn hơn native (~50-100MB)

### 2.2.2. React Native Architecture chi tiết

**Các thành phần chính:**

1. **JavaScript Thread**: Chạy JavaScript code (Redux, business logic, etc.)
2. **Native Thread**: Chạy native code (iOS UIKit, Android Framework)
3. **Bridge**: Giao tiếp giữa 2 threads (JSON messages)
4. **Native Modules**: Custom code native cho tác vụ heavy

**Flow của 1 transaction:**

```
User input (JavaScript)
  ↓
Event handler (JavaScript)
  ↓
Update state/reducer (JavaScript)
  ↓
Component re-render (JavaScript)
  ↓
Bridge gửi UI updates
  ↓
Native rendering (iOS UIKit / Android)
  ↓
Display updated UI (user thấy)
```

**Folder structure Assist:**

```
Assist/
├── src/
│   ├── api/               # API calls (Firebase, Gemini)
│   ├── assets/            # Images, fonts
│   ├── components/        # Reusable React components
│   ├── config/            # Configuration (Firebase config, etc.)
│   ├── context/           # Context API (theme, etc.)
│   ├── hooks/             # Custom hooks (useTransactions, useHabits)
│   ├── navigation/        # Navigation setup
│   ├── screens/           # Screen components
│   ├── services/          # Business logic (AuthService, HabitService)
│   ├── store/             # Redux store, slices
│   ├── theme/             # Colors, typography, spacing
│   ├── types/             # TypeScript types & interfaces
│   └── utils/             # Utility functions
├── ios/                   # Native iOS code
├── android/               # Native Android code
├── App.tsx                # Root component
├── package.json           # Dependencies
├── metro.config.js        # Metro bundler config
├── tsconfig.json          # TypeScript config
└── app.json               # App metadata
```

### 2.2.3. Công cụ & Setup Development

**Dev Environment:**

1. **Node.js & npm**: Cài đặt Node.js (LTS) + npm
2. **React Native CLI**: `npm install -g react-native-cli`
3. **Xcode** (macOS): Dùng để build/run iOS
4. **Android Studio**: Dùng để build/run Android
5. **VS Code**: Code editor

**Essential Dependencies trong Assist:**

| Package | Purpose | Version |
|---|---|---|
| `react` | Core React library | ^18.x |
| `react-native` | Core React Native | ^0.73.x |
| `redux` | State management | ^4.x |
| `@reduxjs/toolkit` | Redux simplified | ^1.9.x |
| `react-redux` | Redux bindings | ^8.x |
| `@react-navigation/native` | Navigation | ^6.x |
| `firebase` | Firebase SDK | ^10.x |
| `@google-cloud/language` | Gemini AI SDK | ^4.x |
| `react-native-gesture-handler` | Gestures | ^2.x |

**Development Workflow:**

1. **Start Metro bundler**: `npm start`
2. **Run on iOS**: `npm run ios` hoặc xcode
3. **Run on Android**: `npm run android` hoặc Android Studio
4. **Hot Reload**: Thay đổi code → auto reload (nếu có state thay đổi)
5. **Debug**: Chrome DevTools hoặc React Native Debugger

### 2.2.4. React Native Best Practices & Implementation

**1. Functional Components with Hooks:**

Tất cả components Assist sử dụng Functional Components (không dùng Class Components). Hooks là cách modern để manage state, side effects.

**Common hooks sử dụng:**
- `useState`: Manage local state
- `useEffect`: Side effects (API calls, subscriptions)
- `useContext`: Access Context values
- `useReducer`: Complex state logic (thay thế Redux cho local state)
- `useCallback`: Memoize functions
- `useMemo`: Memoize expensive calculations

**2. Performance Optimization:**

- **React.memo**: Memoize components để tránh re-render unnecessary
- **useMemo**: Cache expensive computations
- **useCallback**: Cache function references
- **FlatList**: Dùng cho long lists (auto virtualization)
- **Code splitting**: Load screens khi cần (lazy loading)

**3. Navigation Setup (React Navigation):**

Assist sử dụng `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/stack`:

```
RootStack (Auth vs App)
  ├── AuthStack (Login, Register, ForgotPassword)
  └── AppStack
      ├── MainTabs (Bottom tabs)
      │   ├── Home (Dashboard)
      │   ├── Finance (Transactions, Charts)
      │   ├── Habits
      │   ├── Community
      │   └── Profile
      └── ModalsStack (Screens không ở tabs)
          ├── AddTransaction
          ├── EditTransaction
          ├── CreateHabit
          └── CreatePost
```

**4. State Management (Redux Toolkit):**

Assist sử dụng Redux Toolkit cho global state:

- **slices**: `auth`, `transactions`, `habits`, `ui`
- **async thunks**: Gọi APIs từ Redux
- **selectors**: Get state efficiently
- **persist**: Lưu state vào device storage

## 2.3. Quản lý trạng thái với Redux Toolkit

### 2.3.1. Redux Pattern & Architecture

**Redux là gì?**

Redux là library quản lý application state (trạng thái toàn cục) theo pattern dự đoán được. Redux cung cấp single source of truth (một nơi lưu trữ state duy nhất).

**Khi nào dùng Redux?**
- State được chia sẻ giữa nhiều screens
- State logic phức tạp
- Cần persist state
- Cần debugging tốt

**Redux data flow:**

```
User interaction
  ↓
dispatch(action)
  ↓
middleware (thunk, logging, etc.)
  ↓
reducer (pure function)
  ↓
new state
  ↓
subscribers notified
  ↓
components re-render
```

**Redux Toolkit (RTK) - Modern approach:**

Redux Toolkit là official, recommended way để dùng Redux. Nó simplify boilerplate:

- `createSlice`: Combine reducer + actions + initialState
- `createAsyncThunk`: Handle async operations (API calls)
- `configureStore`: Setup store with middleware
- Built-in `immer`: Mutable-style updates (actually immutable)

### 2.3.2. Redux Store Configuration trong Assist

**Store structure:**

```
store: {
  auth: {
    user: { uid, email, displayName, role },
    isLoading: boolean,
    error: string | null
  },
  transactions: {
    items: [],
    selectedMonth: "2025-12",
    isLoading: boolean,
    error: string | null
  },
  habits: {
    items: [],
    isLoading: boolean,
    error: string | null
  },
  ui: {
    theme: 'light' | 'dark',
    notifications: [],
    modals: { ... }
  }
}
```

**Redux Slices:**

- **authSlice**: Quản lý authentication state (user, token, loading)
- **transactionSlice**: Quản lý danh sách giao dịch, filter
- **habitSlice**: Quản lý habit list, current streaks
- **uiSlice**: Quản lý UI state (theme, modals, notifications)

### 2.3.3. Async operations với createAsyncThunk

Ví dụ: Fetch transactions từ Firestore

```
dispatch(fetchTransactions({ userId, month }))
  ↓
pending: loading = true
  ↓
Query Firestore
  ↓
fulfilled: set items, loading = false
  ↓
OR rejected: set error, loading = false
```

## 2.4. Tích hợp Firebase vào hệ thống

### 2.4.1. Firebase Overview & Services

**Firebase là gì?**

Firebase là Backend-as-a-Service (BaaS) platform của Google, cung cấp:

- **Firestore**: NoSQL cloud database (real-time)
- **Authentication**: User auth (email, OAuth, phone)
- **Storage**: Cloud file storage (images, documents)
- **Cloud Messaging**: Push notifications
- **Cloud Functions**: Serverless compute
- **Analytics**: App usage analytics
- **Hosting**: Deploy web apps

**Tại sao chọn Firebase cho Assist?**

1. **No backend to maintain**: Google quản lý infrastructure, scaling, security
2. **Real-time sync**: Data tự động đồng bộ giữa users
3. **Scalability**: Tự động scale theo demand
4. **Security**: Built-in authentication, security rules
5. **Cost-effective**: Pay-as-you-go, free tier hơi nhỏ nhưng đủ để start
6. **Mature ecosystem**: Tích hợp với Google Cloud, Gemini AI, etc.

### 2.4.2. Firebase Services chi tiết

**1. Firebase Authentication:**

Cung cấp secure user authentication:
- Email/password
- Google OAuth
- Facebook OAuth
- Phone number (SMS)
- 2FA (future)

Assist sử dụng:
- Email/password (chính)
- Google OAuth (social login)
- Facebook OAuth (optional)

**2. Firestore Database:**

NoSQL database (document-based, schema-flexible):

- Collections: Top-level groups (users, transactions, habits, posts)
- Documents: Individual records (user doc, transaction doc)
- Sub-collections: Nested data
- Real-time listeners: Automatic updates
- Queries: Filter, sort, paginate

**3. Cloud Storage:**

Store files (images, documents):
- gs://bucket-name/folder/file
- Assist sử dụng cho: Transaction receipts, user avatars
- Security rules: User chỉ có thể access file của mình

**4. Cloud Messaging (FCM):**

Push notifications:
- Subscribe topics
- Send notifications từ backend
- Assist dùng cho: Habit reminders, budget alerts, community updates

**5. Cloud Functions:**

Serverless compute (trigger từ events):
- Trigger: Firestore writes, scheduled jobs, HTTP requests
- Assist sử dụng cho:
  - Generate weekly insights (cron job)
  - Phân tích receipt images
  - Send notifications

### 2.4.3. Firebase Security & Access Control

**Firestore Security Rules:**

Quy tắc xác định ai có thể read/write dữ liệu. Ví dụ:

```
// User chỉ có thể access data của họ
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Transactions: User chỉ read/write của họ
match /transactions/{doc} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

// Posts: Public read, authenticated write
match /posts/{doc} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == request.resource.data.authorId;
}
```

### 2.4.4. Cloud Storage & File Management

Assist cần upload images (transaction receipts, user avatars).

**Storage structure:**
```
gs://assist-firebase.appspot.com/
├── transactions/
│   └── {userId}/
│       └── {transactionId}_timestamp.jpg
└── avatars/
    └── {userId}.jpg
```

**Upload flow:**
1. User chọn image từ camera/gallery
2. Compress image (để < 5MB)
3. Upload tới Cloud Storage
4. Get download URL
5. Lưu URL vào Firestore transaction/user

## 2.5. Backend Node.js & Cloud Functions

### 2.5.1. Node.js Architecture

**Node.js là gì?**

Node.js là runtime environment cho phép chạy JavaScript trên server. Nó xây dựng trên V8 engine (Google's JavaScript engine).

**Đặc điểm:**
- **Non-blocking I/O**: Xử lý hàng nghìn requests đồng thời
- **Event-driven**: Async callback-based model
- **npm ecosystem**: 3 triệu+ packages

**Backend stack Assist:**

- **Firebase Cloud Functions**: Thay thế traditional server (serverless)
- **Express.js**: Web framework cho APIs (optional, nếu cần)
- **Scheduled jobs**: Cron jobs (generate insights, cleanup)
- **External APIs**: Gemini AI, Google Cloud services

### 2.5.2. Cloud Functions - Serverless Backend

Assist không cần maintain server. Thay vào đó, dùng Firebase Cloud Functions (FaaS - Function as a Service).

**Types of Cloud Functions:**

1. **Firestore triggers**: Trigger khi data thay đổi
2. **HTTP functions**: API endpoints
3. **Scheduled functions**: Cron jobs
4. **Cloud Pub/Sub**: Message queue processing

**Ví dụ Cloud Functions Assist:**

1. **onTransactionCreate**: Khi user thêm transaction
   - Update wallet balance
   - Update monthly spending
   - Check budget alerts
   - Trigger insight generation (nếu mới)

2. **onHabitCheckIn**: Khi user check-in habit
   - Update currentStreak
   - Check milestones
   - Send notifications

3. **generateWeeklyInsights**: Scheduled weekly
   - Query last 7 days transactions
   - Call Gemini API
   - Save insights to Firestore
   - Send notifications

4. **processReceiptImage**: When receipt image uploaded
   - Call Cloud Vision API (OCR)
   - Call Gemini AI để classify category
   - Return suggestions

### 2.5.3. Tích hợp Gemini AI

Assist sử dụng Google Gemini AI để:
- Phân tích chi tiêu (spending patterns)
- Gợi ý tiết kiệm (saving recommendations)
- Lời khuyên thói quen (habit advice)
- Phân loại hóa đơn (receipt OCR)

**Gemini API:**
- REST API
- Authentication: API key
- Models: gemini-pro (text), gemini-pro-vision (multimodal)
- Rate limits: Tuỳ theo pricing tier

**Implementation trong Assist:**

Backend Cloud Function gọi Gemini:
```
Firestore trigger
  ↓
Cloud Function
  ↓
Prepare transaction data
  ↓
Call Gemini API
  ↓
Parse response
  ↓
Save insight to Firestore
  ↓
Send notification
```

## 2.6. Tóm tắt Chương 2 - Tech Stack

Chương 2 đã giới thiệu các công cụ chính:

1. **JavaScript/TypeScript**: Ngôn ngữ lập trình (dynamic vs static typing)
2. **React Native**: Framework mobile (iOS/Android)
3. **Redux Toolkit**: State management
4. **Firebase**: Backend-as-a-Service (database, auth, storage)
5. **Cloud Functions**: Serverless backend
6. **Gemini AI**: AI-powered insights

**Tại sao chọn stack này cho Assist?**
- Cross-platform (iOS/Android)
- Scalable & affordable
- Developer-friendly
- Active communities
- All-in-one solutions (Firebase cho backend)

# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG ASSIST

## 3.1. Phân tích hệ thống Assist

### 3.1.1. Biểu đồ ca sử dụng (Use Case Diagram)

Hệ thống Assist phục vụ ba loại actor chính, mỗi loại có các use case (trường hợp sử dụng) riêng.

**Các actor chính của hệ thống:**

1. **Guest** (Khách chưa đăng nhập):
   - Xem trang chủ ứng dụng
   - Đăng ký tài khoản mới
   - Đăng nhập
   - Xem privacy policy & terms of service

2. **User** (Người dùng cá nhân - sau khi đăng nhập):
   - Quản lý chi tiêu (ghi, sửa, xóa, xem danh sách)
   - Quản lý ví (tạo, sửa, xóa)
   - Quản lý thói quen (tạo, check-in, xem tiến độ)
   - Phân tích tài chính (xem biểu đồ, báo cáo)
   - Xem insights từ AI
   - Nhận thông báo
   - Quản lý hồ sơ (sửa profile, thay đổi settings)

3. **Community Member** (Thành viên cộng đồng):
   - Tất cả quyền của User
   - Thêm: Tạo bài viết, bình luận, like, share, follow
   - Báo cáo nội dung vi phạm

4. **Admin** (Quản trị viên):
   - Quản lý người dùng (khóa/mở khóa, thay đổi role)
   - Duyệt bài viết chuyên gia
   - Quản lý bài viết cộng đồng (hide/delete vi phạm)
   - Xử lý báo cáo từ cộng đồng
   - Xem dashboard & thống kê hệ thống
   - Xem audit logs

**Bảng tóm tắt các Use Case chính:**

| STT | Use Case | Actor | Mô tả ngắn |
|---|---|---|---|
| 1 | Đăng ký / Đăng nhập | Guest | Đăng ký tài khoản hoặc đăng nhập (email/Google/Facebook) |
| 2 | Ghi nhận chi tiêu | User | Thêm giao dịch chi tiêu, chọn danh mục, upload ảnh hóa đơn |
| 3 | Xem & phân tích chi tiêu | User | Xem danh sách giao dịch, biểu đồ, báo cáo chi tiêu |
| 4 | Quản lý thói quen | User | Tạo thói quen, check-in hàng ngày, theo dõi streak |
| 5 | Nhận gợi ý AI | User | Nhận gợi ý từ Gemini AI về quản lý tài chính & thói quen |
| 6 | Tạo bài viết cộng đồng | Community Member | Tạo bài chia sẻ kinh nghiệm tiết kiệm, quản lý tài chính |
| 7 | Tương tác cộng đồng | Community Member | Bình luận, like, share, bookmark bài viết, follow user |
| 8 | Báo cáo nội dung | User | Report bài viết/comment vi phạm community guidelines |
| 9 | Quản lý người dùng | Admin | Xem, khóa/mở khóa, thay đổi role người dùng |
| 10 | Duyệt nội dung | Admin | Duyệt bài viết chuyên gia, xử lý báo cáo, delete content |
| 11 | Quản lý hệ thống | Admin | Xem dashboard, thống kê, audit logs, settings |

### 3.1.2. Các luồng nghiệp vụ chính (Business Flows)

Để hiểu rõ cách hệ thống hoạt động, ta cần phân tích các luồng nghiệp vụ chính.

#### **1. Add Transaction Flow (Ghi nhận chi tiêu)**

**Actors**: User (Primary), System (Secondary - calculate stats)
**Preconditions**: User đã đăng nhập, có ít nhất 1 ví
**Main Flow**:
1. User mở Dashboard, nhấn "+" button
2. Ứng dụng hiển thị AddTransactionScreen
3. User nhập: amount, category, wallet, description (optional), date, image (optional)
4. User nhấn "Save"
5. System kiểm tra validation:
   - Amount > 0?
   - Category valid?
   - Wallet valid & belongs to user?
   - Date not in future?
6. System lưu transaction to Firestore
7. System cập nhật wallet balance
8. System trigger backend functions:
   - Calculate monthly spending
   - Check if exceeded budget → notify
   - Generate insight (if weekly)
9. System hiển thị toast "Transaction saved ✓"
10. System cập nhật Dashboard (tổng chi tiêu hôm nay)
**Alternate Flows**:
- User upload ảnh: Call Gemini Vision API để OCR & phân loại category
- User cancel: Return to Dashboard (discard changes)
- Validation error: Show error message, user can retry

#### **2. Habit Check-in Flow (Check-in thói quen)**

**Actors**: User, System
**Preconditions**: User đã tạo ít nhất 1 habit
**Main Flow**:
1. User mở Habit tab
2. Ứng dụng hiển thị danh sách habits hôm nay
3. User xem habit title, description, current streak
4. User nhấn checkbox ✓ để đánh dấu completed
5. System lưu checkIn vào Firestore
6. System kiểm tra:
   - Hôm qua completed? (streak += 1)
   - Streak reset? (streak = 0)
   - Streak >= target days? (mark completed)
7. System kiểm tra milestone:
   - Streak = 7, 30, 100, 365? → create badge, send notification
8. System cập nhật UI: streaks, progress bar
9. System gửi notification: "Great! 25-day streak 🔥"
**Alternate Flows**:
- User nhấn ✗ để bỏ qua: Check-in = false, reset streak
- User thêm note: Optional, save note to checkIn doc
- User click habit để xem timeline: Show last 30 days of check-ins

#### **3. Generate Weekly Insights Flow**

**Actors**: System (Scheduled Cloud Function), Gemini AI
**Preconditions**: Monday 8:00 AM, User has transactions in past 7 days
**Main Flow**:
1. Cloud Scheduler triggers Cloud Function
2. Cloud Function queries last 7 days transactions for user
3. Function calculates: Total spent, by category, comparison with last week
4. Function fetches user habits, goals
5. Function calls Gemini API with structured prompt
6. Gemini returns insights (JSON format)
7. Function saves insights to Firestore
8. Function sends FCM notification to user
9. Notification content: "💡 New spending insight: You spent 15% more on Food..."
10. User clicks notification → open Insights screen
**Error Handling**:
- Gemini API timeout: Retry 3 times
- No transactions: Skip insight generation
- User has disabled notifications: Still save insight (user can see later)

#### **4. Community Post Creation & Moderation Flow**

**Actors**: Community Member (create), Admin (moderate)
**Preconditions**: User is authenticated, not banned
**Main Flow**:
1. User taps "+" on Community tab
2. System shows CreatePostScreen
3. User enters: title, content, category, images (1-5), tags
4. User chooses status: Draft or Publish
5. If Draft: Save to Firestore, show "Draft saved"
6. If Publish:
   - System checks content for keywords (spam filter)
   - If flagged: Send to admin for review (status = pending)
   - If clean: Publish immediately (status = published)
7. If published:
   - Add to Community feed
   - Send notification to followers: "User posted: [title]"
   - Update user's post count
**Admin Moderation**:
1. Admin opens Reports dashboard
2. Views pending post
3. Previews content
4. Clicks "Approve" or "Reject"
5. If Reject: Mark status = rejected, notify user with reason
6. If Approve: Mark status = published

### 3.1.3. Mối quan hệ các chức năng (Feature Dependencies)

```
Dashboard (Home)
├─ Transaction Summary (requires transactions)
├─ Habit Progress (requires habits)
├─ Recent Insights (requires AI generation)
└─ Quick Add (requires wallets, categories)

Finance Tab
├─ Transaction List (requires transaction CRUD)
├─ Charts & Analytics (requires transaction aggregation)
├─ Wallets Management (requires wallet CRUD)
└─ Budget Alerts (requires settings + transactions)

Habits Tab
├─ Habit List (requires habit CRUD)
├─ Check-in Mechanism (requires habitCheckIn records)
├─ Streak Display (requires check-in calculations)
└─ Milestone Badges (requires achievements)

Community Tab
├─ Posts Feed (requires posts + pagination)
├─ Post Creation (requires validation + image upload)
├─ Comments (requires nested comments support)
├─ Admin Moderation (requires report queue)
└─ Notifications (requires FCM integration)

Profile Tab
├─ User Info (requires user profile)
├─ Settings (requires preferences storage)
├─ Data Export (requires GDPR compliance)
└─ Logout (requires session management)
```

## 3.2. Tổng quan thiết kế hệ thống

### 3.2.1. System Architecture Overview

**Kiến trúc tổng thể Assist:**

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                       │
│  (React Native UI - iOS/Android)                          │
├─────────────────────────────────────────────────────────┤
│                  Business Logic Layer                     │
│  (Redux, Services, Hooks)                                │
├─────────────────────────────────────────────────────────┤
│              Data Access Layer (APIs)                     │
│  (Firebase SDK, HTTP calls, Image upload)                │
├─────────────────────────────────────────────────────────┤
│                  Backend Services                         │
│  (Firebase, Cloud Functions, Gemini AI)                  │
└─────────────────────────────────────────────────────────┘
```

**Chi tiết từng layer:**

**1. Presentation Layer (React Native)**:
- Screens: Login, Dashboard, Finance, Habits, Community, Profile
- Components: Forms, Lists, Charts, Cards, Buttons
- Navigation: Tab Navigation, Stack Navigation, Modal Stacks
- State: Local state (useState), Global state (Redux)
- Styling: Theme (dark/light), responsive design

**2. Business Logic Layer**:
- Redux: Slices (auth, transactions, habits, ui)
- Services: TransactionService, HabitService, AIService, etc.
- Custom Hooks: useTransactions, useHabits, useInsights
- Utilities: Date formatting, calculations, validators

**3. Data Access Layer**:
- Firebase SDK: Firestore queries, write operations
- Image Upload: Cloud Storage
- Authentication: Firebase Auth
- HTTP Client: Calls to backend APIs (if needed)

**4. Backend Services**:
- **Firestore**: NoSQL database (transactions, habits, posts, users, etc.)
- **Cloud Functions**: Scheduled jobs, triggered functions
- **Cloud Storage**: File storage (images)
- **Cloud Messaging**: Push notifications
- **Gemini AI API**: Intelligence & insights
- **Authentication**: Firebase Auth with security rules

### 3.2.2. Chức năng chi tiết của từng thành phần

#### **A. Authentication & Authorization**

**Authentication flow:**
```
User Input (email + password)
  ↓
Firebase Auth SDK
  ↓
Validate credentials
  ↓
Return auth token
  ↓
Store token locally (Redux + device storage)
  ↓
Redirect to Dashboard
```

**Authorization:**
- Firestore Security Rules: Kiểm tra request.auth.uid
- Token validation: Verify JWT trước gọi APIs
- Role-based access: user, expert, admin

#### **B. Transaction Management**

**Features:**
- CRUD transactions (Create, Read, Update, Delete)
- Filter by date range, category, wallet
- Search by description
- Upload receipts (images)
- Soft delete (archive)

**Data flow:**
```
Add Transaction Form
  ↓
Validate input
  ↓
Upload image (if any)
  ↓
Save to Firestore
  ↓
Update wallet balance
  ↓
Trigger Cloud Function (calculate stats)
  ↓
Update Redux state
  ↓
Refresh UI
```

#### **C. Habit Management**

**Features:**
- Create/Edit/Delete habits
- Daily check-ins
- Streak tracking (current, longest)
- Progress visualization
- Milestone achievements

**Streak Algorithm:**
```
If today check-in == true:
  if yesterday check-in == true:
    currentStreak += 1
  else:
    currentStreak = 1
Else:
  if yesterday == miss (no check-in):
    currentStreak = 0 (reset)
  else:
    currentStreak = 0 (reset)

Update longestStreak = max(longestStreak, currentStreak)
```

#### **D. Financial Analytics**

**Charts:**
- Pie chart: Category breakdown
- Bar chart: Daily/Weekly/Monthly comparison
- Line chart: Spending trends

**Calculations:**
- Total spent, by category
- Daily average, monthly average
- Comparison YoY, MoM
- Budget status (spent vs limit)

**Data aggregation:**
- Real-time: From Redux cache
- Historical: Query Firestore with aggregations
- Backend: Cloud Function pre-calculates

#### **E. Community & Social**

**Features:**
- Create posts (text + images)
- Like, comment, share
- Follow users
- Search & filter
- Report content

**Moderation:**
- Admin reviews reports
- Hide/delete content
- Ban users (if multiple violations)
- Audit logs of actions

### 3.2.3. Design Patterns & Best Practices

**1. MVC/MVP Architecture:**
- Model: Redux (state)
- View: React Native components
- Controller/Presenter: Services, custom hooks

**2. Service Layer Pattern:**
- Separate business logic từ UI
- Services: AuthService, TransactionService, HabitService
- Reusable across components

**3. Factory Pattern:**
- Create objects (transactions, habits, posts)
- Validation & normalization

**4. Observer Pattern:**
- Redux subscriptions
- Firestore real-time listeners
- Notification system

**5. Dependency Injection:**
- Services injected to components (via props or context)
- Easy to mock for testing

## 3.3. Chi tiết Thiết kế Cơ sở dữ liệu

### 3.3.1. Tổng quan cấu trúc Firestore

**Firestore là NoSQL database (document-oriented)**:
- Collections: Như tables
- Documents: Như rows
- Sub-collections: Nested data
- Real-time listeners: Auto sync
- Security Rules: Access control

**Data organization strategy:**

1. **Top-level collections**: users, transactions, habits, posts, comments, insights, reports, wallets, categories, auditLogs
2. **Sub-collections**: 
   - users/{userId}/wallets
   - users/{userId}/goals
   - users/{userId}/preferences
   - habits/{habitId}/checkIns
   - posts/{postId}/comments
3. **Denormalization**: Duplicate data (e.g., store authorName in post for performance)

### 3.3.2. Chi tiết từng Collection

**1. Users Collection:**
- Primary key: uid (Firebase UID)
- Lưu: email, displayName, avatar URL, preferences, role
- Sub-collections: wallets, goals, insights
- Indexes: email, role, createdAt

**2. Transactions Collection:**
- Primary key: auto-generated ID
- Foreign key: userId, walletId
- Lưu: amount, category, type, description, date, image URL
- Indexes: userId + date, category, walletId
- Aggregate queries: monthly spending, by category

**3. Habits Collection:**
- Primary key: auto-generated ID
- Foreign key: userId
- Lưu: title, category, frequency, reminder time, currentStreak, longestStreak
- Sub-collections: checkIns (document id: habitId_YYYY-MM-DD)
- Indexes: userId, status, category

**4. Posts Collection:**
- Primary key: auto-generated ID
- Foreign key: authorId
- Lưu: title, content, category, tags, image URLs, status, likes count, comment count
- Sub-collections: comments, likedBy (for efficient like tracking)
- Indexes: status, category, createdAt, authorId
- Full-text search: Need secondary implementation

**5. Comments Collection** (Sub-collection of Posts):
- Primary key: auto-generated ID
- Foreign key: authorId, parentCommentId (for nested comments)
- Lưu: content, likes count, status (published/hidden)

**6. Insights Collection**:
- Primary key: auto-generated ID
- Foreign key: userId
- Lưu: type, title, content, category, read status
- Indexes: userId, read, createdAt (for latest first)

**7. Reports Collection**:
- Primary key: auto-generated ID
- Foreign key: reporterId, contentId
- Lưu: reason, description, status, resolved action
- Indexes: status, reason, createdAt

**8. Wallets Collection** (Sub-collection of Users):
- Primary key: auto-generated ID
- Lưu: name, type, balance, currency, color
- Update on transaction create/delete

**9. Categories Collection:**
- Primary key: auto-generated or predefined (FOOD, TRANSPORT)
- Lưu: name, color, icon, order
- System default categories + user custom

**10. AuditLogs Collection:**
- Primary key: auto-generated ID
- Foreign key: adminId
- Lưu: action (approve, reject, ban, delete), targetId, reason
- Indexes: adminId, action, createdAt

### 3.3.3. Mối quan hệ & Ràng buộc dữ liệu

**Foreign Key Relationships:**

| Collection | Foreign Key | References | Type |
|---|---|---|---|
| transactions | userId | users.uid | 1:N |
| transactions | walletId | wallets.id | N:1 |
| habits | userId | users.uid | 1:N |
| habitCheckIns | habitId | habits.id | 1:N |
| posts | authorId | users.uid | N:1 |
| comments | authorId | users.uid | N:1 |
| comments | parentCommentId | comments.id | 1:N |
| insights | userId | users.uid | 1:N |
| reports | reporterId | users.uid | N:1 |
| reports | contentId | posts.id OR comments.id | N:1 |
| auditLogs | adminId | users.uid | N:1 |

**Data Integrity Rules:**

1. **Cascade delete**: User delete → xóa tất cả transactions, habits, posts của user
2. **Balance update**: Add transaction → cập nhật wallet balance ngay lập tức
3. **Status validation**: Posts chỉ có status = published, draft, rejected, archived
4. **Date validation**: Transaction date không được sau hôm nay

### 3.3.4. Optimization Strategies

**Denormalization:**
- Lưu authorName trong post document (thay vì join)
- Lưu categoryName + color trong transaction (không query categories collection)

**Indexing:**
- Composite indexes: userId + date, status + createdAt
- Single field indexes: category, walletId, role

**Sharding:**
- Large collections (transactions) không cần sharding (auto-scale)
- Trong tương lai có thể shard by userId (hot key)

**Pagination:**
- Query transactions with limit 20, use cursor for next page
- FlatList virtualization on mobile

**Caching:**
- Redux cache: Store transactions in memory
- Last query timestamp: Avoid redundant queries
- Offline sync: Queue writes when offline, sync on reconnect

## 3.4. Tóm tắt Chương 3

Chương 3 đã trình bày chi tiết:

1. **Use case diagram**: 11 main use cases cho 3 actor types
2. **Business flows**: Add transaction, check-in habit, generate insights, post creation
3. **System architecture**: 4 layers (presentation, business logic, data access, backend)
4. **Component responsibilities**: Auth, transaction management, habit tracking, analytics
5. **Database design**: 11 collections, foreign keys, denormalization, indexes
6. **Optimization**: Caching, pagination, composite indexes, offline support

Thiết kế hệ thống Assist được xây dựng dựa trên:
- **Clean Architecture**: Separate concerns (UI, business, data)
- **Scalability**: NoSQL, auto-scaling services
- **Performance**: Caching, indexing, lazy loading
- **Security**: Firestore security rules, encryption

# CHƯƠNG 4: TRIỂN KHAI VÀ XÂY DỰNG HỆ THỐNG

## 4.1. Thiết kế giao diện người dùng (UI/UX Design)

### 4.1.1. Nguyên tắc thiết kế UI/UX

**Design Principles cho Assist:**

1. **Simplicity**: Giao diện sạch, không quá phức tạp
   - Ẩn các tùy chọn phụ trong menus
   - Tập trung vào các action chính
   - Minimize cognitive load

2. **Consistency**: Toàn bộ app có cảm giác nhất quán
   - Cùng color scheme, typography, spacing
   - Cùng patterns cho similar actions
   - Design system duy nhất

3. **Feedback**: User biết được điều gì đang xảy ra
   - Loading indicators cho async operations
   - Toast notifications cho quick feedback
   - Progress bars cho long operations
   - Error messages rõ ràng, helpful

4. **Accessibility**: Ứng dụng dễ sử dụng cho tất cả
   - High contrast for readability
   - Large touch targets (min 44x44 points)
   - Screen reader support
   - Keyboard navigation

5. **Performance**: UI responsive, không lag
   - Smooth animations (60 FPS)
   - Quick transitions (<300ms)
   - Lazy loading for long lists
   - Optimized images

### 4.1.2. Các màn hình chính của ứng dụng

#### **4.1.2.1. Màn hình Đăng nhập & Đăng ký (Auth Screens)**

**Màn hình Đăng nhập (Login Screen):**

Layout:
- Header: Assist logo + "Sign In"
- Email input field (with validation)
- Password input field (with show/hide toggle)
- "Forgot Password?" link
- "Sign In" button (disabled nếu form invalid)
- Divider: "Or continue with"
- "Sign in with Google" button
- "Sign in with Facebook" button
- "Don't have an account?" link → Register

Features:
- Input validation (real-time): Email format, password length >= 8
- Error messages: "Invalid email", "Wrong password"
- Loading state: Button disabled, spinner showing
- Remember me (optional)
- Biometric login (fingerprint/face) for future

**Màn hình Đăng ký (Register Screen):**

Layout:
- Header: "Create Account"
- Email input
- Password input (with strength indicator)
- Confirm password input
- Display name input
- Agree to terms checkbox
- "Create Account" button
- Already have account? → Login

Features:
- Password strength: Weak/Fair/Good/Strong (visual indicator)
- Real-time validation: All fields required
- Show/hide password toggle
- Email verification (send link)
- Terms & Privacy Policy links

#### **4.1.2.2. Màn hình Dashboard chính (Home Screen)**

**Layout:**

```
Top: Header with greeting + profile icon
│
├─ Summary Cards:
│  ├─ "Today's Spending: 450,000 VND" (with trend ↑↓)
│  ├─ "This Month: 12,500,000 VND" (with % used)
│  └─ "Habit Progress: 5/7 habits" (with progress bar)
│
├─ Quick Action Buttons:
│  ├─ + Add Transaction (FAB - main action)
│  ├─ Add Habit
│  └─ View Insights
│
├─ Recent Transactions (Last 5):
│  ├─ [Food] Lunch at X: -150,000 (Today 12:30)
│  ├─ [Transport] Taxi: -50,000 (Today 08:00)
│  └─ "View all" link
│
├─ Today's Habits:
│  ├─ [✓] Morning Exercise
│  ├─ [✗] Reading 30 mins
│  └─ [?] Meditation (not checked yet)
│
└─ AI Insights Widget:
   └─ "You spent 15% less on Food this week 📊"
      "Keep it up!"
```

Features:
- Real-time data updates (from Firebase listeners)
- Pull-to-refresh
- Swipe actions on transactions (edit, delete)
- Tap on cards to open detailed views

#### **4.1.2.3. Màn hình Quản lý Chi tiêu (Finance Screen)**

**Tab 1: Danh sách Giao dịch**

Layout:
- Search/filter bar (with icon)
- Filter button (date range, category, wallet)
- Grouped by date (Today, Yesterday, This Week)
- List of transactions:
  - Category icon + name
  - Description + amount
  - Time
  - Edit/delete swipe actions

Features:
- Infinite scroll
- Fast search
- Category colors
- Soft delete with undo (24h window)

**Tab 2: Biểu đồ & Báo cáo**

Layout:
- Period selector (This month / Last month / This year / Custom)
- Pie chart: Spending by category
- Bar chart option: Daily spending trend
- Line chart option: Monthly trend
- Category breakdown table:
  - Category | Amount | % | Trend

Features:
- Tap pie slice → see transactions in that category
- Export report as PDF
- Compare with previous period
- Budget status: X/Y spent (red if exceeded)

**Tab 3: Quản lý Ví**

Layout:
- List of wallets:
  - [💵] Cash: 500,000 VND (default)
  - [💳] Credit Card: 15,000,000 VND
  - [🏦] Bank Account: 50,000,000 VND
- Total balance across all wallets
- Add wallet button (+)

Features:
- Tap wallet → see transactions for that wallet
- Edit wallet (name, type, color)
- Delete wallet (if empty)
- Set default wallet

#### **4.1.2.4. Màn hình Quản lý Thói quen (Habits Screen)**

Layout:
- Period selector (This week / This month / All time)
- Today's habits summary: "3/7 completed"
- List of active habits:
  - Habit title + description
  - Current streak: "🔥 12 days"
  - Check-in status: [✓] or [  ] (today's status)
  - Progress: "23/30 this month"
  - Tap to check-in or view details

Features:
- Tap habit → see check-in history (calendar)
- Swipe to edit/delete
- Add habit button (+)
- Habit detail screen:
  - Full description
  - Frequency, reminder time
  - Last 30 days timeline
  - Current streak, longest streak
  - Milestones achieved

#### **4.1.2.5. Màn hình Cộng đồng (Community Screen)**

Layout:
- Search bar + filter button
- Feed of posts (infinite scroll):
  - Author avatar + name + time ago
  - Post title
  - Post content (truncated, "Read more..." link)
  - Image (if any)
  - Category tag + custom tags
  - Engagement: ❤️ 42 | 💬 5 | 📤 3
  - Icons: like, comment, share, bookmark, more menu

Features:
- Pull to refresh
- Tap post → detail view
- Like/unlike with animation
- Comment (bottom sheet)
- Share (system share dialog)
- Bookmark to "Saved"
- Report post (long press)

**Compose Post Screen:**
- Title input
- Rich text editor (bold, italic, link, bullet points)
- Image upload (1-5 images, carousel)
- Category selector
- Tags input
- Preview button
- Publish / Save Draft button

#### **4.1.2.6. Màn hình Tài khoản (Profile & Settings)**

Layout:
- Profile header:
  - Avatar + edit button
  - Display name + bio (edit)
- Quick stats:
  - Total transactions
  - Active habits
  - Posts created
- Settings sections:
  - Preferences (theme, language, notifications)
  - Wallets & Categories
  - Data & Privacy (export data, delete account)
  - About & Support (FAQ, contact, version)
  - Sign Out button

### 4.1.3. Navigation Structure

**Bottom Tab Navigation:**
```
Home | Finance | Habits | Community | Profile
```

**Stack Navigators (per tab):**
- Home Stack: Home → Transaction Detail → Edit Transaction → Insights Detail
- Finance Stack: Finance → Wallet Detail → Add Transaction → Charts Detail
- Habits Stack: Habits → Habit Detail → Edit Habit → Habit History
- Community Stack: Community → Post Detail → Create Post → Comments
- Profile Stack: Profile → Edit Profile → Settings → Data Export

**Modal Stacks (overlay):**
- Add Transaction (from any tab via FAB)
- Add Habit (from Habits tab)
- Create Post (from Community tab)
- Full Screen Modals: Image viewer, Date picker, etc.

### 4.1.4. Visual Design System

**Color Palette:**

Primary Colors:
- **Primary**: #6366F1 (Indigo) - Main actions, highlights
- **Secondary**: #10B981 (Green) - Success, income
- **Danger**: #EF4444 (Red) - Expenses, errors
- **Warning**: #F59E0B (Amber) - Warnings, alerts

Neutral Colors:
- **Dark**: #1F2937 (Dark gray) - Text
- **Medium**: #6B7280 (Medium gray) - Secondary text
- **Light**: #F3F4F6 (Light gray) - Backgrounds
- **White**: #FFFFFF - Surfaces

**Typography:**

Fonts:
- **Header**: San Francisco (iOS), Roboto (Android) - system fonts
- Fallback: Helvetica, Arial

Sizes:
- **H1 (Page Title)**: 32px, bold, dark
- **H2 (Section)**: 24px, semibold, dark
- **H3 (Subsection)**: 18px, semibold, dark
- **Body**: 16px, regular, dark
- **Small**: 14px, regular, medium (secondary text)
- **Label**: 12px, medium, medium (captions)

Line height: 1.5x font size (readable)

**Spacing:**

Base unit: 8px
- **Margin**: 8, 16, 24, 32px
- **Padding**: 8, 12, 16, 20px
- **Gap**: 4, 8, 16px between elements

**Component Sizing:**

Buttons:
- Height: 44px (min touch target)
- Padding: 12px horizontal, 10px vertical
- Border radius: 8px

Cards:
- Border radius: 12px
- Padding: 16px
- Shadow: Light shadow on light mode

Input fields:
- Height: 44px
- Padding: 12px
- Border: 1px light gray, darker on focus

**Icons:**

- Size: 24px (default), 16px (inline), 32px (large)
- Style: Outline (not filled)
- Library: Feather Icons, Material Design Icons

### 4.1.5. Animation & Transitions

**Entrance animations:**
- Screens: Slide up + fade (300ms)
- Modals: Scale up + fade (300ms)
- Lists: Fade in (200ms)

**Button interactions:**
- Press: Scale 0.98, opacity 0.7 (100ms)
- Release: Spring back (200ms)

**Habit streak update:**
- Bounce animation (500ms) when streak increases

**Transaction confirmation:**
- Checkmark animation + slight scale

**Loading states:**
- Spinner animation (smooth rotation)
- Skeleton loaders for lists

**Transitions:**
- Screen transitions: 300ms ease-out
- Tab switches: 200ms ease-in-out
- Modal dismiss: Slide down + fade (250ms)

### 4.1.6. Responsive Design & Device Support

**Screen sizes:**
- Small phones: 4.5-5.2" (iPhone SE, SE2)
- Medium: 5.3-5.8" (iPhone 12-14)
- Large: 6.1-6.7" (iPhone 14 Pro, Plus models)
- Tablets: 7-10" (iPad, Android tablets)

**Approach:**
- Mobile-first design (start with small screens)
- Flexible layouts (use percentages, not fixed widths)
- Adjust spacing/font for larger screens
- Portrait orientation (primary), landscape support (secondary)

**Testing:**
- Test on iPhone SE, iPhone 14, iPhone 14 Pro Max
- Test on Samsung S22, Pixel 7, Oneplus
- Test on iPad for tablet layouts

### 4.1.7. Accessibility Features

**WCAG 2.1 Level AA Compliance:**

1. **Visual Accessibility:**
   - Color contrast >= 4.5:1 for text
   - Don't rely on color alone (use icons + text)
   - Allow text scaling up to 200%
   - Dark mode support

2. **Touch Accessibility:**
   - Minimum touch targets: 44x44 points
   - Adequate spacing between interactive elements
   - Swipe gestures have keyboard alternatives

3. **Screen Reader Support:**
   - All images have alt text
   - Form inputs have labels
   - Semantic HTML/native elements
   - Announce status changes

4. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Visible focus indicators
   - Return/Enter to activate buttons
   - Escape to close modals

5. **Motion:**
   - Respect prefers-reduced-motion setting
   - Disable animations if user prefers
   - Avoid flashing content

### 4.1.8. User Testing & Feedback

**Testing Methods:**

1. **Usability Testing** (5-8 users):
   - Task-based scenarios
   - Think-aloud protocol
   - Measure: Time to complete, error rate, satisfaction

2. **A/B Testing**:
   - Two layouts for transaction list
   - Button placement for quick actions
   - Measure: Engagement, click-through rate

3. **Analytics**:
   - Track screen views
   - Track feature usage (add transaction, check-in)
   - Identify drop-off points

4. **User Feedback**:
   - In-app feedback form
   - Rating/review in app stores
   - Community forum discussions

### 4.1.9. Implementation Details

**Technology Stack:**

Frontend:
- React Native (JavaScript/TypeScript)
- React Navigation (routing)
- Redux (state management)
- React Native Paper (UI component library) or Custom Components
- D3.js / Victory (charts)
- Gesture Handler (advanced gestures)

**Code Organization:**

```
screens/
├── Auth/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── ForgotPasswordScreen.tsx
├── Home/
│   └── HomeScreen.tsx
├── Finance/
│   ├── FinanceScreen.tsx
│   ├── AddTransactionScreen.tsx
│   └── TransactionDetailScreen.tsx
├── Habits/
│   ├── HabitsScreen.tsx
│   ├── AddHabitScreen.tsx
│   └── HabitDetailScreen.tsx
├── Community/
│   ├── CommunityScreen.tsx
│   ├── PostDetailScreen.tsx
│   └── CreatePostScreen.tsx
└── Profile/
    ├── ProfileScreen.tsx
    └── SettingsScreen.tsx

components/
├── Transaction/
│   ├── TransactionCard.tsx
│   ├── TransactionList.tsx
│   └── TransactionForm.tsx
├── Habit/
│   ├── HabitCard.tsx
│   └── StreakDisplay.tsx
├── Common/
│   ├── Header.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── ...
└── Charts/
    ├── PieChart.tsx
    └── BarChart.tsx
```

## 4.2. Triển khai Backend & Integration

### 4.2.1. Deployment Architecture

**Hosting & Infrastructure:**

Frontend:
- **Distribution**: Deploy APK/IPA to Google Play Store & Apple App Store
- **Auto updates**: Implement CodePush/EAS Updates for instant patches

Backend:
- **Firebase Firestore**: NoSQL database (managed by Google)
- **Cloud Functions**: Serverless compute (Node.js runtime)
- **Cloud Storage**: Image storage (auto-scaled)
- **Authentication**: Firebase Auth (managed)

**Environment Configuration:**

Development:
- Firebase project (dev)
- Staging: Separate Firebase project
- Production: Main Firebase project

Credentials:
- Store in environment variables (not in code)
- Use Firebase local emulator for local testing
- GitHub Secrets for CI/CD

### 4.2.2. Build & Release Process

**Build Pipeline:**

1. **Local Build**:
   - Run tests
   - Lint check
   - Build APK/IPA
   - Run end-to-end tests

2. **CI/CD (GitHub Actions)**:
   - Trigger on push to main/develop
   - Build Android APK
   - Build iOS IPA
   - Run tests
   - Upload to app stores (automatic)

3. **App Store Submission**:
   - Google Play Store: Automated with Fastlane
   - Apple App Store: Automated with Fastlane
   - Update app store listing, screenshots, description

**Release Versioning:**

- Semantic Versioning: MAJOR.MINOR.PATCH (1.0.0)
- Android versionCode: Incremental (1, 2, 3,...)
- iOS version: Same as semantic version

### 4.2.3. Testing Strategy

**Test Pyramid:**

```
        /\
       /  \  E2E Tests (5%)
      /____\
     /      \
    /  Int.  \ Integration Tests (15%)
   /________\
  /          \
 /   Unit     \ Unit Tests (80%)
/_____________\
```

**Unit Tests (Jest):**
- Test individual functions, services, reducers
- Mocking Firebase calls
- Coverage target: 80%

**Integration Tests:**
- Test interaction between components & services
- Firebase emulator for real Firestore interactions
- Test auth flow, transaction creation, etc.

**End-to-End Tests (Detox):**
- Test full user workflows
- Real app execution on emulator/device
- Scenarios: Sign up → Add transaction → Check-in habit

**Manual Testing:**
- UAT on real devices
- Test on various Android/iOS versions
- Test on slow network (Network Link Conditioner)
- Test on low battery mode

### 4.2.4. Monitoring & Analytics

**Performance Monitoring:**

- Firebase Performance Monitoring
- Track: App startup time, screen load time, API call duration
- Alerts if metrics exceed thresholds

**Crash Reporting:**

- Firebase Crashlytics
- Auto-capture all crashes
- Symbol uploading for native crashes
- Issue grouping & trends

**User Analytics:**

- Google Analytics for Firebase
- Track: DAU, MAU, feature usage, retention
- Funnel analysis: Sign up → Add transaction → Check-in habit
- User segmentation: By feature usage, spending patterns

**Logging:**

- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR
- Centralized logging: Google Cloud Logging
- Performance: Don't log sensitive data

### 4.2.5. Maintenance & Updates

**Bug Fixes:**

- Hotfix branch for critical issues
- Test fix thoroughly
- Deploy to production ASAP

**Feature Updates:**

- Develop on feature branches
- Code review before merge
- Merge to develop, then to main
- Release to app stores

**Dependency Updates:**

- Monthly dependency updates
- Check for security vulnerabilities
- Test after updates
- Update CHANGELOG

**Deprecations:**

- Announce deprecated APIs/features
- Provide migration path
- Support for 2-3 app versions
- Remove in next major version

## 4.3. Tóm tắt Chương 4 & Kết Luận Chung

Chương 4 đã đề cập:

1. **UI/UX Design**: 6 màn hình chính, navigation structure, visual design system
2. **Component Details**: Cards, buttons, forms, modals, animations
3. **Responsive Design**: Support cho tất cả kích cỡ màn hình
4. **Accessibility**: WCAG 2.1 compliance
5. **Backend Implementation**: Firestore, Cloud Functions, image storage
6. **Deployment**: CI/CD pipeline, app store submission
7. **Testing**: Unit, integration, E2E tests
8. **Monitoring**: Performance, crash reporting, analytics

**Tổng Kết Toàn Bộ Báo Cáo:**

Assist là ứng dụng di động toàn diện kết hợp ba tính năng chính:
- **Quản lý chi tiêu**: Ghi, phân tích, đưa ra cảnh báo
- **Theo dõi thói quen**: Check-in hàng ngày, streak tracking, motivation
- **AI-powered insights**: Phân tích từ Gemini AI, gợi ý cá nhân hóa
- **Cộng đồng chia sẻ**: Forum chia sẻ kinh nghiệm, bình luận, like/share

**Công nghệ sử dụng:**
- Frontend: React Native, TypeScript, Redux
- Backend: Firebase, Cloud Functions, Gemini AI
- Database: Firestore (NoSQL)
- Hosting: Google Cloud Platform

**Điểm nổi bật của Assist:**
1. Toàn diện: Không chỉ quản lý chi tiêu, còn quản lý cuộc sống toàn bộ
2. AI-powered: Gợi ý thông minh dựa vào hành vi cá nhân
3. Cộng đồng: Học từ người khác, chia sẻ kinh nghiệm
4. User-friendly: Giao diện đơn giản, dễ sử dụng
5. Scalable: Kiến trúc mở rộng được, sẵn sàng cho hàng triệu users

**Tiềm năng phát triển tương lai:**
- Tích hợp ngân hàng (bill payments, automatic categorization)
- Quản lý đầu tư (stock, crypto tracking)
- Family sharing (chia sẻ ví gia đình)
- Advanced gamification (badges, leaderboards)
- Voice budgeting (speak transactions)

Với thiết kế kỹ lưỡng, kiến trúc vững chắc, và công nghệ hiện đại, Assist có tiềm năng trở thành ứng dụng quản lý tài chính & thói quen hàng đầu tại Việt Nam.

