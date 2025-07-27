import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { nanoid } from 'nanoid';
import { deepNormalizeProject } from '@/lib/deepNormalize';
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        let data = await request.json();
        data = deepNormalizeProject(data);
        if (!data || !data.name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        // Always provide a unique slang
        const slangValue = data.slang || (data.name ? data.name.replace(/\s+/g, '-').toLowerCase() : nanoid(6));

        // Upsert project
        const project = await prisma.project.upsert({
            where: { id: data.id || "" },
            update: {
                name: data.name,
                description: data.description,
                userId: user.id,
                status: data.status || "active",
                slang: slangValue,
            },
            create: {
                id: data.id,
                name: data.name,
                description: data.description,
                userId: user.id,
                status: data.status || "active",
                slang: slangValue,
            },
        });

        // پاک کردن همه featureها و آبجکت‌های تو در تو
        await prisma.feature.deleteMany({ where: { projectId: project.id } });

        // ایجاد featureها و آبجکت‌های تو در تو
        if (Array.isArray(data.features)) {
            for (const f of data.features) {
                // Normalize arrays for feature
                if (!Array.isArray(f.tags)) f.tags = [];
                if (f.background) {
                    if (!Array.isArray(f.background.steps)) f.background.steps = [];
                }
                if (f.scenarios && Array.isArray(f.scenarios)) {
                    for (const s of f.scenarios) {
                        if (!Array.isArray(s.tags)) s.tags = [];
                        if (!Array.isArray(s.steps)) s.steps = [];
                        if (s.examples) {
                            s.examples.headers = Array.isArray(s.examples.headers) ? s.examples.headers : [];
                            s.examples.rows = Array.isArray(s.examples.rows) ? s.examples.rows : [];
                            if (s.examples && Array.isArray(s.examples.rows)) {
                                s.examples.rows.forEach((row: any) => {
                                    row.values = Array.isArray(row.values) ? row.values : [];
                                });
                            }
                        }
                    }
                }
                if (f.rules && Array.isArray(f.rules)) {
                    for (const rule of f.rules) {
                        if (!Array.isArray(rule.tags)) rule.tags = [];
                        if (rule.scenarios && Array.isArray(rule.scenarios)) {
                            for (const s of rule.scenarios) {
                                if (!Array.isArray(s.tags)) s.tags = [];
                                if (!Array.isArray(s.steps)) s.steps = [];
                                if (s.examples) {
                                    s.examples.headers = Array.isArray(s.examples.headers) ? s.examples.headers : [];
                                    s.examples.rows = Array.isArray(s.examples.rows) ? s.examples.rows : [];
                                    if (s.examples && Array.isArray(s.examples.rows)) {
                                        s.examples.rows.forEach((row: any) => {
                                            row.values = Array.isArray(row.values) ? row.values : [];
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                // Validate feature
                if (!f.id || !f.name) {
                    console.error("Feature missing id or name", f);
                    return NextResponse.json({ error: `Feature missing id or name: ${JSON.stringify(f)}` }, { status: 400 });
                }
                // Validate scenarios
                if (f.scenarios && Array.isArray(f.scenarios)) {
                    for (const s of f.scenarios) {
                        if (!s.id || !s.name) {
                            console.error("Scenario missing id or name", s);
                            return NextResponse.json({ error: `Scenario missing id or name: ${JSON.stringify(s)}` }, { status: 400 });
                        }
                        if (s.steps && Array.isArray(s.steps)) {
                            for (const st of s.steps) {
                                if (!st.id || !st.keyword) {
                                    console.error("Step missing id or keyword", st);
                                    return NextResponse.json({ error: `Step missing id or keyword: ${JSON.stringify(st)}` }, { status: 400 });
                                }
                            }
                        }
                        if (s.examples) {
                            if (!s.examples.id) {
                                console.error("Examples missing id", s.examples);
                                return NextResponse.json({ error: `Examples missing id: ${JSON.stringify(s.examples)}` }, { status: 400 });
                            }
                        }
                    }
                }
                // Validate background
                if (f.background) {
                    if (!f.background.id) {
                        console.error("Background missing id", f.background);
                        return NextResponse.json({ error: `Background missing id: ${JSON.stringify(f.background)}` }, { status: 400 });
                    }
                    if (f.background.steps && Array.isArray(f.background.steps)) {
                        for (const st of f.background.steps) {
                            if (!st.id || !st.keyword) {
                                console.error("Background step missing id or keyword", st);
                                return NextResponse.json({ error: `Background step missing id or keyword: ${JSON.stringify(st)}` }, { status: 400 });
                            }
                        }
                    }
                }
                // Create feature
                await prisma.feature.create({
                    data: {
                        id: f.id,
                        name: f.name,
                        description: f.description,
                        tags: f.tags || [],
                        rulesJson: f.rules ? JSON.stringify(f.rules) : undefined,
                        order: f.order || 0,
                        projectId: project.id,
                        // بک‌گراند
                        background: f.background
                            ? {
                                create: {
                                    id: f.background.id,
                                    name: f.background.name,
                                    keyword: f.background.keyword,
                                    tags: f.background.tags || [],
                                    steps: {
                                        create: (f.background.steps || []).map((step: any) => ({
                                            id: step.id,
                                            keyword: step.keyword,
                                            text: step.text,
                                            argument: step.argument,
                                        })),
                                    },
                                },
                            }
                            : undefined,
                        // سناریوها
                        scenarios: f.scenarios
                            ? {
                                create: f.scenarios.map((s: any) => ({
                                    id: s.id,
                                    name: s.name,
                                    description: s.description,
                                    type: s.type,
                                    keyword: s.keyword,
                                    tags: s.tags || [],
                                    steps: {
                                        create: (s.steps || []).map((step: any) => ({
                                            id: step.id,
                                            keyword: step.keyword,
                                            text: step.text,
                                            argument: step.argument,
                                        })),
                                    },
                                    examples: s.examples
                                        ? {
                                            create: {
                                                id: s.examples.id,
                                                name: s.examples.name,
                                                description: s.examples.description,
                                                tags: s.examples.tags || [],
                                                header: s.examples.headers,
                                                body: s.examples.rows,
                                            },
                                        }
                                        : undefined,
                                })),
                            }
                            : undefined,
                    },
                });
            }
        }

        // Return the new/updated project with features
        const updatedProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                features: {
                    include: {
                        background: { include: { steps: true } },
                        scenarios: { include: { steps: true, examples: true } },
                    },
                },
            },
        });

        // Log project import activity
        await ActivityLogger.logProjectImported(user.id, project.id, project.name, data.features?.length || 0);

        return NextResponse.json(updatedProject);
    } catch (e: any) {
        console.error("Error importing project:", e, e?.meta || "");
        return NextResponse.json({ error: e?.message || "Internal server error", details: e?.meta }, { status: 500 });
    }
} 