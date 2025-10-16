// Cash flow prediction and analysis
// Enhanced with exponential smoothing, trend detection, and seasonality analysis

interface Transaction {
  amount: number;
  date: string;
  type?: "income" | "expense";
  category?: string;
  description?: string;
}

interface CashFlowProjection {
  projectedBalance: number;
  daysUntilLow: number;
  projectionByDay: Array<{ day: number; date: string; balance: number; income: number; expenses: number }>;
  averageIncome: number;
  averageExpenses: number;
  netDailyFlow: number;
  confidence: "high" | "medium" | "low";
  trend: "improving" | "stable" | "declining";
  recurringExpenses: Array<{ description: string; amount: number; nextDueDate: string }>;
  upcomingIncome?: { amount: number; date: string; confidence: number };
}

interface DailyFlow {
  date: string;
  income: number;
  expenses: number;
  netFlow: number;
}

export function calculateDailyFlows(
  transactions: Transaction[]
): DailyFlow[] {
  const dailyFlowMap: Record<string, DailyFlow> = {};

  transactions.forEach((transaction) => {
    const date = transaction.date;

    if (!dailyFlowMap[date]) {
      dailyFlowMap[date] = {
        date,
        income: 0,
        expenses: 0,
        netFlow: 0,
      };
    }

    if (transaction.amount > 0) {
      dailyFlowMap[date].income += transaction.amount;
    } else {
      dailyFlowMap[date].expenses += Math.abs(transaction.amount);
    }

    dailyFlowMap[date].netFlow =
      dailyFlowMap[date].income - dailyFlowMap[date].expenses;
  });

  return Object.values(dailyFlowMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number {
  if (values.length === 0) return 0;

  const relevantValues = values.slice(-windowSize);
  const sum = relevantValues.reduce((acc, val) => acc + val, 0);
  return sum / relevantValues.length;
}

// Enhanced: Exponential Moving Average for trend detection
export function calculateExponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  
  const ema: number[] = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    ema.push(alpha * values[i] + (1 - alpha) * ema[i - 1]);
  }
  
  return ema;
}

// Enhanced: Detect trend in cash flow
function detectTrend(values: number[]): "improving" | "stable" | "declining" {
  if (values.length < 5) return "stable";
  
  // Use linear regression to detect trend
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = values;
  
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Determine trend based on slope
  if (slope > 50) return "improving";
  if (slope < -50) return "declining";
  return "stable";
}

// Enhanced: Seasonal pattern detection
function detectSeasonality(dailyFlows: DailyFlow[]): { hasPattern: boolean; pattern: string } {
  if (dailyFlows.length < 28) {
    return { hasPattern: false, pattern: "none" };
  }
  
  // Check for weekly patterns (day of week spending)
  const dayOfWeekSpending: Record<number, number[]> = {};
  
  dailyFlows.forEach(flow => {
    const dayOfWeek = new Date(flow.date).getDay();
    if (!dayOfWeekSpending[dayOfWeek]) {
      dayOfWeekSpending[dayOfWeek] = [];
    }
    dayOfWeekSpending[dayOfWeek].push(flow.expenses);
  });
  
  // Calculate variance across days
  const avgByDay = Object.values(dayOfWeekSpending).map(expenses => 
    expenses.reduce((sum, e) => sum + e, 0) / expenses.length
  );
  
  const variance = calculateVariance(avgByDay);
  
  // High variance indicates seasonal pattern
  if (variance > 1000) {
    return { hasPattern: true, pattern: "weekly" };
  }
  
  return { hasPattern: false, pattern: "none" };
}

