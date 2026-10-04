import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const UpdateSkillSchema = z.object({
  userId: z.string(),
  skillId: z.string(),
  level: z.number().min(0).max(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, skillId, level } = UpdateSkillSchema.parse(body);

    let actualUserId = userId;
    if (userId === 'demo') {
      const demoUser = await prisma.user.findFirst({ where: { email: 'demo@skillflow.dev' } });
      if (!demoUser) return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
      actualUserId = demoUser.id;
    }

    const updated = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: actualUserId,
          skillId,
        },
      },
      update: { level },
      create: {
        userId: actualUserId,
        skillId,
        level,
        source: 'manual-update',
      },
      include: {
        skill: true,
      },
    });

    return NextResponse.json({ success: true, skill: updated });
  } catch (error: any) {
    console.error('Skill update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update user skill' },
      { status: 500 }
    );
  }
}
