import "./globals.css";
import { I18nProvider } from "@/i18n";
import { HtmlAttributesSetter } from "@/components/providers/html-attributes-setter";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ReactNode } from "react";
import Head from "next/head";
import { PwaProvider } from "@/components/providers/pwa-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <Head>
        <title>Qartal BDD Test Design</title>
        <meta name="description" content="پلتفرم ویرایش تست BDD  " />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </Head>
      <body>
        <PwaProvider />
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}