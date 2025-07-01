"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/i18n";
import {
    Folder,
    Settings,
    Sparkles,
    BookOpen,
    X,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { useSidebarState } from "@/components/providers/sidebar-context";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarContent, SidebarFooter } from "./sidebar-content";

const SIDEBAR_WIDTH = 256; // 16rem

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useI18n();
    const { isOpen, toggle } = useSidebarState();

    const navItems = [
        {
            label: t("sidebar.projects"),
            href: "/projects",
            icon: Folder,
        },
        {
            label: t("sidebar.settings"),
            href: "/settings",
            icon: Settings,
        },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex fixed z-40 inset-y-0 right-0 flex-col border-l bg-[color:var(--sidebar-background)] transition-all duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                style={{ width: SIDEBAR_WIDTH }}
            >
                {/* Sidebar Header - Same height as main header */}
                <div data-slot="sidebar-header" data-sidebar="header" className="flex flex-col gap-2 p-2">
                    <ul data-slot="sidebar-menu" data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
                        <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative">
                            <button
                                data-slot="dropdown-menu-trigger"
                                data-sidebar="menu-button"
                                data-size="lg"
                                data-active="false"
                                className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-right outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded="false"
                                data-state="closed"
                            >
                                <div className="bg-[oklch(.205_0_0)] text-white flex aspect-square size-8 items-center justify-center rounded-[10px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-command size-4"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path></svg>
                                </div>
                                <div className="grid flex-1 text-right text-sm leading-tight">
                                    <span className="truncate font-medium">Nemesis</span>
                                    <span className="truncate text-xs">تیم کنترل کیفی</span>
                                </div>
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                    <SidebarContent navItems={navItems} />
                </div>

                {/* Sidebar Footer */}
                <SidebarFooter />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "lg:hidden fixed z-50 inset-y-0 right-0 flex flex-col w-80 max-w-[80vw] border-l bg-[color:var(--sidebar-background)] transition-all duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Mobile Sidebar Header */}
                <div data-slot="sidebar-header" data-sidebar="header" className="flex flex-col gap-2 p-2">
                    <ul data-slot="sidebar-menu" data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
                        <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative">
                            <div className="flex items-center justify-between">
                                <button
                                    data-slot="dropdown-menu-trigger"
                                    data-sidebar="menu-button"
                                    data-size="lg"
                                    data-active="false"
                                    className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-right outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded="false"
                                    data-state="closed"
                                >
                                    <div className="bg-[oklch(.205_0_0)] text-white flex aspect-square size-8 items-center justify-center rounded-[10px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-command size-4"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path></svg>
                                    </div>
                                    <div className="grid flex-1 text-right text-sm leading-tight">
                                        <span className="truncate font-medium">Nemesis</span>
                                        <span className="truncate text-xs">تیم کنترل کیفی</span>
                                    </div>
                                </button>
                                <button
                                    onClick={toggle}
                                    className="p-2 hover:bg-accent rounded-md transition-colors"
                                    aria-label="بستن نوار کناری"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Mobile Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                    <SidebarContent navItems={navItems} onItemClick={toggle} />
                </div>

                {/* Mobile Sidebar Footer */}
                <SidebarFooter />
            </aside>

            {/* Backdrop - Only visible when sidebar is open on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={toggle}
                />
            )}
        </>
    );
}

Sidebar.displayName = "Sidebar"; 