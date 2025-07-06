"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useI18n } from "@/i18n";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import React from "react";

export default function SignUpPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { status } = useSession();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/projects");
    }
  }, [status, router]);

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "خطا در ثبت‌نام");
      } else {
        setSuccess("حساب کاربری با موفقیت ایجاد شد. حالا می‌توانید وارد شوید.");
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    } catch (error) {
      setError("خطا در ثبت‌نام");
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-right">
        <h1 className="text-2xl font-semibold">
          {t("auth.createAccount")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signUpDescription")}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <AuthForm mode="register" onSubmit={handleSubmit} />
    </div>
  );
}