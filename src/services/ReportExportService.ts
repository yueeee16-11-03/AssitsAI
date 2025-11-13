/**
 * Report Export Service
 * Xử lý logic tạo và xuất báo cáo
 */

import {
  Budget,
  Habit,
  Goal,
  ReportType,
  ReportData,
} from '../types/report';

class ReportExportService {
  /**
   * Định dạng tiền tệ VND
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  /**
   * Lấy nhãn khoảng thời gian
   */
  getPeriodLabel(
    period: 'week' | 'month' | 'quarter' | 'year' | 'custom',
    startDate?: Date,
    endDate?: Date
  ): string {
    switch (period) {
      case 'week':
        return 'Tuần này';
      case 'month':
        return 'Tháng này';
      case 'quarter':
        return 'Quý này';
      case 'year':
        return 'Năm này';
      case 'custom':
        if (startDate && endDate) {
          return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
        }
        return 'Khoảng thời gian tùy chọn';
      default:
        return '';
    }
  }

  /**
   * Tạo báo cáo CSV
   */
  generateCSV(
    reportType: ReportType,
    reportData: ReportData,
    budgets?: Budget[],
    habits?: Habit[],
    goals?: Goal[],
    periodLabel?: string
  ): string {
    let csv = '';

    if (reportType === 'detailed') {
      // Chi tiết giao dịch
      csv = 'ID,Ngày,Mô tả,Danh mục,Loại,Số tiền,Tài khoản,Ghi chú\n';
      reportData.transactions.forEach(t => {
        const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
        csv += `${t.id},"${t.date}","${t.description}","${t.category}","${t.type}",${t.amount},"${t.wallet}",${note}\n`;
      });
    } else if (reportType === 'budget' && budgets) {
      // Báo cáo ngân sách
      csv = 'Danh mục,Ngân sách,Đã chi,Còn lại,Tỷ lệ\n';
      budgets.forEach(b => {
        const remaining = b.amount - b.spent;
        const percentage = ((b.spent / b.amount) * 100).toFixed(1);
        csv += `"${b.category}",${b.amount},${b.spent},${remaining},${percentage}%\n`;
      });
    } else if (reportType === 'habits' && habits) {
      // Báo cáo thói quen
      csv = 'Tên Thói quen,Tỷ lệ Hoàn thành,Tổng Check-ins,Chuỗi Dài nhất\n';
      habits.forEach(h => {
        csv += `"${h.name}",${h.completionRate}%,${h.totalCheckIns},${h.longestStreak}\n`;
      });
    } else if (reportType === 'goals' && goals) {
      // Báo cáo mục tiêu
      csv = 'Tên Mục tiêu,Mục tiêu (đ),Đã tiết kiệm,Còn lại,Thời hạn\n';
      goals.forEach(g => {
        const remaining = g.targetAmount - g.amountSaved;
        csv += `"${g.name}",${g.targetAmount},${g.amountSaved},${remaining},"${g.targetDate}"\n`;
      });
    } else {
      // Tóm tắt (summary)
      csv = 'Báo cáo Tài chính\n';
      csv += `Khoảng thời gian,"${periodLabel}"\n\n`;
      csv += 'TÓM TẮT\n';
      csv += `Tổng Thu nhập,${reportData.totalIncome}\n`;
      csv += `Tổng Chi tiêu,${reportData.totalExpense}\n`;
      csv += `Dòng tiền ròng,${reportData.balance}\n\n`;
      csv += 'CHI TIÊU THEO DANH MỤC\n';
      csv += 'Danh mục,Số tiền,Tỷ lệ\n';
      Object.entries(reportData.categoryBreakdown).forEach(([cat, amount]) => {
        const percentage =
          reportData.totalExpense > 0 ? ((amount / reportData.totalExpense) * 100).toFixed(1) : 0;
        csv += `"${cat}",${amount},${percentage}%\n`;
      });
    }

    return csv;
  }

