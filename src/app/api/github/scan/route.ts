import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubProfile } from '@/lib/github';
import prisma from '@/lib/db';
import { z } from 'zod';

const ScanRequestSchema = z.object({
  username: z.string().min(1, 'GitHub username or URL is required'),
  userId: z.string().optional(),
  autoSync: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, userId, autoSync } = ScanRequestSchema.parse(body);

    const analysis = await analyzeGitHubProfile(username);

    // If userId provided and autoSync is requested, persist skills and GitHub link to DB
    if (userId && autoSync) {
      let actualUserId = userId;
      if (userId === 'demo') {
        const demoUser = await prisma.user.findFirst({ where: { email: 'demo@skillflow.dev' } });
        if (demoUser) actualUserId = demoUser.id;
      }

      const allSkills = await prisma.skill.findMany();
      const skillNameToId = new Map(allSkills.map((s) => [s.name.toLowerCase(), s.id]));

      // Update user githubUrl
      await prisma.user.update({
        where: { id: actualUserId },
        data: {
          githubUrl: `https://github.com/${analysis.username}`,
        },
      });

      // Upsert detected skills
      for (const ds of analysis.detectedSkills) {
        let skillId = skillNameToId.get(ds.name.toLowerCase());
        if (!skillId) {
          const newSkill = await prisma.skill.create({
            data: {
              name: ds.name,
              normalizedName: ds.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
              category: 'github-extracted',
            },
          });
          skillId = newSkill.id;
          skillNameToId.set(ds.name.toLowerCase(), skillId);
        }

        const existingUserSkill = await prisma.userSkill.findUnique({
          where: { userId_skillId: { userId: actualUserId, skillId } },
        });

        if (!existingUserSkill) {
          await prisma.userSkill.create({
            data: {
              userId: actualUserId,
              skillId,
              level: ds.level,
              source: 'github-sync',
            },
          });
        } else if (existingUserSkill.level < ds.level) {
          // If GitHub provides evidence of higher level, upgrade
          await prisma.userSkill.update({
            where: { id: existingUserSkill.id },
            data: {
              level: ds.level,
              source: 'github-sync',
            },
          });
        }
      }
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('GitHub scan error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to scan GitHub profile' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
    }

    const analysis = await analyzeGitHubProfile(username);
    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to scan GitHub profile' },
      { status: 400 }
    );
  }
}
