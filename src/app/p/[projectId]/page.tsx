import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateShortCode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  // First try direct id
  const byId = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (byId) {
    redirect(`/projects/${byId.id}/view?tab=latest`);
  }

  // Otherwise resolve short code
  const allProjects = await prisma.project.findMany({ select: { id: true } });
  const match = allProjects.find(p => generateShortCode(p.id) === projectId);
  if (!match) return notFound();
  redirect(`/projects/${match.id}/view?tab=latest`);
}