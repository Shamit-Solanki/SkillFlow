import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { analyzeGaps, computeReadiness } from '@/lib/skill-engine';
import { generateRoadmap } from '@/lib/ai';
import { z } from 'zod';

const RecalculateSchema = z.object({
  userId: z.string(),
  targetRoleId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, targetRoleId } = RecalculateSchema.parse(body);

    let actualUserId = userId;
    if (userId === 'demo') {
      const demoUser = await prisma.user.findFirst({ where: { email: 'demo@skillflow.dev' } });
      if (!demoUser) return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
      actualUserId = demoUser.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: {
        userSkills: { include: { skill: true } },
        roadmaps: {
          include: { targetRole: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roleId = targetRoleId || user.roadmaps[0]?.targetRoleId;
    if (!roleId) {
      return NextResponse.json({ error: 'No target role specified' }, { status: 400 });
    }

    const targetRole = await prisma.targetRole.findUnique({ where: { id: roleId } });
    if (!targetRole) {
      return NextResponse.json({ error: 'Target role not found' }, { status: 404 });
    }

    // Load graph dependencies
    const allSkills = await prisma.skill.findMany();
    const prerequisites = await prisma.skillPrerequisite.findMany();
    const roleSkills = await prisma.roleSkill.findMany({ where: { roleId } });

    const gaps = analyzeGaps(
      allSkills.map((s) => ({ id: s.id, name: s.name, category: s.category })),
      user.userSkills.map((us) => ({ skillId: us.skillId, level: us.level })),
      roleSkills.map((rs) => ({
        skillId: rs.skillId,
        importance: rs.importance,
        minimumLevel: rs.minimumLevel,
      })),
      prerequisites.map((p) => ({
        skillId: p.skillId,
        prerequisiteId: p.prerequisiteId,
        strength: p.strength,
      }))
    );

    const readiness = computeReadiness(
      user.userSkills.map((us) => ({ skillId: us.skillId, level: us.level })),
      roleSkills.map((rs) => ({
        skillId: rs.skillId,
        importance: rs.importance,
        minimumLevel: rs.minimumLevel,
      }))
    );

    const nonMasteredGaps = gaps.filter((g) => g.status !== 'mastered');

    // Generate or synthesize updated roadmap
    let roadmapData;
    try {
      roadmapData = await generateRoadmap({
        targetRole: targetRole.name,
        gaps: nonMasteredGaps,
        userContext: {
          name: user.name,
          availableHoursPerWeek: user.availableHoursPerWeek,
          learningStyle: user.learningStyle,
          currentSkillsSummary: user.userSkills
            .map((us) => `${us.skill.name} (level ${us.level})`)
            .join(', '),
        },
      });
    } catch {
      // Deterministic fallback
      roadmapData = {
        title: `Adaptive Path to ${targetRole.name}`,
        summary: `Refreshed roadmap tailored to your ${nonMasteredGaps.length} remaining skill gaps.`,
        totalWeeks: Math.max(4, nonMasteredGaps.length * 2),
        milestones: [
          {
            title: 'Foundational Gaps',
            description: 'Strengthen essential prerequisites and fundamental skills.',
            weekStart: 1,
            weekEnd: 3,
            skills: nonMasteredGaps.slice(0, 3).map((g) => ({
              skillName: g.skillName,
              priority: g.priority,
              reason: g.reason,
            })),
            project: {
              title: `${targetRole.name} Core Project`,
              description: 'Build a practical portfolio application exercising your next target skills.',
              skillsCovered: nonMasteredGaps.slice(0, 3).map((g) => g.skillName),
              difficulty: 'intermediate' as const,
              estimatedHours: 20,
            },
          },
          {
            title: 'Role Specialization & Production Delivery',
            description: 'Advanced patterns and production workflows for the target role.',
            weekStart: 4,
            weekEnd: 6,
            skills: nonMasteredGaps.slice(3, 8).map((g) => ({
              skillName: g.skillName,
              priority: g.priority,
              reason: g.reason,
            })),
            project: {
              title: `${targetRole.name} Capstone Project`,
              description: 'Full-stack application deployed to cloud with automated CI/CD and tests.',
              skillsCovered: nonMasteredGaps.slice(3, 6).map((g) => g.skillName),
              difficulty: 'advanced' as const,
              estimatedHours: 35,
            },
          },
        ],
      };
    }

    // Save updated roadmap
    await prisma.roadmap.deleteMany({
      where: { userId: actualUserId, targetRoleId: roleId },
    });

    const newRoadmap = await prisma.roadmap.create({
      data: {
        userId: actualUserId,
        targetRoleId: roleId,
        title: roadmapData.title,
        summary: roadmapData.summary,
        totalWeeks: roadmapData.totalWeeks,
        status: 'active',
      },
    });

    const skillNameToId = new Map(allSkills.map((s) => [s.name.toLowerCase(), s.id]));

    for (let i = 0; i < roadmapData.milestones.length; i++) {
      const ms = roadmapData.milestones[i];
      const milestone = await prisma.milestone.create({
        data: {
          roadmapId: newRoadmap.id,
          title: ms.title,
          description: ms.description,
          order: i,
          weekStart: ms.weekStart,
          weekEnd: ms.weekEnd,
          status: 'not_started',
        },
      });

      for (let j = 0; j < ms.skills.length; j++) {
        const sk = ms.skills[j];
        let skillId = skillNameToId.get(sk.skillName.toLowerCase());
        if (!skillId) {
          const newSkill = await prisma.skill.create({
            data: {
              name: sk.skillName,
              normalizedName: sk.skillName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
              category: 'ai-generated',
            },
          });
          skillId = newSkill.id;
          skillNameToId.set(sk.skillName.toLowerCase(), skillId);
        }

        await prisma.roadmapItem.create({
          data: {
            milestoneId: milestone.id,
            skillId,
            priority: sk.priority,
            reason: sk.reason,
            projectTitle: ms.project?.title || '',
            projectDescription: ms.project?.description || '',
            order: j,
            status: 'not_started',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      roadmapId: newRoadmap.id,
      readiness,
      gapCount: nonMasteredGaps.length,
    });
  } catch (error: any) {
    console.error('Roadmap recalculation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to recalculate roadmap' },
      { status: 500 }
    );
  }
}