export function calculateCashFlowProjection(
  transactions: Transaction[],
  projectionDays: number = 7,
  currentBalance: number = 12450
): CashFlowProjection {
  // Calculate daily flows from transactions
  const dailyFlows = calculateDailyFlows(transactions);

  // Calculate average income and expenses (using last 21 days for better accuracy)
  const recentFlows = dailyFlows.slice(-21);

  const totalIncome = recentFlows.reduce((sum, flow) => sum + flow.income, 0);
  const totalExpenses = recentFlows.reduce(
    (sum, flow) => sum + flow.expenses,
    0
  );

  const averageIncome = totalIncome / recentFlows.length;
  const averageExpenses = totalExpenses / recentFlows.length;
  
  // Use exponential moving average for better trend detection
  const netFlows = recentFlows.map(f => f.netFlow);
  const emaValues = calculateExponentialMovingAverage(netFlows, 0.3);
  const netDailyFlow = emaValues[emaValues.length - 1] || (averageIncome - averageExpenses);
  
  // Detect trend
  const trend = detectTrend(netFlows);
  
  // Detect seasonality
  const seasonality = detectSeasonality(dailyFlows);
  
  // Detect recurring expenses
  const recurringExpenses = detectRecurringExpenses(transactions);
  
  // Predict next income
  const upcomingIncome = predictIncomeDate(transactions);

  // Project future balance with enhanced accuracy
  const projectionByDay: Array<{ day: number; date: string; balance: number; income: number; expenses: number }> = [];

  let projectedBalance = currentBalance;
  let daysUntilLow = projectionDays + 1;

  for (let day = 1; day <= projectionDays; day++) {
    const projectionDate = new Date();
    projectionDate.setDate(projectionDate.getDate() + day);
    const dayOfWeek = projectionDate.getDay();
    
    // Apply seasonality if detected
    let dailyIncome = averageIncome;
    let dailyExpenses = averageExpenses;
    
    if (seasonality.hasPattern && seasonality.pattern === "weekly") {
      // Adjust based on day of week patterns
      const daySpending = recentFlows
        .filter(f => new Date(f.date).getDay() === dayOfWeek)
        .map(f => f.expenses);
      
      if (daySpending.length > 0) {
        dailyExpenses = daySpending.reduce((sum, e) => sum + e, 0) / daySpending.length;
      }
    }
    
    // Check for upcoming recurring expenses
    const upcomingRecurring = recurringExpenses.find(re => {
      const dueDate = new Date(re.nextDueDate);
      const projDate = projectionDate;
      return dueDate.toDateString() === projDate.toDateString();
    });
    
    if (upcomingRecurring) {
      dailyExpenses += upcomingRecurring.amount;
    }
    
    // Check for upcoming income
    if (upcomingIncome && upcomingIncome.nextIncomeDate) {
      const incomeDate = new Date(upcomingIncome.nextIncomeDate);
      if (incomeDate.toDateString() === projectionDate.toDateString()) {
        dailyIncome += transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.amount > 0).length;
      }
    }
    
    // Apply trend adjustment
    let trendAdjustment = 0;
    if (trend === "improving") {
      trendAdjustment = day * 10; // Gradual improvement
    } else if (trend === "declining") {
      trendAdjustment = -day * 10; // Gradual decline
    }
    
    projectedBalance += (dailyIncome - dailyExpenses + trendAdjustment);

    projectionByDay.push({
      day,
      date: projectionDate.toISOString().split("T")[0],
      balance: Math.round(projectedBalance),
      income: Math.round(dailyIncome),
      expenses: Math.round(dailyExpenses),
    });

    // Check if balance goes below threshold (₹5000 default)
    if (projectedBalance < 5000 && daysUntilLow > projectionDays) {
      daysUntilLow = day;
    }
  }

  // Determine confidence level based on data consistency and variance
  const flowVariance = calculateVariance(netFlows);
  const dataPoints = recentFlows.length;
  
  let confidence: "high" | "medium" | "low";
  if (dataPoints >= 21 && flowVariance < 1000) {
    confidence = "high";
  } else if (dataPoints >= 14 && flowVariance < 3000) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    projectedBalance: Math.round(projectedBalance),
    daysUntilLow: daysUntilLow <= projectionDays ? daysUntilLow : -1,
    projectionByDay,
    averageIncome: Math.round(averageIncome),
    averageExpenses: Math.round(averageExpenses),
    netDailyFlow: Math.round(netDailyFlow),
    confidence,
    trend,
    recurringExpenses: recurringExpenses.slice(0, 5), // Top 5
    upcomingIncome: upcomingIncome.confidence > 0.5 ? {
      amount: Math.round(transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.amount > 0).length),
      date: upcomingIncome.nextIncomeDate,
      confidence: upcomingIncome.confidence
    } : undefined,
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return variance;
}

