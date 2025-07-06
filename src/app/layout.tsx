import "./globals.css";
import { I18nProvider } from "@/i18n";
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
        <link rel="icon" type="image/png" sizes="32x32" href="/AppImages/ios/32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/AppImages/ios/64.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/AppImages/ios/128.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/AppImages/ios/256.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/AppImages/ios/512.png" />
        <link rel="icon" type="image/png" sizes="1024x1024" href="/AppImages/ios/1024.png" />
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