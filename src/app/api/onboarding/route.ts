import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractSkills, generateRoadmap } from '@/lib/ai';
import { analyzeGaps, computeReadiness } from '@/lib/skill-engine';
import { z } from 'zod';

const OnboardingSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  bio: z.string().optional().default(''),
  skills: z.array(z.object({
    name: z.string(),
    level: z.number().min(0).max(5),
  })),
  targetRoleId: z.string().min(1),
  hoursPerWeek: z.number().min(1).max(40).optional().default(10),
  learningStyle: z.string().optional().default('balanced'),
  resumeText: z.string().optional().default(''),
  projects: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = OnboardingSchema.parse(body);

    // 1. Create or update user
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        bio: input.bio,
        resumeText: input.resumeText,
        availableHoursPerWeek: input.hoursPerWeek,
        learningStyle: input.learningStyle,
      },
      create: {
        email: input.email,
        name: input.name,
        bio: input.bio,
        resumeText: input.resumeText,
        availableHoursPerWeek: input.hoursPerWeek,
        learningStyle: input.learningStyle,
      },
    });

    // 2. Load all skills from DB
    const allSkills = await prisma.skill.findMany();
    const skillNameToId = new Map(allSkills.map(s => [s.name.toLowerCase(), s.id]));

    // 3. Save user skills - match against DB skills
    // First clear existing skills for this user
    await prisma.userSkill.deleteMany({ where: { userId: user.id } });

    // Try AI extraction if resume/bio/projects provided
    let allInputSkills = input.skills;
    
    const hasExtraContext = (input.resumeText && input.resumeText.length > 20) ||
                            (input.bio && input.bio.length > 20) ||
                            (input.projects && input.projects.length > 20);
    
    if (hasExtraContext) {
      try {
        const extracted = await extractSkills({
          bio: input.bio,
          resumeText: input.resumeText,
          skills: input.skills.map(s => s.name),
          projects: input.projects,
        });
        
        // Merge extracted skills with manually selected (manual takes precedence)
        const manualSkillNames = new Set(input.skills.map(s => s.name.toLowerCase()));
        for (const es of extracted.skills) {
          if (!manualSkillNames.has(es.name.toLowerCase())) {
            allInputSkills.push({ name: es.name, level: es.estimatedLevel });
          }
        }
      } catch (aiError) {
        console.error('AI skill extraction failed, using manual skills only:', aiError);
        // Continue with manual skills
      }
    }

    // Save skills to DB
    for (const skill of allInputSkills) {
      const skillId = skillNameToId.get(skill.name.toLowerCase());
      if (skillId) {
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId: user.id, skillId } },
          update: { level: skill.level },
          create: { userId: user.id, skillId, level: skill.level, source: 'onboarding' },
        });
      } else {
        // Create new skill if not in DB
        const newSkill = await prisma.skill.create({
          data: {
            name: skill.name,
            normalizedName: skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            category: 'user-added',
          },
        });
        await prisma.userSkill.create({
          data: { userId: user.id, skillId: newSkill.id, level: skill.level, source: 'onboarding' },
        });
      }
    }

    // 4. Get role skills and prerequisites
    const roleSkills = await prisma.roleSkill.findMany({
      where: { roleId: input.targetRoleId },
      include: { skill: true },
    });

    const prerequisites = await prisma.skillPrerequisite.findMany();
    const userSkills = await prisma.userSkill.findMany({ where: { userId: user.id } });
    const freshAllSkills = await prisma.skill.findMany();

    // 5. Deterministic gap analysis
    const gaps = analyzeGaps(
      freshAllSkills.map(s => ({ id: s.id, name: s.name, category: s.category })),
      userSkills.map(us => ({ skillId: us.skillId, level: us.level })),
      roleSkills.map(rs => ({ skillId: rs.skillId, importance: rs.importance, minimumLevel: rs.minimumLevel })),
      prerequisites.map(p => ({ skillId: p.skillId, prerequisiteId: p.prerequisiteId, strength: p.strength })),
    );

    const readiness = computeReadiness(
      userSkills.map(us => ({ skillId: us.skillId, level: us.level })),
      roleSkills.map(rs => ({ skillId: rs.skillId, importance: rs.importance, minimumLevel: rs.minimumLevel })),
    );

    // 6. AI roadmap generation
    const targetRoleData = await prisma.targetRole.findUnique({ where: { id: input.targetRoleId } });
    if (!targetRoleData) {
      return NextResponse.json({ error: 'Target role not found' }, { status: 404 });
    }

    const nonMasteredGaps = gaps.filter(g => g.status !== 'mastered');
    
    let roadmapData;
    try {
      roadmapData = await generateRoadmap({
        targetRole: targetRoleData.name,
        gaps: nonMasteredGaps,
        userContext: {
          name: input.name,
          availableHoursPerWeek: input.hoursPerWeek,
          learningStyle: input.learningStyle,
          currentSkillsSummary: allInputSkills.map(s => `${s.name} (level ${s.level})`).join(', '),
        },
      });
    } catch (aiError) {
      console.error('AI roadmap generation failed, creating basic roadmap:', aiError);
      // Fallback: create a basic roadmap from gaps
      roadmapData = {
        title: `Path to ${targetRoleData.name}`,
        summary: `Learning roadmap based on ${nonMasteredGaps.length} skill gaps identified.`,
        totalWeeks: Math.max(4, nonMasteredGaps.length * 2),
        milestones: [{
          title: 'Foundation Skills',
          description: 'Start with the fundamentals',
          weekStart: 1,
          weekEnd: Math.max(4, nonMasteredGaps.length * 2),
          skills: nonMasteredGaps.slice(0, 10).map(g => ({
            skillName: g.skillName,
            priority: g.priority,
            reason: g.reason,
          })),
          project: {
            title: 'Portfolio Project',
            description: 'Build a project that demonstrates the skills from this milestone',
            skillsCovered: nonMasteredGaps.slice(0, 5).map(g => g.skillName),
            difficulty: 'intermediate' as const,
            estimatedHours: 20,
          },
        }],
      };
    }

    // 7. Save roadmap to DB
    // Delete existing roadmaps for this user+role
    await prisma.roadmap.deleteMany({
      where: { userId: user.id, targetRoleId: input.targetRoleId },
    });

    const roadmap = await prisma.roadmap.create({
      data: {
        userId: user.id,
        targetRoleId: input.targetRoleId,
        title: roadmapData.title,
        summary: roadmapData.summary,
        totalWeeks: roadmapData.totalWeeks,
        status: 'active',
      },
    });

    // Reload skills for name-to-id mapping
    const finalSkills = await prisma.skill.findMany();
    const finalNameToId = new Map(finalSkills.map(s => [s.name.toLowerCase(), s.id]));

    // Save milestones and items
    for (let i = 0; i < roadmapData.milestones.length; i++) {
      const ms = roadmapData.milestones[i];
      const milestone = await prisma.milestone.create({
        data: {
          roadmapId: roadmap.id,
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
        let skillId = finalNameToId.get(sk.skillName.toLowerCase());
        
        if (!skillId) {
          // Create new skill
          const newSkill = await prisma.skill.create({
            data: {
              name: sk.skillName,
              normalizedName: sk.skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              category: 'ai-generated',
            },
          });
          skillId = newSkill.id;
          finalNameToId.set(sk.skillName.toLowerCase(), skillId);
        }

        await prisma.roadmapItem.create({
          data: {
            milestoneId: milestone.id,
            skillId,
            priority: sk.priority,
            reason: sk.reason,
            projectTitle: ms.project?.title ?? '',
            projectDescription: ms.project?.description ?? '',
            order: j,
            status: 'not_started',
          },
        });
      }
    }

    return NextResponse.json({
      userId: user.id,
      roadmapId: roadmap.id,
      readiness,
      gapCount: nonMasteredGaps.length,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
