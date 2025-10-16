"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Social sign-up handlers
  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      
      if (error) {
        console.error("Google sign-up error:", error);
        toast.error("Google sign-up failed. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Google sign-up exception:", error);
      toast.error("An error occurred during Google sign-up.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "apple",
        callbackURL: "/dashboard",
      });
      
      if (error) {
        console.error("Apple sign-up error:", error);
        toast.error("Apple sign-up failed. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Apple sign-up exception:", error);
      toast.error("An error occurred during Apple sign-up.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting sign-up with:", { email: formData.email, name: formData.name });
      
      // Register user with better-auth
      const result = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      console.log("Sign-up result:", result);

      // Check for any error
      if (result.error) {
        console.error("Sign-up error:", result.error);
        
        // Handle specific error cases
        if (result.error.status === 400 && result.error.message?.includes("already")) {
          toast.error("This email is already registered. Please sign in instead.");
          setTimeout(() => router.push("/sign-in"), 2000);
          return;
        }
        
        toast.error(result.error.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      toast.success("Account created successfully! Redirecting to dashboard...");
      
      // Auto-login after successful registration
      const loginResult = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (loginResult.error) {
        console.error("Auto-login error:", loginResult.error);
        toast.error("Account created but login failed. Please sign in manually.");
        setTimeout(() => router.push("/sign-in"), 2000);
        return;
      }

      // Redirect to dashboard
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (error) {
      console.error("Unexpected error during sign-up:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your FinPal account</CardTitle>
          <CardDescription>
            Sign up to start managing your finances with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <Icons.google className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleAppleSignUp}
                disabled={loading}
              >
                <Icons.apple className="mr-2 h-4 w-4" />
                Continue with Apple
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}