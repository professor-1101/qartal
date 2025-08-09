"use client";

import { Activity } from "lucide-react";
import { useI18n } from "@/i18n";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

export default function AdminDashboardPage() {
  const { t } = useI18n();

  return (
    <div className="container-fluid mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
      </div>
      <p className="text-muted-foreground text-lg mb-8">
        {t("admin.description")}
      </p>
      <AdminUsersTable />
      {/* اینجا جداول کاربران و پروژه‌ها و لاگ‌ها اضافه خواهد شد */}
    </div>
  );
} 