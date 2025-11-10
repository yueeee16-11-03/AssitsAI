// Import các thư viện cần thiết cho MÁY CHỦ (Backend)
import {onDocumentCreated} from
  "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import {getMessaging} from "firebase-admin/messaging";

// Import Cloud Function generateSmartBudget


// Khởi tạo Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// (Interface này khớp với dữ liệu bạn gửi)
interface TransactionItem {
  item: string;
  amount: number;
}

interface Transaction {
  type: string;
  categoryId: string;
  category?: string;
  amount: number;
  date: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  description?: string;
  items?: TransactionItem[];
  hasAIProcessing?: boolean;
  isDeleted?: boolean;
}

/**
 * ===================================================================
 * HÀM CẤP 3 (PHẦN 1): CẢNH BÁO TỨC THỜI KHI VƯỢT NGÂN SÁCH (Cú pháp v2)
 * ===================================================================
 */
export const checkBudgetOnTransactionCreate = onDocumentCreated(
  {
    document: "users/{userId}/transactions/{transactionId}",
    region: "asia-southeast1",
  },
  async (event) => {
    if (!event.data) {
      logger.log("Event không có data. Bỏ qua.");
      return null;
    }
    const snap = event.data;
    const newTransaction = snap.data() as Transaction;
    const userId = event.params.userId;

    // ---------------------------------------------------------------
    // 2. BỘ LỌC: CHỈ KIỂM TRA CHI TIÊU
    // ---------------------------------------------------------------
    if (
      newTransaction.type !== "expense" ||
      !newTransaction.categoryId
    ) {
      logger.log(
        `[${userId}] Giao dịch ${newTransaction.type}, ` +
          "không phải expense. Bỏ qua."
      );
      return null;
    }

    // Kiểm tra xem giao dịch đã bị xóa không
    if (newTransaction.isDeleted) {
      logger.log(`[${userId}] Giao dịch đã bị xóa. Bỏ qua.`);
      return null;
    }

    const categoryId = newTransaction.categoryId;
    const categoryName = newTransaction.category || "Một danh mục";
    const transactionAmount = newTransaction.amount || 0;

    if (transactionAmount <= 0) {
      logger.log(
        `[${userId}] Số tiền chi tiêu <= 0. Bỏ qua.`
      );
      return null;
    }

    logger.log(
      `⚡️ [${userId}] Giao dịch chi tiêu mới ` +
        `[${categoryName}] - ` +
        `${transactionAmount.toLocaleString("vi-VN")}đ`
    );

    try {
      // ---------------------------------------------------------------
      // 3. TÌM NGÂN SÁCH (BUDGET) TƯƠNG ỨNG
      // ---------------------------------------------------------------
      const budgetRef = db.doc(
        `users/${userId}/budgets/${categoryId}`
      );
      const budgetDoc = await budgetRef.get();

      if (!budgetDoc.exists) {
        logger.log(
          `[${userId}] Không tìm thấy ngân sách ` +
            `cho [${categoryName}]. Bỏ qua.`
        );
        return null;
      }

      const budgetData = budgetDoc.data();
      const budgetAmount = budgetData?.amount || 0;

      if (budgetAmount <= 0) {
        logger.log(
          `[${userId}] Ngân sách là 0 hoặc âm. ` +
            "Bỏ qua."
        );
        return null;
      }

      logger.log(
        `[${userId}] ✓ Tìm thấy ngân sách cho ` +
          `[${categoryName}]: ` +
          `${budgetAmount.toLocaleString("vi-VN")}đ`
      );

      // ---------------------------------------------------------------
      // 4. TÍNH TỔNG CHI TIÊU THỰC TẾ (TRONG KỲ)
      // ---------------------------------------------------------------
      const transactionDate =
        newTransaction.date?.toDate() || new Date();
      const startOfMonth = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth() + 1,
        0
      );

      logger.log(
        `[${userId}] ⏰ Tính tổng chi tiêu từ ` +
          `${startOfMonth.toLocaleDateString("vi-VN")} ` +
          `đến ${endOfMonth.toLocaleDateString("vi-VN")}`
      );

      // Query: categoryId + type + date (needs Composite Index)
      const transactionsSnap = await db
        .collection(`users/${userId}/transactions`)
        .where("categoryId", "==", categoryId)
        .where("type", "==", "expense")
        .where("isDeleted", "==", false)
        .where(
          "date",
          ">=",
          admin.firestore.Timestamp.fromDate(startOfMonth)
        )
        .where(
          "date",
          "<=",
          admin.firestore.Timestamp.fromDate(endOfMonth)
        )
        .get();

      const totalSpent = transactionsSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );

      logger.log(
        `[${userId}] 📊 Ngân sách [${categoryName}]: ` +
          `${budgetAmount.toLocaleString("vi-VN")}đ | ` +
          `Thực tế: ${totalSpent.toLocaleString("vi-VN")}đ`
      );

      // ---------------------------------------------------------------
      // 5. SO SÁNH VÀ GỬI CẢNH BÁO
      // ---------------------------------------------------------------
      const oldSpent = totalSpent - transactionAmount;

      if (
        totalSpent > budgetAmount &&
        oldSpent <= budgetAmount
      ) {
        logger.log(
          `🚨 [${userId}] CẢNH BÁO: ` +
            `Vượt ngân sách [${categoryName}]!`
        );
        logger.log(
          `   Vượt: ${(totalSpent - budgetAmount).toLocaleString(
            "vi-VN"
          )}đ`
        );

        try {
          const userDoc = await db
            .collection("users")
            .doc(userId)
            .get();
          const userData = userDoc.data();
          const fcmToken = userData?.fcmToken;

          if (!fcmToken) {
            logger.log(
              `[${userId}] ⚠️  Không tìm thấy FCM Token. ` +
                "Bỏ qua gửi thông báo."
            );
            return null;
          }

          const excessAmount = totalSpent - budgetAmount;
          const percentageUsed = Math.round(
            (totalSpent / budgetAmount) * 100
          );

          const payload = {
            notification: {
              title: "⚠️ Cảnh báo vượt Ngân sách!",
              body:
                "Bạn đã chi " +
                `${totalSpent.toLocaleString("vi-VN")}đ ` +
                "cho " +
                categoryName +
                ", vượt quá " +
                `${excessAmount.toLocaleString("vi-VN")}đ`,
            },
            data: {
              type: "BUDGET_EXCEEDED",
              categoryId: categoryId,
              categoryName: categoryName,
              totalSpent: totalSpent.toString(),
              budgetAmount: budgetAmount.toString(),
              excessAmount: excessAmount.toString(),
              percentageUsed: percentageUsed.toString(),
              transactionId: event.params.transactionId,
              userId: userId,
            },
            token: fcmToken,
          };

          const messageId = await getMessaging().send(
            payload
          );
          logger.log(
            `✅ [${userId}] Đã gửi Push ` +
              `Notification. Message ID: ${messageId}`
          );
        } catch (notificationError) {
          logger.error(
            `[${userId}] ❌ Lỗi khi gửi thông báo:`,
            notificationError
          );
        }
      } else if (
        totalSpent > budgetAmount &&
        oldSpent > budgetAmount
      ) {
        logger.log(
          `[${userId}] 📌 Giao dịch này tiếp tục ` +
            "vượt ngân sách. Đã gửi cảnh báo trước đó."
        );
      } else {
        logger.log(
          `[${userId}] ✓ Giao dịch này nằm trong ` +
            "ngân sách."
        );
      }
    } catch (error) {
      logger.error(
        `[${userId}] ❌ Lỗi khi kiểm tra ngân sách:`,
        error
      );
      throw error;
    }

    return null;
  }
);