export function predictIncomeDate(
  transactions: Transaction[],
  averageIncomeCycle: number = 7
): { nextIncomeDate: string; confidence: number } {
  // Find income transactions
  const incomeTransactions = transactions
    .filter((t) => t.amount > 0)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  if (incomeTransactions.length < 2) {
    // Not enough data
    const today = new Date();
    today.setDate(today.getDate() + averageIncomeCycle);
    return {
      nextIncomeDate: today.toISOString().split("T")[0],
      confidence: 0.3,
    };
  }

  // Calculate average days between income
  const intervals: number[] = [];
  for (let i = 0; i < incomeTransactions.length - 1; i++) {
    const date1 = new Date(incomeTransactions[i].date);
    const date2 = new Date(incomeTransactions[i + 1].date);
    const daysDiff = Math.abs(
      (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    );
    intervals.push(daysDiff);
  }

  const avgInterval =
    intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = calculateVariance(intervals);

  // Calculate next expected income date
  const lastIncomeDate = new Date(incomeTransactions[0].date);
  const nextDate = new Date(lastIncomeDate);
  nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

  // Confidence based on variance (lower variance = higher confidence)
  const confidence = Math.max(0.5, Math.min(0.95, 1 - variance / 10000));

  return {
    nextIncomeDate: nextDate.toISOString().split("T")[0],
    confidence: Math.round(confidence * 100) / 100,
  };
}

export function detectRecurringExpenses(
  transactions: Transaction[]
): Array<{
  description: string;
  amount: number;
  frequency: number;
  nextDueDate: string;
  category?: string;
}> {
  // Group similar transactions by description and category
  const expenseGroups: Record<
    string,
    Array<{ amount: number; date: string; category?: string }>
  > = {};

  transactions
    .filter((t) => t.amount < 0)
    .forEach((transaction) => {
      // Create a composite key with description and category for better grouping
      const key = `${transaction.description?.toLowerCase() || "unknown"}_${transaction.category || ""}`;
      if (!expenseGroups[key]) {
        expenseGroups[key] = [];
      }
      expenseGroups[key].push({
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        category: transaction.category,
      });
    });

  // Find recurring patterns
  const recurring: Array<{
    description: string;
    amount: number;
    frequency: number;
    nextDueDate: string;
    category?: string;
  }> = [];

  Object.entries(expenseGroups).forEach(([key, occurrences]) => {
    if (occurrences.length >= 2) {
      // Calculate frequency
      const sortedOccurrences = occurrences.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const intervals: number[] = [];
      for (let i = 0; i < sortedOccurrences.length - 1; i++) {
        const date1 = new Date(sortedOccurrences[i].date);
        const date2 = new Date(sortedOccurrences[i + 1].date);
        const daysDiff = Math.abs(
          (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }

      const avgFrequency = Math.round(
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      );
      const variance = calculateVariance(intervals);

      // If frequency is consistent (monthly ~30 days, bi-weekly ~14 days, or weekly ~7 days)
      // and variance is low
      if (
        ((avgFrequency >= 25 && avgFrequency <= 35) ||
         (avgFrequency >= 12 && avgFrequency <= 16) ||
         (avgFrequency >= 5 && avgFrequency <= 9)) &&
        variance < avgFrequency * 5 // Low variance relative to frequency
      ) {
        const lastDate = new Date(sortedOccurrences[0].date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + avgFrequency);

        const avgAmount = Math.round(
          occurrences.reduce((sum, o) => sum + o.amount, 0) /
            occurrences.length
        );

        const [description] = key.split('_');

        recurring.push({
          description,
          amount: avgAmount,
          frequency: avgFrequency,
          nextDueDate: nextDate.toISOString().split("T")[0],
          category: occurrences[0].category,
        });
      }
    }
  });

  // Sort by next due date
  return recurring.sort((a, b) => 
    new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
  );
}

// Enhanced: Spending velocity analysis
export function analyzeSpendingVelocity(
  transactions: Transaction[],
  windowDays: number = 7
): { velocity: number; trend: "increasing" | "stable" | "decreasing"; risk: "low" | "medium" | "high" } {
  const now = new Date();
  const recentTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= windowDays && t.amount < 0;
  });
  
  const totalSpent = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const velocity = totalSpent / windowDays; // Daily burn rate
  
  // Compare with previous period
  const previousTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > windowDays && daysDiff <= windowDays * 2 && t.amount < 0;
  });
  
  const previousSpent = previousTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const previousVelocity = previousSpent / windowDays;
  
  let trend: "increasing" | "stable" | "decreasing";
  if (velocity > previousVelocity * 1.2) trend = "increasing";
  else if (velocity < previousVelocity * 0.8) trend = "decreasing";
  else trend = "stable";
  
  // Determine risk level
  let risk: "low" | "medium" | "high";
  if (trend === "increasing" && velocity > 1000) risk = "high";
  else if (trend === "increasing" || velocity > 800) risk = "medium";
  else risk = "low";
  
  return { velocity: Math.round(velocity), trend, risk };
}