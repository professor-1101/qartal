import "./globals.css";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ReactNode } from "react";
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: 'Qartal BDD Test Design',
  description: 'پلتفرم ویرایش تست BDD',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  icons: {
    icon: [
      { url: '/AppImages/ios/32.png', sizes: '32x32', type: 'image/png' },
      { url: '/AppImages/ios/64.png', sizes: '64x64', type: 'image/png' },
      { url: '/AppImages/ios/128.png', sizes: '128x128', type: 'image/png' },
      { url: '/AppImages/ios/256.png', sizes: '256x256', type: 'image/png' },
      { url: '/AppImages/ios/512.png', sizes: '512x512', type: 'image/png' },
      { url: '/AppImages/ios/1024.png', sizes: '1024x1024', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}