"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { useI18n } from "@/i18n";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").endsWith("@rpk.ir", "Email must end with @rpk.ir"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AuthFormProps = {
  mode: "login" | "register";
  onSubmit: (data: any) => void;
};

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { t } = useI18n();

  const form = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: mode === "login"
      ? {
        email: "",
        password: "",
      }
      : {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
  });

  async function handleSubmit(data: any) {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {mode === "register" && (
            <>
              <FormField
                control={form.control}
                name={"firstName" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.form.firstName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auth.form.firstNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"lastName" as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.form.lastName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auth.form.lastNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name={"email" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.form.email")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={mode === "login" ? t("auth.form.emailPlaceholder") : t("auth.form.rpkEmailPlaceholder")}
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={"password" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.form.password")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("auth.form.passwordPlaceholder")}
                    type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === "register" && (
            <FormField
              control={form.control}
              name={"confirmPassword" as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.form.confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("auth.form.confirmPasswordPlaceholder")} type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
          </Button>
        </form>
      </Form>
      <div className="flex justify-center pt-4">
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? t("auth.form.dontHaveAccount") : t("auth.form.alreadyHaveAccount")}
          <Link
            href={mode === "login" ? "/sign-up" : "/sign-in"}
            className="text-primary hover:underline mr-1"
          >
            {mode === "login" ? t("auth.signUp") : t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}