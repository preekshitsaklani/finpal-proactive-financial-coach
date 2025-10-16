"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, TrendingUp, Bell, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header with Auth Buttons */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">FinPal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your <span className="text-primary">AI Financial Coach</span>
              <br />
              for Unpredictable Income
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stop stressing about money. FinPal proactively coaches you through income volatility
              with personalized insights and real-time guidance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                Sign In to Your Account
              </Button>
            </Link>
          </motion.div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Shield className="w-4 h-4 text-green-500" />
            <span>Bank-level encryption • Double-layer security • Your data is safe</span>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for Your Financial Reality</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Traditional budgeting apps fail freelancers and gig workers. FinPal understands your irregular income.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
          <p className="text-xl text-muted-foreground">From signup to financial clarity in under 2 minutes</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Bank-Level Security</h2>
            <p className="text-xl text-muted-foreground">Your financial data is protected with industry-leading security</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-12 text-center text-primary-foreground"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of freelancers and gig workers who've found financial peace with FinPal
          </p>
          <Link href="/onboarding">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">FinPal</span>
              </div>
              <p className="text-sm text-muted-foreground">Your autonomous financial companion for the modern workforce.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 FinPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: TrendingUp,
    title: "Proactive Alerts",
    description: "Get warned before cash flow problems happen. FinPal predicts your balance 7 days ahead and alerts you in time to adjust."
  },
  {
    icon: Bell,
    title: "AI Coach Chat",
    description: "Chat with your personal financial coach. Get actionable advice in plain language, not complex charts."
  },
  {
    icon: Smartphone,
    title: "Smart Categorization",
    description: "Automatic transaction categorization that understands your spending patterns and adapts over time."
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Prediction",
    description: "See where your finances are headed based on your unique income patterns, not generic monthly budgets."
  },
  {
    icon: Bell,
    title: "Intelligent Notifications",
    description: "Only get notified when it matters. No spam, just timely insights that help you make better decisions."
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Read-only access with 256-bit encryption. We never store your banking credentials or move money."
  }
];

const steps = [
  {
    title: "Sign Up Securely",
    description: "Create your account with phone verification in under 30 seconds. No lengthy forms."
  },
  {
    title: "Connect Your Bank",
    description: "Securely link your bank account using Plaid. We use read-only access and bank-level encryption."
  },
  {
    title: "Get Smart Insights",
    description: "Your AI coach analyzes your finances and starts delivering personalized, proactive advice immediately."
  }
];

const securityFeatures = [
  {
    title: "256-bit AES Encryption",
    description: "All your financial data is encrypted both in transit and at rest using military-grade encryption."
  },
  {
    title: "Read-Only Access",
    description: "We can only view your transactions. We cannot move money, make payments, or modify your accounts."
  },
  {
    title: "Plaid Integration",
    description: "We use Plaid, the industry-standard trusted by major financial institutions worldwide."
  },
  {
    title: "Zero Password Storage",
    description: "We never see or store your banking passwords. Authentication happens directly with your bank."
  }
];