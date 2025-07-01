"use client";
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext<{
    isOpen: boolean;
    toggle: () => void;
}>({ isOpen: true, toggle: () => { } });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const toggle = () => setIsOpen((v) => !v);
    return (
        <SidebarContext.Provider value={{ isOpen, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

SidebarProvider.displayName = "SidebarProvider";

export function useSidebarState() {
    return useContext(SidebarContext);
} 