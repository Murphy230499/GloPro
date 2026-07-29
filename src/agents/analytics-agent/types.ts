export interface IRevenueAnalysis {
  timeframe: string;
  totalRevenue: number;
  serviceRevenue: number;
  productSalesRevenue: number;
  growthPercentage: number;
}

export interface IProfitAnalysis {
  timeframe: string;
  grossRevenue: number;
  cogsMaterialCost: number;
  laborPayrollExpense: number;
  overheadExpenses: number;
  netProfit: number;
  grossProfitMarginPercentage: number;
  netProfitMarginPercentage: number;
}

export interface IEmployeeAnalysis {
  topPerformers: Array<{ staffName: string; revenue: number; servicesCount: number; rating: number }>;
  averageRevenuePerStaff: number;
}

export interface ICustomerAnalysis {
  totalActiveCustomers: number;
  averageLTV: number; // Lifetime Value
  retentionRatePercentage: number;
  churnRatePercentage: number;
}

export interface IServiceAnalysis {
  topServices: Array<{ serviceName: string; count: number; totalRevenue: number; profitMargin: number }>;
  slowMovingServices: string[];
}

export interface IBusinessInsight {
  type: 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  actionableStep: string;
}

export interface IForecastData {
  timeframe: string; // e.g. "next_month"
  predictedRevenue: number;
  confidenceScore: number; // percentage
  predictedCustomerCount: number;
}

export interface ITrendData {
  trendingServices: string[];
  peakHours: string[];
  peakDays: string[];
  seasonalDemandAlert: string;
}

// Tool Inputs
export interface IAnalyzeRevenueInput {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface IAnalyzeProfitInput {
  timeframe?: 'month' | 'quarter' | 'year';
}

export interface IAnalyzeEmployeePerformanceInput {
  timeframe?: 'month' | 'quarter' | 'year';
}

export interface IAnalyzeCustomerMetricsInput {
  timeframe?: 'month' | 'quarter' | 'year';
}

export interface IAnalyzeServicePerformanceInput {
  timeframe?: 'month' | 'quarter' | 'year';
}

export interface IGenerateBusinessInsightsInput {
  category?: 'all' | 'finance' | 'operations' | 'marketing';
}

export interface IForecastRevenueInput {
  targetMonthsAhead?: number;
}

export interface IDetectTrendsInput {
  timeframe?: 'month' | 'quarter' | 'year';
}
