"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { fa } from "./translations/fa";

export type Locale = "fa";
export const translations = { fa };

export function getTranslation(locale: Locale, key: string): any {
  const keys = key.split(".");
  let value: any = translations[locale];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key; // fallback to key if not found
  }
  return value;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: "rtl";
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");
  const dir = "rtl"; // همیشه راست‌چین

  useEffect(() => {
    // همیشه فارسی باشد، localStorage را نادیده بگیر
    setLocaleState("fa");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("locale", "fa"); // همیشه fa ذخیره کن
    if (typeof document !== "undefined") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "fa";
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    // فقط fa پذیرفته می‌شود
    if (newLocale === "fa") {
      setLocaleState(newLocale);
    }
  };

  const t = (key: string) => getTranslation(locale, key);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}