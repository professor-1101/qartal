import { Icons } from "@/components/icons";
import Link from "next/link";
import '@/app/globals.css';
import { I18nProvider } from "@/i18n";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 font-dana p-4">
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <Icons.logo className="h-10 w-10 text-primary" />
        </Link>
        <span className="text-muted-foreground text-sm">پلتفرم مدرن تست BDD</span>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
        <I18nProvider>
          {children}
        </I18nProvider>
      </div>
    </div>
  );
} 