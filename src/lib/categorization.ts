// Transaction categorization engine
// Enhanced with ML-ready structure and confidence scoring

interface Transaction {
  id?: string;
  description: string;
  amount: number;
  date: string;
  merchantName?: string;
  category?: string;
  type?: "income" | "expense";
}

interface CategoryRule {
  category: string;
  keywords: string[];
  merchantPatterns?: RegExp[];
  icon?: string;
  weight?: number; // For weighted scoring
}

interface CategorizationResult extends Transaction {
  confidence: number; // 0-1 score
  alternativeCategories?: Array<{ category: string; confidence: number }>;
  reason?: string; // Why this category was chosen
}

// Enhanced rule-based categorization rules with more keywords
const categoryRules: CategoryRule[] = [
  {
    category: "Food & Dining",
    keywords: [
      "swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "food", "dining",
      "mcdonald", "pizza", "burger", "domino", "kfc", "subway", "dunkin", "baskin",
      "barbeque", "biryani", "haldiram", "breakfast", "lunch", "dinner", "foodpanda",
      "ubereats", "grubhub", "deliveroo", "takeaway", "dine", "bistro", "eatery"
    ],
    weight: 1.0,
  },
  {
    category: "Transport",
    keywords: [
      "uber", "ola", "rapido", "taxi", "metro", "bus", "petrol", "fuel", "parking",
      "toll", "auto", "rickshaw", "lyft", "cab", "transport", "commute", "travel",
      "railway", "train", "flight", "airline", "indigo", "spicejet", "goair",
      "vistara", "airasia", "booking", "makemytrip", "yatra", "cleartrip"
    ],
    weight: 1.0,
  },
  {
    category: "Groceries",
    keywords: [
      "dmart", "bigbasket", "grocery", "supermarket", "reliance fresh", "more",
      "fresh", "vegetables", "fruits", "walmart", "target", "whole foods",
      "trader joe", "costco", "safeway", "kroger", "blinkit", "zepto", "dunzo",
      "grofers", "jiomart", "amazon fresh", "market", "provisions"
    ],
    weight: 1.0,
  },
  {
    category: "Entertainment",
    keywords: [
      "netflix", "prime video", "hotstar", "disney", "spotify", "youtube",
      "movie", "cinema", "theatre", "game", "subscription", "amazon prime",
      "hulu", "hbo", "apple tv", "paramount", "peacock", "discovery",
      "xbox", "playstation", "nintendo", "steam", "epic games", "concert",
      "show", "event", "ticket", "bookmyshow", "paytm insider"
    ],
    weight: 1.0,
  },
  {
    category: "Shopping",
    keywords: [
      "amazon", "flipkart", "myntra", "ajio", "shopping", "mall", "store",
      "clothes", "fashion", "ebay", "etsy", "target", "walmart", "nike",
      "adidas", "h&m", "zara", "uniqlo", "levi", "puma", "reebok",
      "meesho", "snapdeal", "paytm mall", "shopclues", "tata cliq"
    ],
    weight: 1.0,
  },
  {
    category: "Bills & Utilities",
    keywords: [
      "electricity", "water", "gas", "internet", "broadband", "mobile",
      "recharge", "bill", "utility", "rent", "jio", "airtel", "vodafone",
      "bsnl", "tata", "reliance", "payment", "insurance", "premium",
      "phone bill", "wifi", "cable", "dish", "dth", "tatasky", "paytm bill"
    ],
    weight: 1.0,
  },
  {
    category: "Healthcare",
    keywords: [
      "pharmacy", "hospital", "clinic", "doctor", "medical", "health",
      "medicine", "apollo", "practo", "max", "fortis", "medanta",
      "diagnostic", "lab", "test", "prescription", "dentist", "therapy",
      "wellness", "fitness", "gym", "yoga", "1mg", "pharmeasy", "netmeds"
    ],
    weight: 1.0,
  },
  {
    category: "Education",
    keywords: [
      "school", "college", "university", "course", "tuition", "coaching",
      "udemy", "coursera", "skillshare", "linkedin learning", "masterclass",
      "byju", "unacademy", "vedantu", "toppr", "book", "library", "education",
      "training", "workshop", "seminar", "textbook", "study material"
    ],
    weight: 1.0,
  },
  {
    category: "Personal Care",
    keywords: [
      "salon", "spa", "haircut", "beauty", "cosmetics", "skincare",
      "nykaa", "purplle", "lakme", "loreal", "maybelline", "barber",
      "massage", "facial", "manicure", "pedicure", "grooming"
    ],
    weight: 1.0,
  },
  {
    category: "Investments & Savings",
    keywords: [
      "mutual fund", "sip", "stock", "equity", "investment", "zerodha",
      "groww", "upstox", "angelone", "edelweiss", "hdfc securities",
      "icici direct", "gold", "bond", "fd", "fixed deposit", "ppf",
      "nps", "insurance premium", "lic"
    ],
    weight: 1.0,
  },
  {
    category: "Income",
    keywords: [
      "salary", "payment received", "freelance", "project", "income",
      "credit", "deposit", "transfer from", "refund", "cashback",
      "bonus", "commission", "wages", "earnings", "revenue", "payout"
    ],
    weight: 1.5, // Higher weight for income
  },
];

