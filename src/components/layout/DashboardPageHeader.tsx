import React from "react";

interface DashboardPageHeaderProps {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function DashboardPageHeader({
    title,
    description,
    actions,
}: DashboardPageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">{title}</h1>
                {description && (
                    <div className="text-muted-foreground max-w-prose">{description}</div>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}