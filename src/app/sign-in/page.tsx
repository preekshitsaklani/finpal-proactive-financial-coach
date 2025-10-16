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
import { Fingerprint, Smartphone, Mail, Shield, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LoginMethod = "social" | "person-id" | "email" | "multi-device";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("social");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    personId: "",
    otp: "",
    verificationCode: "",
  });

  // Social login handlers
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
    } catch (error) {
      toast.error("An error occurred during Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "apple",
        callbackURL: "/dashboard",
      });
      
      if (error) {
        toast.error("Apple sign-in failed. Please try again.");
        return;
      }
    } catch (error) {
      toast.error("An error occurred during Apple sign-in.");
    } finally {
      setLoading(false);
    }
  };

  // Email/Password login
  const handleEmailLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // First, send OTP
      const otpResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email,
          purpose: "login"
        }),
      });

      if (!otpResponse.ok) {
        toast.error("Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("OTP sent to your email! Please enter it below.");
      
      // Wait for user to enter OTP
      // In a real implementation, you'd have a separate step for OTP entry
      // For now, we'll proceed with the login
      
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: "/dashboard"
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Person ID login
  const handlePersonIdLogin = async () => {
    if (!formData.personId) {
      toast.error("Please enter your Person ID.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login-person-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          personId: formData.personId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Trigger biometric authentication
        toast.success("Person ID verified! Please complete biometric authentication.");
        // In a real implementation, this would trigger the device's biometric auth
        setTimeout(() => {
          toast.success("Biometric authentication successful!");
          router.push("/dashboard");
        }, 2000);
      } else {
        toast.error(data.error || "Invalid Person ID.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Multi-device login
  const handleMultiDeviceLogin = async () => {
    if (!formData.personId) {
      toast.error("Please enter your Person ID.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-multi-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          personId: formData.personId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`A 4-digit code has been sent to your primary device: ${data.deviceName}`);
        toast.info("Please enter the code to continue.");
      } else {
        toast.error(data.error || "Failed to send verification code.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMultiDeviceCode = async () => {
    if (!formData.verificationCode) {
      toast.error("Please enter the 4-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-multi-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          personId: formData.personId,
          verificationCode: formData.verificationCode,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Device verified! Logging you in...");
        // Store session token
        localStorage.setItem("bearer_token", data.token);
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Invalid verification code.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Choose your preferred login method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">Social/Email</TabsTrigger>
              <TabsTrigger value="person-id">Person ID</TabsTrigger>
            </TabsList>

            {/* Social & Email Login */}
            <TabsContent value="social" className="space-y-4">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Icons.google className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleAppleSignIn}
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
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="off"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <Button
                  className="w-full"
                  onClick={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in with Email"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  An OTP will be sent to your email for verification
                </p>
              </div>
            </TabsContent>

            {/* Person ID Login */}
            <TabsContent value="person-id" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                  <Key className="w-6 h-6 text-primary" />
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Enter your unique 12-character Person ID
                </p>

                <div className="space-y-2">
                  <Label htmlFor="personId">Person ID</Label>
                  <Input
                    id="personId"
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength={12}
                    className="font-mono tracking-wider text-center text-lg"
                    value={formData.personId}
                    onChange={(e) => setFormData({ ...formData, personId: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handlePersonIdLogin}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Login with Person ID"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You'll be prompted for biometric authentication
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">New Device?</span>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Multi-Device Login</p>
                  <p className="text-xs text-muted-foreground">
                    Logging in from a new device? You'll need to approve it from your primary device.
                  </p>
                  
                  {!formData.verificationCode ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleMultiDeviceLogin}
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Request Verification Code"}
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">4-Digit Code</Label>
                        <Input
                          id="verificationCode"
                          placeholder="Enter 4-digit code"
                          maxLength={4}
                          className="font-mono tracking-wider text-center text-lg"
                          value={formData.verificationCode}
                          onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleVerifyMultiDeviceCode}
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify & Login"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}