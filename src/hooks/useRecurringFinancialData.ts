import { useMemo } from "react";

interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingRate: string;
  transactionCount: number;
  recurringCount: number;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date?: any;
  createdAt?: any;
  [key: string]: any;
}

interface RecurringTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  nextDue?: any;
  [key: string]: any;
}

/**
 * 🎯 Custom Hook: Calculate financial data by period
 * ⭐ NOW INCLUDES RECURRING TRANSACTIONS
 * Tách logic tính toán ra khỏi UI component
 * 
 * Usage:
 * const financialData = useRecurringFinancialData(transactions, recurringTransactions, 'month');
 */
export const useRecurringFinancialData = (
  transactions: Transaction[] | null | undefined,
  recurringTransactions: RecurringTransaction[] | null | undefined,
  period: "day" | "week" | "month" | "year"
): FinancialData => {
  return useMemo(() => {
    console.log('⚙️ [useRecurringFinancialData] Calculating for period:', period);
    console.log('   Regular transactions:', transactions?.length || 0);
    console.log('   Recurring transactions:', recurringTransactions?.length || 0);
    
    // 📊 Initialize with zero values
    if ((!transactions || transactions.length === 0) && (!recurringTransactions || recurringTransactions.length === 0)) {
      console.log('✅ [useRecurringFinancialData] No transactions, returning zeros');
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        savingRate: "0.0",
        transactionCount: 0,
        recurringCount: 0,
      };
    }

    const now = new Date();
    let startDate = new Date();

    // 🔍 Xác định range ngày theo period
    switch (period) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // 📊 Lọc regular transactions trong khoảng thời gian
    const filteredTransactions = (transactions || []).filter((tx: any) => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date || tx.createdAt);
      return txDate >= startDate && txDate <= now;
    });

    console.log(
      `📅 [PERIOD-${period.toUpperCase()}] Filtered ${filteredTransactions.length} regular transactions from ${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}`
    );

    // 📊 ⭐ RECURRING TRANSACTIONS: DON'T FILTER BY PERIOD
    // Recurring transactions are ACTIVE/ONGOING and should always be counted in statistics
    // They represent money that will be added/subtracted regularly
    // Only filter by period for transaction HISTORY, not for STATISTICS
    const filteredRecurring = recurringTransactions || [];
    
    console.log(
      `📅 [PERIOD-${period.toUpperCase()}] Including ALL ${filteredRecurring.length} recurring transactions (not period-filtered for statistics)`
    );

    // 💰 Tính tổng thu nhập và chi tiêu từ regular transactions
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx: any, index: number) => {
      const amount = tx.amount || 0;
      
      // Debug: Log 5 giao dịch đầu tiên
      if (index < 5) {
        console.log(
          `   📌 REGULAR[${index}]: type=${tx.type}, amount=${amount}, category=${tx.category}, description=${tx.description?.substring(0, 30)}`
        );
      }
      
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        totalExpense += amount;
      }
    });

    // 💰 Cộng thêm từ recurring transactions
    filteredRecurring.forEach((tx: any, index: number) => {
      const amount = tx.amount || 0;
      
      // Debug: Log recurring transactions
      if (index < 5) {
        console.log(
          `   🔄 RECURRING[${index}]: type=${tx.type}, amount=${amount}, description=${tx.description?.substring(0, 30)}`
        );
      }
      
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        totalExpense += amount;
      }
    });

    // 🧮 Tính balance và saving rate
    // Công thức: Tiết kiệm (%) = ((Thu nhập - Chi tiêu) / Thu nhập) * 100
    const balance = totalIncome - totalExpense;
    const savingRate =
      totalIncome > 0
        ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)
        : "0.0";

    console.log(
      `💹 [PERIOD-${period.toUpperCase()}] ⭐ FINAL RESULT WITH RECURRING:\n   Income: ${totalIncome}\n   Expense: ${totalExpense}\n   Balance: ${balance}\n   SavingRate: ${savingRate}%\n   RegularTx: ${filteredTransactions.length}\n   RecurringTx: ${filteredRecurring.length}`
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      savingRate,
      transactionCount: filteredTransactions.length,
      recurringCount: filteredRecurring.length,
    };
  }, [transactions, recurringTransactions, period]);
};

/**
 * 🎯 Helper: Format currency (VND)
 * Sử dụng trong UI để hiển thị số tiền
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("vi-VN");
};

/**
 * 🎯 Helper: Format currency in millions
 * Sử dụng trong UI để hiển thị số tiền dạng "22.5M"
 */
export const formatCurrencyMillions = (amount: number): string => {
  return (amount / 1000000).toFixed(1);
};

/**
 * 🎯 Helper: Get date range by period
 * Trả về text mô tả khoảng thời gian
 */
export const getDateRangeByPeriod = (period: "day" | "week" | "month" | "year"): string => {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case "day":
      return `Hôm nay (${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()})`;
    case "week":
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      return `Tuần ${Math.ceil((now.getDate() - dayOfWeek + 1) / 7)}`;
    case "month":
      return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    case "year":
      return `Năm ${now.getFullYear()}`;
    default:
      return "";
  }
};
