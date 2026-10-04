import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const UpdateProgressSchema = z.object({
  itemId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, status } = UpdateProgressSchema.parse(body);

    const item = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: { status },
      include: {
        skill: true,
        milestone: {
          include: {
            roadmap: true,
            items: true,
          },
        },
      },
    });

    // If item completed, optionally level up the user's skill
    if (status === 'completed') {
      const userId = item.milestone.roadmap.userId;
      const existingSkill = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: item.skillId } },
      });
      
      if (existingSkill) {
        // Increase level by 1, max 5
        await prisma.userSkill.update({
          where: { id: existingSkill.id },
          data: { level: Math.min(existingSkill.level + 1, 5) },
        });
      } else {
        await prisma.userSkill.create({
          data: {
            userId,
            skillId: item.skillId,
            level: 2,
            source: 'completed-roadmap-item',
          },
        });
      }
    }

    // Check if milestone should be updated
    const milestoneItems = item.milestone.items;
    const allCompleted = milestoneItems.every(
      mi => mi.id === itemId ? status === 'completed' : mi.status === 'completed'
    );
    const anyInProgress = milestoneItems.some(
      mi => mi.id === itemId
        ? status === 'in_progress'
        : mi.status === 'in_progress' || mi.status === 'completed'
    );

    let milestoneStatus = 'not_started';
    if (allCompleted) milestoneStatus = 'completed';
    else if (anyInProgress) milestoneStatus = 'in_progress';

    await prisma.milestone.update({
      where: { id: item.milestoneId },
      data: { status: milestoneStatus },
    });

    return NextResponse.json({ success: true, item: { id: item.id, status } });
  } catch (error) {
    console.error('Progress update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
