import "./globals.css";
import "./fonts.module.css";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/components/providers/auth-provider";
import { OfflineProvider } from "@/components/providers/offline-context";
import { AutoSaveProvider } from "@/components/providers/autosave-context";
import { ReactNode } from "react";
import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: 'کارتال BDD Test Design',
  description: 'پلتفرم ویرایش تست BDD',
  manifest: '/manifest.json',
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

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <I18nProvider>
          <AuthProvider>
            <OfflineProvider>
              <AutoSaveProvider>
                {children}
              </AutoSaveProvider>
            </OfflineProvider>
          </AuthProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}