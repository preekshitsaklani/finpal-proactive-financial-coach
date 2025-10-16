"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingFlow() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new comprehensive sign-up page
    router.push("/sign-up");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-muted-foreground">Redirecting to sign up...</p>
      </div>
    </div>
  );
}