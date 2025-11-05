import { useMemo } from "react";

interface FinancialData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingRate: string;
  transactionCount: number;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date?: any;
  createdAt?: any;
  [key: string]: any;
}

/**
 * 🎯 Custom Hook: Calculate financial data by period
 * Tách logic tính toán ra khỏi UI component
 * 
 * Usage:
 * const financialData = useFinancialData(transactions, 'month');
 */
export const useFinancialData = (
  transactions: Transaction[] | null | undefined,
  period: "day" | "week" | "month" | "year"
): FinancialData => {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        savingRate: "0.0",
        transactionCount: 0,
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

    // 📊 Lọc transactions trong khoảng thời gian
    const filteredTransactions = transactions.filter((tx: any) => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date || tx.createdAt);
      return txDate >= startDate && txDate <= now;
    });

    console.log(
      `📅 [PERIOD-${period.toUpperCase()}] Filtered ${filteredTransactions.length} transactions from ${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}`
    );

    // 💰 Tính tổng thu nhập và chi tiêu
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx: any, index: number) => {
      const amount = tx.amount || 0;
      
      // Debug: Log 5 giao dịch đầu tiên
      if (index < 5) {
        console.log(
          `   📌 TX[${index}]: type=${tx.type}, amount=${amount}, category=${tx.category}, description=${tx.description?.substring(0, 30)}`
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
      `💹 [PERIOD-${period.toUpperCase()}] Income: ${totalIncome}, Expense: ${totalExpense}, Balance: ${balance}, SavingRate: ${savingRate}%`
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      savingRate,
      transactionCount: filteredTransactions.length,
    };
  }, [transactions, period]);
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
