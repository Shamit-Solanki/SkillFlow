import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { analyzeGaps, computeReadiness, buildSkillGraphData, getNextSkills } from '@/lib/skill-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Handle 'demo' userId
    let actualUserId = userId;
    if (userId === 'demo') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@skillflow.dev' },
      });
      if (!demoUser) {
        return NextResponse.json({ error: 'Demo user not found. Run prisma db seed.' }, { status: 404 });
      }
      actualUserId = demoUser.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: {
        userSkills: { include: { skill: true } },
        roadmaps: {
          include: {
            targetRole: true,
            milestones: {
              include: {
                items: { include: { skill: true } },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roadmap = user.roadmaps[0];
    if (!roadmap) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          availableHoursPerWeek: user.availableHoursPerWeek,
          learningStyle: user.learningStyle,
        },
        skills: user.userSkills.map(us => ({
          id: us.skill.id,
          name: us.skill.name,
          category: us.skill.category,
          level: us.level,
        })),
        roadmap: null,
        gaps: [],
        readiness: 0,
        skillGraph: { nodes: [], edges: [] },
        nextSkills: [],
      });
    }

    // Load all required data for analysis
    const allSkills = await prisma.skill.findMany();
    const prerequisites = await prisma.skillPrerequisite.findMany();
    const roleSkills = await prisma.roleSkill.findMany({
      where: { roleId: roadmap.targetRoleId },
    });

    const userSkillsData = user.userSkills.map(us => ({ skillId: us.skillId, level: us.level }));
    const roleSkillsData = roleSkills.map(rs => ({
      skillId: rs.skillId,
      importance: rs.importance,
      minimumLevel: rs.minimumLevel,
    }));
    const prereqData = prerequisites.map(p => ({
      skillId: p.skillId,
      prerequisiteId: p.prerequisiteId,
      strength: p.strength,
    }));
    const allSkillsData = allSkills.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
    }));

    // Deterministic computations
    const gaps = analyzeGaps(allSkillsData, userSkillsData, roleSkillsData, prereqData);
    const readiness = computeReadiness(userSkillsData, roleSkillsData);
    const skillGraph = buildSkillGraphData(allSkillsData, prereqData, userSkillsData, roleSkillsData);
    const nextSkills = getNextSkills(gaps, prereqData, allSkillsData, userSkillsData);

    // Calculate milestone progress
    const milestones = roadmap.milestones.map(ms => {
      const totalItems = ms.items.length;
      const completedItems = ms.items.filter(i => i.status === 'completed').length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        id: ms.id,
        title: ms.title,
        description: ms.description,
        order: ms.order,
        weekStart: ms.weekStart,
        weekEnd: ms.weekEnd,
        status: ms.status,
        progress,
        items: ms.items.map(item => ({
          id: item.id,
          skillName: item.skill.name,
          skillId: item.skillId,
          status: item.status,
          priority: item.priority,
          reason: item.reason,
          projectTitle: item.projectTitle,
          projectDescription: item.projectDescription,
          order: item.order,
        })),
      };
    });

    const totalItems = milestones.reduce((sum, ms) => sum + ms.items.length, 0);
    const completedItems = milestones.reduce(
      (sum, ms) => sum + ms.items.filter(i => i.status === 'completed').length,
      0
    );
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        availableHoursPerWeek: user.availableHoursPerWeek,
        learningStyle: user.learningStyle,
      },
      skills: user.userSkills.map(us => ({
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category,
        level: us.level,
      })),
      roadmap: {
        id: roadmap.id,
        title: roadmap.title,
        summary: roadmap.summary,
        targetRole: roadmap.targetRole.name,
        totalWeeks: roadmap.totalWeeks,
        status: roadmap.status,
        overallProgress,
        milestones,
      },
      gaps,
      readiness,
      skillGraph,
      nextSkills: nextSkills.slice(0, 5),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
