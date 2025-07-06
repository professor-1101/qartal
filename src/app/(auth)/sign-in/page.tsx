"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useI18n } from "@/i18n";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import React from "react";

export default function SignInPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/projects");
    }
  }, [status, router]);

  const handleSubmit = async (data: any) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("ایمیل یا رمز عبور اشتباه است");
      } else {
        router.push("/projects");
      }
    } catch (error) {
      setError("خطا در ورود");
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-right">
        <h1 className="text-2xl font-semibold">
          {t("auth.welcomeBack")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signInDescription")}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <AuthForm mode="login" onSubmit={handleSubmit} />
    </div>
  );
}