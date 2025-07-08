import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface DashboardPageHeaderProps {
    title: string;
    description?: React.ReactNode; // تغییر به React.ReactNode
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href: string }>;
}

export default function DashboardPageHeader({
    title,
    description,
    actions,
    breadcrumbs,
}: DashboardPageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
                {breadcrumbs && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <BreadcrumbItem key={index}>
                                    {index < breadcrumbs.length - 1 ? (
                                        <>
                                            <BreadcrumbLink href={crumb.href}>
                                                {crumb.label}
                                            </BreadcrumbLink>
                                            <BreadcrumbSeparator />
                                        </>
                                    ) : (
                                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
                <h1 className="text-3xl font-bold">{title}</h1>
                {description && (
                    <div className="text-muted-foreground max-w-prose">{description}</div>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}