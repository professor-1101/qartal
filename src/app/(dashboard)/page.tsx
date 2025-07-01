"use client";

import * as React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useI18n } from "@/i18n";

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">
          قارطال
          <span className="text-muted-foreground text-lg font-normal">
            پلتفرم QA
          </span>
        </h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/projects"
          className="group block rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.projects.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.projects.description")}
          </p>
        </Link>
        <div className="block rounded-xl border bg-card p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.requirements.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.requirements.description")}
          </p>
        </div>
        <div className="block rounded-xl border bg-card p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.testCases.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.testCases.description")}
          </p>
        </div>
        <div className="block rounded-xl border bg-card p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.reports.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.reports.description")}
          </p>
        </div>
        <div className="block rounded-xl border bg-card p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.settings.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.settings.description")}
          </p>
        </div>
        <div className="block rounded-xl border bg-card p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-2">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-lg font-semibold">
              {t("home.features.help.title")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("home.features.help.description")}
          </p>
        </div>
      </div>
    </div>
  );
}