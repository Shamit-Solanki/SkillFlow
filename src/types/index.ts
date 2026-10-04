import { z } from 'zod';

// Skill levels: 0 = none, 1 = beginner, 2 = familiar, 3 = proficient, 4 = advanced, 5 = expert
export const SKILL_LEVELS = [
  { value: 0, label: 'None', color: '#6b7280' },
  { value: 1, label: 'Beginner', color: '#ef4444' },
  { value: 2, label: 'Familiar', color: '#f97316' },
  { value: 3, label: 'Proficient', color: '#eab308' },
  { value: 4, label: 'Advanced', color: '#22c55e' },
  { value: 5, label: 'Expert', color: '#06b6d4' },
] as const;

export const SKILL_STATUS = {
  MASTERED: 'mastered',
  PARTIAL: 'partial',
  MISSING: 'missing',
} as const;

export const PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const IMPORTANCE = {
  REQUIRED: 'required',
  RECOMMENDED: 'recommended',
  NICE_TO_HAVE: 'nice_to_have',
} as const;

export const ITEM_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

// --- AI Structured Output Schemas ---

export const ExtractedSkillSchema = z.object({
  name: z.string().describe('Canonical name of the skill'),
  estimatedLevel: z.number().min(0).max(5).describe('Estimated proficiency: 0=none, 1=beginner, 2=familiar, 3=proficient, 4=advanced, 5=expert'),
  evidence: z.string().describe('Brief justification for the estimated level'),
});

export const SkillExtractionResultSchema = z.object({
  skills: z.array(ExtractedSkillSchema),
  summary: z.string().describe('Brief summary of the user profile'),
});

export const GapItemSchema = z.object({
  skillName: z.string(),
  currentLevel: z.number().min(0).max(5),
  requiredLevel: z.number().min(0).max(5),
  status: z.enum(['mastered', 'partial', 'missing']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  reason: z.string(),
  prerequisites: z.array(z.string()),
});

export const GapAnalysisResultSchema = z.object({
  gaps: z.array(GapItemSchema),
  overallReadiness: z.number().min(0).max(100).describe('Percentage readiness for the target role'),
  summary: z.string(),
});

export const ProjectRecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  skillsCovered: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number(),
});

export const MilestoneGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  weekStart: z.number(),
  weekEnd: z.number(),
  skills: z.array(z.object({
    skillName: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    reason: z.string(),
  })),
  project: ProjectRecommendationSchema,
});

export const RoadmapGenerationResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  totalWeeks: z.number(),
  milestones: z.array(MilestoneGenerationSchema),
});

// Inferred types
export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;
export type SkillExtractionResult = z.infer<typeof SkillExtractionResultSchema>;
export type GapItem = z.infer<typeof GapItemSchema>;
export type GapAnalysisResult = z.infer<typeof GapAnalysisResultSchema>;
export type ProjectRecommendation = z.infer<typeof ProjectRecommendationSchema>;
export type MilestoneGeneration = z.infer<typeof MilestoneGenerationSchema>;
export type RoadmapGenerationResult = z.infer<typeof RoadmapGenerationResultSchema>;

// UI types
export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number;
  status: 'mastered' | 'partial' | 'missing' | 'not_required';
  priority: string;
  prerequisites: string[];
  dependents: string[];
}

export interface SkillEdge {
  source: string;
  target: string;
  strength: string;
}

export interface SkillGraphData {
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export interface RoadmapView {
  id: string;
  title: string;
  summary: string;
  targetRole: string;
  totalWeeks: number;
  status: string;
  overallProgress: number;
  milestones: MilestoneView[];
}

export interface MilestoneView {
  id: string;
  title: string;
  description: string;
  order: number;
  weekStart: number;
  weekEnd: number;
  status: string;
  progress: number;
  items: RoadmapItemView[];
}

export interface RoadmapItemView {
  id: string;
  skillName: string;
  skillId: string;
  status: string;
  priority: string;
  reason: string;
  projectTitle: string;
  projectDescription: string;
  order: number;
}
