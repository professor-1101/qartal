"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n";

import { Separator } from "@/components/ui/separator";
import { useSidebarState } from "@/components/providers/sidebar-context";
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const { isOpen, toggle } = useSidebarState();
  const pathname = usePathname();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [featureName, setFeatureName] = useState<string | null>(null);

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/projects") || pathname.startsWith("/settings") || pathname.startsWith("/gherkin");

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    dashboard: t("breadcrumb.dashboard"),
    projects: t("breadcrumb.projects"),
    gherkin: t("breadcrumb.gherkin"),
    changelog: t("breadcrumb.changelog"),
    docs: t("breadcrumb.docs"),
    settings: t("breadcrumb.settings"),
    features: t("breadcrumb.features"),
    edit: t("breadcrumb.edit"),
  };

  useEffect(() => {
    const projectMatch = pathname.match(/^\/projects\/([^\/]+)/);
    setProjectName(null);
    setFeatureName(null);

    if (projectMatch) {
      const projectId = projectMatch[1];
      fetch(`/api/projects/${projectId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setProjectName(data?.name || null));

      const featureMatch = pathname.match(/^\/projects\/([^\/]+)\/features\/([^\/]+)/);
      if (featureMatch) {
        const featureId = featureMatch[2];
        fetch(`/api/projects/${projectId}/features/${featureId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setFeatureName(data?.name || null));
      }
    }
  }, [pathname]);

  const breadcrumbItems = segments.map((seg, idx) => {
    let label = breadcrumbMap[seg] || seg;

    // Replace project ID with project name
    if (idx === 1 && segments[0] === 'projects' && projectName) {
      label = projectName;
    }

    // Replace feature ID with feature name
    if (idx === 3 && segments[2] === 'features' && featureName) {
      label = featureName;
    }

    return {
      label: label,
      href: "/" + segments.slice(0, idx + 1).join("/"),
      isLast: idx === segments.length - 1,
    };
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {isDashboard && (
        <div className="flex items-center gap-2 px-4">
          <button
            data-slot="sidebar-trigger"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-7 -ml-1"
            data-sidebar="trigger"
            onClick={toggle}
            aria-label="تغییر وضعیت نوار کناری"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></svg>
            <span className="sr-only">تغییر وضعیت نوار کناری</span>
          </button>
          <Separator orientation="vertical" className="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5 text-right">
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.href}>
                  <BreadcrumbItem className={cn(
                    "inline-flex items-center gap-1.5",
                    idx < breadcrumbItems.length - 1 ? "hidden md:block" : ""
                  )}>
                    {item.isLast ? (
                      <span className="text-foreground font-normal text-right">{item.label}</span>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link className="hover:text-foreground transition-colors text-right" href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbItems.length - 1 && (
                    <BreadcrumbSeparator className="[&>svg]:size-3.5 hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
    </header>
  );
}