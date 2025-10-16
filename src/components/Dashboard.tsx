"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Smartphone,
  Heart,
  Utensils,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Sample data for demo
const mockTransactions = [
  { id: 1, date: "2025-01-15", description: "Uber Ride", amount: -250, category: "Transport", merchant: "Uber" },
  { id: 2, date: "2025-01-14", description: "Grocery Shopping", amount: -1200, category: "Food", merchant: "Big Basket" },
  { id: 3, date: "2025-01-14", description: "Freelance Payment", amount: 15000, category: "Income", merchant: "Client XYZ" },
  { id: 4, date: "2025-01-13", description: "Coffee", amount: -180, category: "Food", merchant: "Starbucks" },
  { id: 5, date: "2025-01-12", description: "Mobile Recharge", amount: -499, category: "Bills", merchant: "Airtel" },
  { id: 6, date: "2025-01-11", description: "Amazon Purchase", amount: -899, category: "Shopping", merchant: "Amazon" },
  { id: 7, date: "2025-01-10", description: "Rent Payment", amount: -12000, category: "Housing", merchant: "Landlord" },
  { id: 8, date: "2025-01-09", description: "Restaurant", amount: -850, category: "Food", merchant: "Zomato" },
];

const mockChatMessages = [
  {
    id: 1,
    type: "ai" as const,
    content: "Hey! 👋 I've analyzed your spending for the last week. Your cash flow looks healthy, but I noticed something important.",
    timestamp: "10:30 AM",
    feedbackEnabled: false
  },
  {
    id: 2,
    type: "ai" as const,
    content: "Your projected balance for next week is ₹8,500. Based on your spending pattern, you're spending about ₹400/day on dining out. Consider cooking at home 2-3 days this week to save ₹800-₹1,200!",
    timestamp: "10:31 AM",
    feedbackEnabled: true,
    feedback: null
  },
  {
    id: 3,
    type: "user" as const,
    content: "What about my rent payment coming up?",
    timestamp: "10:35 AM"
  },
  {
    id: 4,
    type: "ai" as const,
    content: "Good question! Your rent of ₹12,000 is due in 5 days. With your current balance and expected income, you'll have ₹3,200 buffer after paying rent. You're all set! 💪",
    timestamp: "10:36 AM",
    feedbackEnabled: true,
    feedback: null
  },
];

const categoryIcons: Record<string, any> = {
  Transport: Car,
  Food: Utensils,
  Shopping: ShoppingBag,
  Bills: Smartphone,
  Housing: Home,
  Income: TrendingUp,
  Entertainment: Heart,
  Coffee: Coffee,
};

const categoryColors: Record<string, string> = {
  Transport: "bg-blue-500",
  Food: "bg-orange-500",
  Shopping: "bg-purple-500",
  Bills: "bg-green-500",
  Housing: "bg-red-500",
  Income: "bg-emerald-500",
  Entertainment: "bg-pink-500",
};

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState("");
  const [transactions] = useState(mockTransactions);

  // Calculate spending by category
  const spendingByCategory = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const totalSpending = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpending) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Failed to sign out");
    } else {
      localStorage.removeItem("bearer_token");
      router.push("/");
      toast.success("Signed out successfully");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user" as const,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setNewMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai" as const,
        content: "I'm analyzing your question. This is a demo, but in production, I'd provide personalized financial advice based on your data!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feedbackEnabled: true,
        feedback: null
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleFeedback = (messageId: number, feedback: 'positive' | 'negative') => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    // In production, send feedback to API
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FinPal</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </Badge>
            <div className="relative group">
              <Avatar className="cursor-pointer">
                <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-3 border-b">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors rounded-b-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="coach" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coach">AI Coach</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* AI Coach Tab */}
          <TabsContent value="coach" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Financial Coach</CardTitle>
                <CardDescription>Get personalized insights and advice</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-lg p-4 ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {message.timestamp}
                            </p>
                          </div>
                          
                          {/* Feedback buttons for AI messages */}
                          {message.type === 'ai' && message.feedbackEnabled && (
                            <div className="flex items-center gap-2 mt-2 ml-2">
                              <span className="text-xs text-muted-foreground">Was this helpful?</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${message.feedback === 'positive' ? 'bg-green-100 text-green-700' : ''}`}
                                onClick={() => handleFeedback(message.id, 'positive')}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${message.feedback === 'negative' ? 'bg-red-100 text-red-700' : ''}`}
                                onClick={() => handleFeedback(message.id, 'negative')}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask me anything about your finances..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab with Visualizations */}
          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₹{totalSpending.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₹{(totalIncome - totalSpending).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available balance</p>
                </CardContent>
              </Card>
            </div>

            {/* Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  7-Day Cash Flow Projection
                </CardTitle>
                <CardDescription>Your estimated balance for the next week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Projected Balance</p>
                      <p className="text-2xl font-bold mt-1">₹8,500</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">7 days from now</p>
                      <Badge variant="secondary" className="mt-1">Healthy</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Upcoming: Rent Payment</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">₹12,000 due in 5 days. You'll have ₹3,200 buffer remaining.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spending by Category - Interactive Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Spending by Category
                </CardTitle>
                <CardDescription>Your spending breakdown for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((item, index) => {
                    const Icon = categoryIcons[item.category] || ShoppingBag;
                    const colorClass = categoryColors[item.category] || "bg-gray-500";
                    
                    return (
                      <motion.div
                        key={item.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{item.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            className={`h-full ${colorClass}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Spending</span>
                    <span className="text-lg font-bold">₹{totalSpending.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {transactions.map((transaction) => {
                      const Icon = categoryIcons[transaction.category] || ShoppingBag;
                      const isIncome = transaction.amount > 0;
                      
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${
                              isIncome ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                            } flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${
                                isIncome ? 'text-green-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">{transaction.merchant} • {transaction.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              isIncome ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isIncome ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}