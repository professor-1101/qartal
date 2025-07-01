"use client";
import React from "react";
import { useI18n } from "@/i18n";

export function HtmlAttributesSetter() {
    const { locale, dir } = useI18n();

    React.useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.dir = dir;
            document.documentElement.lang = locale;
        }
    }, [dir, locale]);

    return null;
}