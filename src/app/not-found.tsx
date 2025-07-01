 "use client";

import '@/app/globals.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
    const { t, dir } = useI18n();
    const router = useRouter();
    return (
        <div className="font-dana min-h-screen flex flex-col items-center justify-center bg-background p-4" dir={dir}>
            <Card className="bg-card border shadow-sm max-w-md w-full">
                <CardHeader className="flex flex-col items-center">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                    <CardTitle className="text-right">{t("notFound.title")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <p className="text-muted-foreground mb-6 text-right">{t("notFound.description")}</p>
                    <Button onClick={() => router.push("/")}>{t("notFound.button")}</Button>
                </CardContent>
            </Card>
        </div>
    );
} 