  /**
   * Tạo báo cáo JSON
   */
  generateJSON(
    reportType: ReportType,
    reportData: ReportData,
    budgets?: Budget[],
    habits?: Habit[],
    goals?: Goal[],
    periodLabel?: string
  ): string {
    const baseData: any = {
      period: periodLabel,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Assist AI',
    };

    let report: any = { ...baseData };

    if (reportType === 'detailed') {
      report = {
        ...report,
        type: 'Báo cáo Chi tiết Giao dịch',
        transactions: reportData.transactions,
        summary: {
          totalIncome: reportData.totalIncome,
          totalExpense: reportData.totalExpense,
          balance: reportData.balance,
          totalTransactions: reportData.transactions.length,
        },
      };
    } else if (reportType === 'budget') {
      report = {
        ...report,
        type: 'Báo cáo Ngân sách',
        budgets: budgets?.map(b => ({
          ...b,
          remaining: b.amount - b.spent,
          percentage: ((b.spent / b.amount) * 100).toFixed(1),
        })),
      };
    } else if (reportType === 'habits') {
      report = {
        ...report,
        type: 'Báo cáo Thói quen',
        habits,
      };
    } else if (reportType === 'goals') {
      report = {
        ...report,
        type: 'Báo cáo Mục tiêu',
        goals: goals?.map(g => ({
          ...g,
          remaining: g.targetAmount - g.amountSaved,
          progress: ((g.amountSaved / g.targetAmount) * 100).toFixed(1),
        })),
      };
    } else {
      report = {
        ...report,
        type: 'Báo cáo Tổng quan',
        summary: {
          totalIncome: reportData.totalIncome,
          totalExpense: reportData.totalExpense,
          balance: reportData.balance,
          transactionCount: reportData.transactions.length,
        },
        categoryBreakdown: Object.entries(reportData.categoryBreakdown).map(([category, amount]) => ({
          category,
          amount,
          percentage:
            reportData.totalExpense > 0 ? ((amount / reportData.totalExpense) * 100).toFixed(1) : 0,
        })),
        incomeByCategory: reportData.transactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>),
      };
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Tạo báo cáo HTML
   */
  generateHTML(
    reportType: ReportType,
    reportData: ReportData,
    budgets?: Budget[],
    habits?: Habit[],
    goals?: Goal[],
    periodLabel?: string
  ): string {
    const styles = this.getHTMLStyles();

    let content = '';

    if (reportType === 'detailed') {
      content = this.getDetailedReportHTML(reportData, periodLabel);
    } else if (reportType === 'budget') {
      content = this.getBudgetReportHTML(budgets, periodLabel);
    } else if (reportType === 'habits') {
      content = this.getHabitsReportHTML(habits, periodLabel);
    } else if (reportType === 'goals') {
      content = this.getGoalsReportHTML(goals, periodLabel);
    } else {
      content = this.getSummaryReportHTML(reportData, periodLabel);
    }

    return `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${styles}
        </head>
        <body>
          ${content}
          ${this.getHTMLFooter()}
        </body>
      </html>
    `;
  }

  /**
   * Lấy CSS styles cho HTML
   */
  private getHTMLStyles(): string {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 20px; 
          color: #333; 
          line-height: 1.6;
        }
        h1 { 
          color: #6366F1; 
          border-bottom: 3px solid #6366F1; 
          padding-bottom: 10px; 
          margin-bottom: 10px;
        }
        h2 { 
          color: #6366F1; 
          margin-top: 25px; 
          margin-bottom: 15px;
          font-size: 18px;
        }
        p { margin-bottom: 10px; color: #666; }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th { 
          background-color: #6366F1; 
          color: white; 
          padding: 12px; 
          text-align: left;
          font-weight: 600;
        }
        td { 
          padding: 10px 12px; 
          border-bottom: 1px solid #ddd; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f0f0f0; }
        
        .summary-card { 
          display: inline-block; 
          width: calc(33.333% - 15px); 
          margin: 10px; 
          padding: 20px; 
          background: linear-gradient(135deg, #6366F1 0%, #8b5cf6 100%);
          border-radius: 8px;
          color: white;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .summary-label { 
          font-size: 13px; 
          opacity: 0.9;
          margin-bottom: 8px;
        }
        .summary-amount { 
          font-size: 28px; 
          font-weight: bold;
          word-break: break-word;
        }
        
        .income { color: #10B981; font-weight: 600; }
        .expense { color: #EF4444; font-weight: 600; }
        .neutral { color: #6366F1; font-weight: 600; }
        
        .info-box { 
          background-color: #f0f9ff; 
          border-left: 4px solid #6366F1; 
          padding: 12px 15px; 
          margin: 15px 0;
          border-radius: 4px;
        }
        .info-box strong { color: #6366F1; }
        
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #ddd; 
          font-size: 12px; 
          color: #999;
          text-align: center;
        }
        
        @media print {
          body { margin: 0; }
          .summary-card { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    `;
  }

  /**
   * HTML cho báo cáo tổng quan
   */
  private getSummaryReportHTML(reportData: ReportData, periodLabel?: string): string {
    return `
      <h1>📊 Báo cáo Tài chính Tổng quan</h1>
      <div class="info-box">
        <strong>Khoảng thời gian:</strong> ${periodLabel || 'N/A'}<br>
        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}
      </div>
      
      <h2>Tóm tắt Tài chính</h2>
      <div class="summary-card">
        <div class="summary-label">Tổng Thu nhập</div>
        <div class="summary-amount income">${this.formatCurrency(reportData.totalIncome)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Tổng Chi tiêu</div>
        <div class="summary-amount expense">${this.formatCurrency(reportData.totalExpense)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Dòng tiền ròng</div>
        <div class="summary-amount neutral">${this.formatCurrency(reportData.balance)}</div>
      </div>
      
      <h2>Chi tiêu theo Danh mục</h2>
      <table>
        <thead>
          <tr>
            <th>Danh mục</th>
            <th>Số tiền</th>
            <th>Tỷ lệ (%)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(reportData.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => {
              const percentage =
                reportData.totalExpense > 0 ? ((amount / reportData.totalExpense) * 100).toFixed(1) : 0;
              return `
                <tr>
                  <td><strong>${cat}</strong></td>
                  <td class="expense">${this.formatCurrency(amount)}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * HTML cho báo cáo chi tiết giao dịch
   */
  private getDetailedReportHTML(reportData: ReportData, periodLabel?: string): string {
    return `
      <h1>📝 Báo cáo Chi tiết Giao dịch</h1>
      <div class="info-box">
        <strong>Khoảng thời gian:</strong> ${periodLabel || 'N/A'}<br>
        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}<br>
        <strong>Tổng giao dịch:</strong> ${reportData.transactions.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Mô tả</th>
            <th>Danh mục</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Tài khoản</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td>${t.type === 'income' ? '✓ Thu nhập' : '✗ Chi tiêu'}</td>
                <td class="${t.type === 'income' ? 'income' : 'expense'}">
                  ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                </td>
                <td>${t.wallet}</td>
              </tr>
            `)
            .join('')}
        </tbody>
      </table>
      
      <h2>Tóm tắt</h2>
      <div class="summary-card">
        <div class="summary-label">Thu nhập</div>
        <div class="summary-amount income">${this.formatCurrency(reportData.totalIncome)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Chi tiêu</div>
        <div class="summary-amount expense">${this.formatCurrency(reportData.totalExpense)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Dòng tiền</div>
        <div class="summary-amount neutral">${this.formatCurrency(reportData.balance)}</div>
      </div>
    `;
  }

  /**
   * HTML cho báo cáo ngân sách
   */
  private getBudgetReportHTML(budgets?: Budget[], periodLabel?: string): string {
    if (!budgets || budgets.length === 0) {
      return '<p>Không có dữ liệu ngân sách</p>';
    }

    return `
      <h1>💰 Báo cáo Ngân sách</h1>
      <div class="info-box">
        <strong>Khoảng thời gian:</strong> ${periodLabel || 'N/A'}<br>
        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Danh mục</th>
            <th>Ngân sách</th>
            <th>Đã chi</th>
            <th>Còn lại</th>
            <th>Tỷ lệ</th>
          </tr>
        </thead>
        <tbody>
          ${budgets
            .map(b => {
              const remaining = b.amount - b.spent;
              const percentage = ((b.spent / b.amount) * 100).toFixed(1);
              const isOverspent = remaining < 0;
              return `
                <tr>
                  <td><strong>${b.category}</strong></td>
                  <td>${this.formatCurrency(b.amount)}</td>
                  <td class="expense">${this.formatCurrency(b.spent)}</td>
                  <td class="${isOverspent ? 'expense' : 'income'}">
                    ${isOverspent ? '✗ Vượt ' : '✓ Còn '}${this.formatCurrency(Math.abs(remaining))}
                  </td>
                  <td>${percentage}%</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * HTML cho báo cáo thói quen
   */
  private getHabitsReportHTML(habits?: Habit[], periodLabel?: string): string {
    if (!habits || habits.length === 0) {
      return '<p>Không có dữ liệu thói quen</p>';
    }

    return `
      <h1>🎯 Báo cáo Thói quen</h1>
      <div class="info-box">
        <strong>Khoảng thời gian:</strong> ${periodLabel || 'N/A'}<br>
        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Tên Thói quen</th>
            <th>Tỷ lệ Hoàn thành</th>
            <th>Tổng Check-ins</th>
            <th>Chuỗi Dài nhất</th>
          </tr>
        </thead>
        <tbody>
          ${habits
            .sort((a, b) => b.completionRate - a.completionRate)
            .map(h => `
              <tr>
                <td><strong>${h.name}</strong></td>
                <td class="income">${h.completionRate}%</td>
                <td>${h.totalCheckIns}</td>
                <td>${h.longestStreak} ngày</td>
              </tr>
            `)
            .join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * HTML cho báo cáo mục tiêu
   */
  private getGoalsReportHTML(goals?: Goal[], periodLabel?: string): string {
    if (!goals || goals.length === 0) {
      return '<p>Không có dữ liệu mục tiêu</p>';
    }

    return `
      <h1>🚀 Báo cáo Mục tiêu Tài chính</h1>
      <div class="info-box">
        <strong>Khoảng thời gian:</strong> ${periodLabel || 'N/A'}<br>
        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Tên Mục tiêu</th>
            <th>Mục tiêu</th>
            <th>Đã tiết kiệm</th>
            <th>Còn lại</th>
            <th>Tiến độ</th>
            <th>Thời hạn</th>
          </tr>
        </thead>
        <tbody>
          ${goals
            .sort((a, b) => (b.amountSaved / b.targetAmount) - (a.amountSaved / a.targetAmount))
            .map(g => {
              const remaining = g.targetAmount - g.amountSaved;
              const progress = ((g.amountSaved / g.targetAmount) * 100).toFixed(1);
              return `
                <tr>
                  <td><strong>${g.name}</strong></td>
                  <td>${this.formatCurrency(g.targetAmount)}</td>
                  <td class="income">${this.formatCurrency(g.amountSaved)}</td>
                  <td>${this.formatCurrency(remaining)}</td>
                  <td class="neutral">${progress}%</td>
                  <td>${g.targetDate}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Footer HTML
   */
  private getHTMLFooter(): string {
    return `
      <div class="footer">
        <p>Báo cáo này được tạo tự động bởi <strong>Assist AI</strong></p>
        <p>© 2025 - Assist Finance Management System</p>
        <p>Vui lòng liên hệ hỗ trợ nếu có bất kỳ câu hỏi nào</p>
      </div>
    `;
  }
}

// Export singleton instance
export default new ReportExportService();