// Enhanced categorization with confidence scoring
export function categorizeTransaction(transaction: Transaction): CategorizationResult {
  const description = (transaction.description || "").toLowerCase();
  const merchantName = (transaction.merchantName || "").toLowerCase();
  const searchText = `${description} ${merchantName}`;
  const amount = transaction.amount;

  // Check if it's income based on amount
  if (amount > 0) {
    const incomeRule = categoryRules.find((rule) => rule.category === "Income");
    const matchingKeywords = incomeRule?.keywords.filter((keyword) =>
      searchText.includes(keyword.toLowerCase())
    ) || [];

    const confidence = amount > 1000 || matchingKeywords.length > 0 ? 0.9 : 0.7;

    return {
      ...transaction,
      category: "Income",
      type: "income",
      confidence,
      reason: matchingKeywords.length > 0 
        ? `Matched keywords: ${matchingKeywords.slice(0, 2).join(', ')}`
        : "Amount indicates income",
    };
  }

  // Score each category based on keyword matches
  const categoryScores: Array<{ category: string; score: number; matches: string[] }> = [];

  for (const rule of categoryRules) {
    const matchingKeywords = rule.keywords.filter((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );

    if (matchingKeywords.length > 0) {
      // Calculate score based on number of matches and rule weight
      const score = matchingKeywords.length * (rule.weight || 1.0);
      categoryScores.push({
        category: rule.category,
        score,
        matches: matchingKeywords,
      });
    }
  }

  // Sort by score
  categoryScores.sort((a, b) => b.score - a.score);

  // If we have matches, return the best match with alternatives
  if (categoryScores.length > 0) {
    const bestMatch = categoryScores[0];
    const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
    const confidence = Math.min(0.95, bestMatch.score / totalScore);

    // Get alternative categories (top 3)
    const alternatives = categoryScores.slice(1, 4).map((cs) => ({
      category: cs.category,
      confidence: Math.min(0.9, cs.score / totalScore),
    }));

    return {
      ...transaction,
      category: bestMatch.category,
      type: amount < 0 ? "expense" : "income",
      confidence,
      alternativeCategories: alternatives.length > 0 ? alternatives : undefined,
      reason: `Matched keywords: ${bestMatch.matches.slice(0, 2).join(', ')}`,
    };
  }

  // Default category with low confidence
  return {
    ...transaction,
    category: "Others",
    type: amount < 0 ? "expense" : "income",
    confidence: 0.3,
    reason: "No clear category match found",
  };
}

export function categorizeTransactions(
  transactions: Transaction[]
): CategorizationResult[] {
  return transactions.map((transaction) => categorizeTransaction(transaction));
}

// Machine learning ready: Learn from user corrections
export function learnFromCorrection(
  transaction: Transaction,
  correctCategory: string
): CategoryRule | null {
  // Extract key terms from the transaction
  const description = (transaction.description || "").toLowerCase();
  const merchantName = (transaction.merchantName || "").toLowerCase();
  
  // In a real ML system, this would update the model
  // For now, we can suggest new keywords to add
  const newKeywords = [
    merchantName,
    ...description.split(' ').filter(word => word.length > 3)
  ].filter(Boolean);

  return {
    category: correctCategory,
    keywords: newKeywords,
    weight: 1.2, // Slightly higher weight for learned rules
  };
}

// Get spending insights with enhanced analytics
export function getSpendingByCategory(
  transactions: Transaction[]
): Record<string, number> {
  const categoryTotals: Record<string, number> = {};

  transactions.forEach((transaction) => {
    if (transaction.type === "expense" && transaction.category) {
      const category = transaction.category;
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Math.abs(transaction.amount);
    }
  });

  return categoryTotals;
}

export function getTopSpendingCategory(
  transactions: Transaction[]
): { category: string; amount: number } | null {
  const categoryTotals = getSpendingByCategory(transactions);
  const entries = Object.entries(categoryTotals);

  if (entries.length === 0) {
    return null;
  }

  const [category, amount] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  );

  return { category, amount };
}

export function getCategoryPercentages(
  transactions: Transaction[]
): Array<{ category: string; amount: number; percentage: number }> {
  const categoryTotals = getSpendingByCategory(transactions);
  const total = Object.values(categoryTotals).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Enhanced analytics: Detect spending anomalies
export function detectSpendingAnomalies(
  transactions: Transaction[],
  lookbackDays: number = 30
): Array<{ transaction: Transaction; reason: string; severity: "low" | "medium" | "high" }> {
  const anomalies: Array<{ transaction: Transaction; reason: string; severity: "low" | "medium" | "high" }> = [];
  
  // Calculate average spending by category
  const categoryAverages: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  
  transactions
    .filter(t => t.amount < 0 && t.category)
    .forEach(t => {
      const cat = t.category!;
      categoryAverages[cat] = (categoryAverages[cat] || 0) + Math.abs(t.amount);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  
  Object.keys(categoryAverages).forEach(cat => {
    categoryAverages[cat] = categoryAverages[cat] / categoryCounts[cat];
  });
  
  // Check for anomalies (transactions > 2x average)
  transactions
    .filter(t => t.amount < 0 && t.category)
    .forEach(t => {
      const cat = t.category!;
      const avg = categoryAverages[cat];
      const amount = Math.abs(t.amount);
      
      if (amount > avg * 3) {
        anomalies.push({
          transaction: t,
          reason: `${cat} spending is 3x higher than average (₹${Math.round(avg)})`,
          severity: "high"
        });
      } else if (amount > avg * 2) {
        anomalies.push({
          transaction: t,
          reason: `${cat} spending is 2x higher than average (₹${Math.round(avg)})`,
          severity: "medium"
        });
      }
    });
  
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}