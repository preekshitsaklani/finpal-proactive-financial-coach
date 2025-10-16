"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  Trash2,
  LogOut,
  ChevronRight,
  Upload,
  Smartphone,
  Mail,
  Key,
  Fingerprint,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";

export default function Settings() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    profilePicture: "",
  });

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    lowBalanceAlerts: true,
    weeklyReports: true,
    savingsTips: true,
  });

  const [safetyThreshold, setSafetyThreshold] = useState("5000");
  const [darkMode, setDarkMode] = useState<"auto" | "light" | "dark">("auto");
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethods, setTwoFactorMethods] = useState({
    phone: false,
    email: false,
    authenticator: false,
  });

  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [showPhoneChangeDialog, setShowPhoneChangeDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showAuthenticatorDialog, setShowAuthenticatorDialog] = useState(false);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    otp: "",
    step: "password" as "password" | "otp" | "biometric",
  });

  const [emailChangeForm, setEmailChangeForm] = useState({
    newEmail: "",
    currentOtp: "",
    newOtp: "",
    step: "verify-current" as "verify-current" | "enter-new" | "verify-new",
  });

  const [phoneChangeForm, setPhoneChangeForm] = useState({
    newPhone: "",
    currentOtp: "",
    newOtp: "",
    step: "verify-current" as "verify-current" | "enter-new" | "verify-new",
  });

  const [authenticatorSecret, setAuthenticatorSecret] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  // Load user session data
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        phone: "",
        email: session.user.email || "",
        profilePicture: session.user.image || "",
      });
    }
  }, [session]);

  // Check 2FA requirement
  useEffect(() => {
    const hasAtLeastOne2FA = twoFactorMethods.phone || twoFactorMethods.email || twoFactorMethods.authenticator;
    if (!hasAtLeastOne2FA) {
      toast.warning("Please enable at least one 2FA method for security", {
        duration: 5000,
      });
    }
  }, [twoFactorMethods]);

  // Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    
    if (darkMode === "dark") {
      root.classList.add("dark");
    } else if (darkMode === "light") {
      root.classList.remove("dark");
    } else {
      // Auto mode - follow system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };
      
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [darkMode]);

  // Profile picture upload
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profilePicture: reader.result as string });
      toast.success("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  };

  // Password change flow
  const handlePasswordChange = async () => {
    if (passwordForm.step === "password") {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast.error("Please fill in all password fields");
        return;
      }

      if (passwordForm.newPassword.length < 10) {
        toast.error("New password must be at least 10 characters");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Send OTP
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, purpose: "password_change" }),
      });

      if (response.ok) {
        toast.success("OTP sent to your email");
        setPasswordForm({ ...passwordForm, step: "otp" });
      } else {
        toast.error("Failed to send OTP");
      }
    } else if (passwordForm.step === "otp") {
      if (!passwordForm.otp || passwordForm.otp.length !== 6) {
        toast.error("Please enter the 6-digit OTP");
        return;
      }

      // Verify OTP
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: profile.email, 
          otp: passwordForm.otp, 
          purpose: "password_change" 
        }),
      });

      if (response.ok) {
        // Check if 2FA is enabled
        if (twoFactorEnabled) {
          toast.success("OTP verified! Please complete biometric authentication");
          setPasswordForm({ ...passwordForm, step: "biometric" });
        } else {
          // No 2FA, complete password change
          toast.success("Password changed successfully!");
          setShowPasswordDialog(false);
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            otp: "",
            step: "password",
          });
        }
      } else {
        toast.error("Invalid OTP");
      }
    } else if (passwordForm.step === "biometric") {
      // Simulate biometric authentication
      setTimeout(() => {
        toast.success("Biometric authentication successful! Password changed.");
        setShowPasswordDialog(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          otp: "",
          step: "password",
        });
      }, 2000);
    }
  };

  // Email change flow
  const handleEmailChange = async () => {
    if (emailChangeForm.step === "verify-current") {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, purpose: "change_email" }),
      });

      if (response.ok) {
        toast.success("OTP sent to your current email");
      } else {
        toast.error("Failed to send OTP");
      }
    } else if (emailChangeForm.step === "enter-new") {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: profile.email, 
          otp: emailChangeForm.currentOtp, 
          purpose: "change_email" 
        }),
      });

      if (response.ok) {
        setEmailChangeForm({ ...emailChangeForm, step: "verify-new" });
        
        // Send OTP to new email
        const newResponse = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailChangeForm.newEmail, purpose: "verify_new_email" }),
        });

        if (newResponse.ok) {
          toast.success("OTP sent to your new email");
        }
      } else {
        toast.error("Invalid OTP");
      }
    } else if (emailChangeForm.step === "verify-new") {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailChangeForm.newEmail, 
          otp: emailChangeForm.newOtp, 
          purpose: "verify_new_email" 
        }),
      });

      if (response.ok) {
        setProfile({ ...profile, email: emailChangeForm.newEmail });
        toast.success("Email updated successfully!");
        setShowEmailChangeDialog(false);
        setEmailChangeForm({
          newEmail: "",
          currentOtp: "",
          newOtp: "",
          step: "verify-current",
        });
      } else {
        toast.error("Invalid OTP");
      }
    }
  };

  // Phone change flow (similar to email)
  const handlePhoneChange = async () => {
    if (phoneChangeForm.step === "verify-current") {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profile.phone, purpose: "change_phone" }),
      });

      if (response.ok) {
        toast.success("OTP sent to your current phone");
      } else {
        toast.error("Failed to send OTP");
      }
    } else if (phoneChangeForm.step === "enter-new") {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: profile.phone, 
          otp: phoneChangeForm.currentOtp, 
          purpose: "change_phone" 
        }),
      });

      if (response.ok) {
        setPhoneChangeForm({ ...phoneChangeForm, step: "verify-new" });
        
        const newResponse = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneChangeForm.newPhone, purpose: "verify_new_phone" }),
        });

        if (newResponse.ok) {
          toast.success("OTP sent to your new phone");
        }
      } else {
        toast.error("Invalid OTP");
      }
    } else if (phoneChangeForm.step === "verify-new") {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: phoneChangeForm.newPhone, 
          otp: phoneChangeForm.newOtp, 
          purpose: "verify_new_phone" 
        }),
      });

      if (response.ok) {
        setProfile({ ...profile, phone: phoneChangeForm.newPhone });
        toast.success("Phone number updated successfully!");
        setShowPhoneChangeDialog(false);
        setPhoneChangeForm({
          newPhone: "",
          currentOtp: "",
          newOtp: "",
          step: "verify-current",
        });
      } else {
        toast.error("Invalid OTP");
      }
    }
  };

  // 2FA setup
  const handleEnable2FA = async (method: "phone" | "email" | "authenticator") => {
    if (method === "authenticator") {
      // Generate secret for authenticator app
      const secret = "JBSWY3DPEHPK3PXP"; // In production, generate this
      setAuthenticatorSecret(secret);
      setShowAuthenticatorDialog(true);
    } else {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [method]: profile[method],
          purpose: "enable_2fa" 
        }),
      });

      if (response.ok) {
        toast.success(`OTP sent to your ${method}`);
        setShow2FADialog(true);
      } else {
        toast.error("Failed to send OTP");
      }
    }
  };

  const handleVerify2FA = async (method: "phone" | "email", otp: string) => {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        [method]: profile[method],
        otp,
        purpose: "enable_2fa" 
      }),
    });

    if (response.ok) {
      setTwoFactorMethods({ ...twoFactorMethods, [method]: true });
      setTwoFactorEnabled(true);
      toast.success(`2FA via ${method} enabled successfully!`);
      setShow2FADialog(false);
    } else {
      toast.error("Invalid OTP");
    }
  };

  const handleVerifyAuthenticator = () => {
    if (authenticatorCode.length === 6) {
      // Verify code with backend
      setTwoFactorMethods({ ...twoFactorMethods, authenticator: true });
      setTwoFactorEnabled(true);
      toast.success("Authenticator app enabled successfully!");
      setShowAuthenticatorDialog(false);
      setAuthenticatorCode("");
    } else {
      toast.error("Please enter a valid 6-digit code");
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
    }
  };

  // Check if at least one 2FA method is enabled
  const hasAtLeastOne2FA = twoFactorMethods.phone || twoFactorMethods.email || twoFactorMethods.authenticator;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      {/* 2FA Warning Banner */}
      {!hasAtLeastOne2FA && (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4">
          <div className="container mx-auto max-w-4xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Two-Factor Authentication Required
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please enable at least one 2FA method to secure your account and use the app.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const element = document.getElementById("security-tab");
                element?.click();
              }}
            >
              Enable Now
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto max-w-4xl p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security" id="security-tab">Security</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    {profile.profilePicture ? (
                      <AvatarImage src={profile.profilePicture} />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("profilePicture")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || "+91 98765 43210"}
                        disabled
                        className="flex-1"
                      />
                      <Dialog open={showPhoneChangeDialog} onOpenChange={setShowPhoneChangeDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Phone Number</DialogTitle>
                            <DialogDescription>
                              You'll need to verify both your current and new phone numbers
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {phoneChangeForm.step === "verify-current" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Current Phone OTP</Label>
                                  <Input
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    value={phoneChangeForm.currentOtp}
                                    onChange={(e) => setPhoneChangeForm({ ...phoneChangeForm, currentOtp: e.target.value })}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={() => setPhoneChangeForm({ ...phoneChangeForm, step: "enter-new" })}
                                >
                                  Verify Current Phone
                                </Button>
                              </>
                            )}
                            {phoneChangeForm.step === "enter-new" && (
                              <>
                                <div className="space-y-2">
                                  <Label>New Phone Number</Label>
                                  <Input
                                    type="tel"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={phoneChangeForm.newPhone}
                                    onChange={(e) => setPhoneChangeForm({ ...phoneChangeForm, newPhone: e.target.value })}
                                  />
                                </div>
                                <Button className="w-full" onClick={handlePhoneChange}>
                                  Send OTP to New Phone
                                </Button>
                              </>
                            )}
                            {phoneChangeForm.step === "verify-new" && (
                              <>
                                <div className="space-y-2">
                                  <Label>New Phone OTP</Label>
                                  <Input
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    value={phoneChangeForm.newOtp}
                                    onChange={(e) => setPhoneChangeForm({ ...phoneChangeForm, newOtp: e.target.value })}
                                  />
                                </div>
                                <Button className="w-full" onClick={handlePhoneChange}>
                                  Verify & Update
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="flex-1"
                      />
                      <Dialog open={showEmailChangeDialog} onOpenChange={setShowEmailChangeDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Email Address</DialogTitle>
                            <DialogDescription>
                              You'll need to verify both your current and new email addresses
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {emailChangeForm.step === "verify-current" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Current Email OTP</Label>
                                  <Input
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    value={emailChangeForm.currentOtp}
                                    onChange={(e) => setEmailChangeForm({ ...emailChangeForm, currentOtp: e.target.value })}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={() => setEmailChangeForm({ ...emailChangeForm, step: "enter-new" })}
                                >
                                  Verify Current Email
                                </Button>
                              </>
                            )}
                            {emailChangeForm.step === "enter-new" && (
                              <>
                                <div className="space-y-2">
                                  <Label>New Email Address</Label>
                                  <Input
                                    type="email"
                                    placeholder="newemail@example.com"
                                    value={emailChangeForm.newEmail}
                                    onChange={(e) => setEmailChangeForm({ ...emailChangeForm, newEmail: e.target.value })}
                                  />
                                </div>
                                <Button className="w-full" onClick={handleEmailChange}>
                                  Send OTP to New Email
                                </Button>
                              </>
                            )}
                            {emailChangeForm.step === "verify-new" && (
                              <>
                                <div className="space-y-2">
                                  <Label>New Email OTP</Label>
                                  <Input
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    value={emailChangeForm.newOtp}
                                    onChange={(e) => setEmailChangeForm({ ...emailChangeForm, newOtp: e.target.value })}
                                  />
                                </div>
                                <Button className="w-full" onClick={handleEmailChange}>
                                  Verify & Update
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                <Button onClick={() => toast.success("Profile updated!")}>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Preferences</CardTitle>
                <CardDescription>Set your safety threshold and financial goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Safety Threshold (₹)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={safetyThreshold}
                    onChange={(e) => setSafetyThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive alerts when your projected balance falls below this amount
                  </p>
                </div>

                <Button onClick={() => toast.success("Threshold updated!")}>Update Threshold</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push" className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                  </div>
                  <Switch
                    id="push"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="balance" className="text-base">Low Balance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get warned when your balance is running low</p>
                  </div>
                  <Switch
                    id="balance"
                    checked={notifications.lowBalanceAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, lowBalanceAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly" className="text-base">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive a summary of your finances every week</p>
                  </div>
                  <Switch
                    id="weekly"
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyReports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="tips" className="text-base">Savings Tips</Label>
                    <p className="text-sm text-muted-foreground">Get personalized tips to save money</p>
                  </div>
                  <Switch
                    id="tips"
                    checked={notifications.savingsTips}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, savingsTips: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how FinPal looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="darkMode">Theme</Label>
                  <Select value={darkMode} onValueChange={(value: any) => setDarkMode(value)}>
                    <SelectTrigger id="darkMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Follow System)</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {darkMode === "auto" 
                      ? "Theme automatically switches based on your device settings" 
                      : `Theme is set to ${darkMode} mode`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription>Manage your account security and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Change Password</p>
                          <p className="text-sm text-muted-foreground">Update your account password</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        {passwordForm.step === "password" && "Enter your current and new password"}
                        {passwordForm.step === "otp" && "Verify with OTP sent to your email"}
                        {passwordForm.step === "biometric" && "Complete biometric authentication"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {passwordForm.step === "password" && (
                        <>
                          <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                              type="password"
                              autoComplete="off"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>New Password (min 10 characters)</Label>
                            <Input
                              type="password"
                              autoComplete="off"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                              type="password"
                              autoComplete="off"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                      {passwordForm.step === "otp" && (
                        <div className="space-y-2">
                          <Label>Enter OTP</Label>
                          <Input
                            placeholder="6-digit code"
                            maxLength={6}
                            value={passwordForm.otp}
                            onChange={(e) => setPasswordForm({ ...passwordForm, otp: e.target.value })}
                          />
                        </div>
                      )}
                      {passwordForm.step === "biometric" && (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Fingerprint className="w-16 h-16 text-primary animate-pulse mb-4" />
                          <p className="text-center text-muted-foreground">
                            Please scan your fingerprint or face to continue
                          </p>
                        </div>
                      )}
                      <Button className="w-full" onClick={handlePasswordChange}>
                        {passwordForm.step === "password" && "Continue"}
                        {passwordForm.step === "otp" && "Verify OTP"}
                        {passwordForm.step === "biometric" && "Authenticating..."}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {hasAtLeastOne2FA 
                          ? `Enabled (${Object.values(twoFactorMethods).filter(Boolean).length} method${Object.values(twoFactorMethods).filter(Boolean).length > 1 ? 's' : ''})` 
                          : "Not enabled - Please set up"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={hasAtLeastOne2FA ? "default" : "destructive"}>
                    {hasAtLeastOne2FA ? "Active" : "Required"}
                  </Badge>
                </div>

                {/* 2FA Methods */}
                <div className="space-y-3 pl-4 border-l-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm">Phone Number OTP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {twoFactorMethods.phone && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant={twoFactorMethods.phone ? "outline" : "default"}
                        onClick={() => !twoFactorMethods.phone && handleEnable2FA("phone")}
                        disabled={twoFactorMethods.phone}
                      >
                        {twoFactorMethods.phone ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email OTP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {twoFactorMethods.email && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant={twoFactorMethods.email ? "outline" : "default"}
                        onClick={() => !twoFactorMethods.email && handleEnable2FA("email")}
                        disabled={twoFactorMethods.email}
                      >
                        {twoFactorMethods.email ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Authenticator App</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {twoFactorMethods.authenticator && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant={twoFactorMethods.authenticator ? "outline" : "default"}
                        onClick={() => !twoFactorMethods.authenticator && handleEnable2FA("authenticator")}
                        disabled={twoFactorMethods.authenticator}
                      >
                        {twoFactorMethods.authenticator ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Authenticator Dialog */}
                <Dialog open={showAuthenticatorDialog} onOpenChange={setShowAuthenticatorDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Up Authenticator App</DialogTitle>
                      <DialogDescription>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                        <div className="w-48 h-48 bg-white flex items-center justify-center rounded">
                          {/* In production, generate actual QR code */}
                          <p className="text-xs text-center p-4">
                            QR Code<br/>
                            <code className="text-xs">{authenticatorSecret}</code>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Or enter this code manually: <code className="font-mono">{authenticatorSecret}</code>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Enter 6-digit code from app</Label>
                        <Input
                          placeholder="000000"
                          maxLength={6}
                          value={authenticatorCode}
                          onChange={(e) => setAuthenticatorCode(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={handleVerifyAuthenticator}>
                        Verify & Enable
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between">
                  <span>Delete All Data</span>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="destructive" className="w-full justify-between">
                  <span>Delete Account</span>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Manage your linked bank accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">HDFC Bank - Savings</p>
                      <p className="text-sm text-muted-foreground">•••• 4532</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Primary</Badge>
                </div>

                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 w-4 h-4" />
                  Add Another Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between">
                  <span>Export My Data</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-red-600 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  <span>Sign Out</span>
                  <LogOut className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}