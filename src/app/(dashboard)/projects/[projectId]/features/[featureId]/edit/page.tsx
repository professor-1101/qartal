// editor/src/app/(dashboard)/projects/[projectId]/features/[featureId]/edit/page.tsx

import { notFound, redirect } from 'next/navigation';
// ✅ مطمئن شوید مسیر و نام تایپ Feature شما صحیح است.
import { Feature as TransformedFeature } from "@/types/gherkin";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import FeatureEditClient from './feature-edit-client';

export const dynamic = 'force-dynamic';

export default async function FeatureEditPage({
    params
}: {
    params: { projectId: string; featureId: string }
}) {
    const session = await getServerSession(authOptions);
    // بررسی دسترسی کاربر
    if (!session?.user?.id) {
        console.log('No valid session, redirecting to sign-in');
        redirect('/sign-in');
    }

    const { projectId, featureId } = params;

    // اطمینان از اینکه کاربر صاحب پروژه است
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: session.user.id,
        }
    });

    if (!project) {
        console.log('Project not found or not owned by user', { projectId, userId: session.user.id });
        return notFound();
    }

    // خواندن Feature شامل سناریوها، مثال‌ها، Background و rulesJson
    const feature = await prisma.feature.findFirst({
        where: {
            id: featureId,
            projectId: projectId,
        },
        include: {
            scenarios: {
                include: {
                    steps: true,
                    examples: true,
                }
            },
            background: {
                include: {
                    steps: true
                }
            },
             // ✅ نیازی به include project دوباره نیست چون بالا چک شده
        }
    });

    if (!feature) {
        console.log('Feature not found', { featureId, projectId });
        return notFound();
    }

    // ✅ تبدیل داده‌های Prisma به فرمت Feature مورد نیاز کلاینت
    const transformedFeature: TransformedFeature = {
        id: feature.id,
        name: feature.name,
        description: feature.description ?? "",
        tags: feature.tags ?? [], // اضافه کردن Nullish Coalescing
        // ✅ مهم: خواندن و پارس کردن rulesJson از دیتابیس
        rules: feature.rulesJson ? JSON.parse(feature.rulesJson as string) : [],
        scenarios: feature.scenarios.map((scenario: any) => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description ?? "",
            type: scenario.type,
            keyword: scenario.keyword ?? (scenario.type === 'scenario-outline' ? "Scenario Outline" : "Scenario"), // Default keyword
            tags: scenario.tags ?? [],
            steps: scenario.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.argument, // Nullish check? Depends on your schema/usage
            })),
            examples: scenario.examples && scenario.examples.length > 0 ? {
                 // ✅ مثال ها به صورت یک آبجکت Examples با headers و rows هستند
                 id: scenario.examples[0].id, // فرض می کنیم همیشه یک Example داریم یا اونی که هست اولی است
                 headers: scenario.examples[0].header ?? [], // ✅ مطمئن شوید header آرایه است
                 rows: (scenario.examples[0].body ?? []).map((row: string[], index: number) => ({ // ✅ مطمئن شوید body آرایه آرایه است
                     id: `row-${index}`,
                     values: row,
                 }))
            } : undefined // ✅ اگر مثالی نبود undefined باشد طبق تایپ Feature
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.argument, // Nullish check?
            })),
        } : undefined, // یا null بسته به تعریف تایپ Background
        order: feature.order ?? 0,
    };

    return (
        <div className="h-full" dir="rtl">
            {/* ارسال transformedFeature به FeatureEditClient */}
             {/* ✅ ارسال شیء project با id */}
            <FeatureEditClient feature={transformedFeature} project={{ id: project.id }} />
        </div>
    );
}
