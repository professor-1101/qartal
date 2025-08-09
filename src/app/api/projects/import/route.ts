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

        // SECURITY FIX: Always generate new unique ID and slang for imports
        // This prevents hijacking existing projects by importing with same ID
        const newProjectId = nanoid();
        const baseSlang = data.name ? data.name.replace(/\s+/g, '-').toLowerCase() : 'imported-project';
        let slangValue = baseSlang;
        
        // Ensure slang is unique
        let counter = 1;
        while (await prisma.project.findUnique({ where: { slang: slangValue } })) {
            slangValue = `${baseSlang}-${counter}`;
            counter++;
        }

        // Always CREATE new project (never update existing ones for security)
        const project = await prisma.project.create({
            data: {
                id: newProjectId,
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
                        id: nanoid(), // Generate new ID for security
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
                                    id: nanoid(),
                                    name: f.background.name,
                                    keyword: f.background.keyword,
                                    tags: f.background.tags || [],
                                    steps: {
                                        create: (f.background.steps || []).map((step: any) => ({
                                            id: nanoid(),
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
                                    id: nanoid(),
                                    name: s.name,
                                    description: s.description,
                                    type: s.type,
                                    keyword: s.keyword,
                                    tags: s.tags || [],
                                    steps: {
                                        create: (s.steps || []).map((step: any) => ({
                                            id: nanoid(),
                                            keyword: step.keyword,
                                            text: step.text,
                                            argument: step.argument,
                                        })),
                                    },
                                    examples: s.examples
                                        ? {
                                            create: {
                                                id: nanoid(),
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

        // Create initial version using exportInfo if available, otherwise default to 1.0.0
        const exportInfo = data.exportInfo;
        const versionToCreate = exportInfo?.version || "1.0.0";
        const [major, minor, patch] = versionToCreate.split('.').map(Number);
        
        await prisma.projectVersion.create({
            data: {
                projectId: project.id,
                version: versionToCreate,
                major: major || 1,
                minor: minor || 0,
                patch: patch || 0,
                status: 'PENDING',
                releaseNotes: exportInfo?.releaseNotes || `پروژه import شده با ${data.features?.length || 0} ویژگی`,
                snapshotData: updatedProject as any,
                createdById: user.id
            }
        });

        // Log project import activity
        await ActivityLogger.logProjectImported(user.id, project.id, project.name, data.features?.length || 0);

        return NextResponse.json(updatedProject);
    } catch (e: any) {
        console.error("Error importing project:", e, e?.meta || "");
        return NextResponse.json({ error: e?.message || "Internal server error", details: e?.meta }, { status: 500 });
    }
} 