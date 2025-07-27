"use client";

import Sidebar from "@/components/layout/sidebar-ui";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarProvider, useSidebarState } from "@/components/providers/sidebar-context";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    React.useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/sign-in");
        }
    }, [status, router]);
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar />
                <SidebarContentWithHeader>{children}</SidebarContentWithHeader>
            </div>
        </SidebarProvider>
    );
}

function SidebarContentWithHeader({ children }: { children: React.ReactNode }) {
    const { isOpen } = useSidebarState();
    return (
        <div className={cn(
            "flex flex-col flex-1 transition-all duration-300 ease-in-out",
            isOpen ? "lg:mr-64" : "lg:mr-0"
        )}>
            <SiteHeader />
            <main className="flex-1 w-full px-6 py-6">{children}</main>
        </div>
    );
}