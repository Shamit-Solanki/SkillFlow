import type { GapItem, SkillNode, SkillEdge, SkillGraphData } from '@/types';

interface SkillData {
  id: string;
  name: string;
  category: string;
}

interface PrerequisiteData {
  skillId: string;
  prerequisiteId: string;
  strength: string;
}

interface UserSkillData {
  skillId: string;
  level: number;
}

interface RoleSkillData {
  skillId: string;
  importance: string;
  minimumLevel: number;
}

/**
 * Build an adjacency list representation of the skill DAG.
 * Returns: { adjacency: Map<skillId, prerequisiteIds[]>, reverse: Map<skillId, dependentIds[]> }
 */
export function buildSkillDAG(prerequisites: PrerequisiteData[]) {
  const adjacency = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();

  for (const p of prerequisites) {
    if (!adjacency.has(p.skillId)) adjacency.set(p.skillId, []);
    adjacency.get(p.skillId)!.push(p.prerequisiteId);

    if (!reverse.has(p.prerequisiteId)) reverse.set(p.prerequisiteId, []);
    reverse.get(p.prerequisiteId)!.push(p.skillId);
  }

  return { adjacency, reverse };
}

/**
 * Deterministic gap analysis:
 * Compare user skills against role requirements to find gaps.
 * This is pure application logic — no AI needed.
 */
export function analyzeGaps(
  allSkills: SkillData[],
  userSkills: UserSkillData[],
  roleSkills: RoleSkillData[],
  prerequisites: PrerequisiteData[]
): GapItem[] {
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));
  const userSkillMap = new Map(userSkills.map((us) => [us.skillId, us.level]));
  const { adjacency } = buildSkillDAG(prerequisites);

  const gaps: GapItem[] = [];

  for (const rs of roleSkills) {
    const skill = skillMap.get(rs.skillId);
    if (!skill) continue;

    const currentLevel = userSkillMap.get(rs.skillId) ?? 0;
    const requiredLevel = rs.minimumLevel;

    let status: 'mastered' | 'partial' | 'missing';
    if (currentLevel >= requiredLevel) {
      status = 'mastered';
    } else if (currentLevel > 0) {
      status = 'partial';
    } else {
      status = 'missing';
    }

    // Priority based on importance and gap size
    let priority: 'critical' | 'high' | 'medium' | 'low';
    const gapSize = requiredLevel - currentLevel;
    if (rs.importance === 'required' && gapSize >= 3) {
      priority = 'critical';
    } else if (rs.importance === 'required' && gapSize >= 1) {
      priority = 'high';
    } else if (rs.importance === 'recommended') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Get prerequisite names
    const prereqIds = adjacency.get(rs.skillId) ?? [];
    const prereqNames = prereqIds
      .map((pid) => skillMap.get(pid)?.name)
      .filter(Boolean) as string[];

    // Generate reason
    let reason = '';
    if (status === 'mastered') {
      reason = `Already proficient at level ${currentLevel}/${requiredLevel}`;
    } else if (status === 'partial') {
      reason = `At level ${currentLevel}, needs level ${requiredLevel}. ${rs.importance === 'required' ? 'Required' : 'Recommended'} for target role.`;
    } else {
      reason = `Not yet started. ${rs.importance === 'required' ? 'Required' : 'Recommended'} for target role. ${prereqNames.length > 0 ? `Build on: ${prereqNames.join(', ')}` : 'No prerequisites.'}`;
    }

    gaps.push({
      skillName: skill.name,
      currentLevel,
      requiredLevel,
      status,
      priority,
      reason,
      prerequisites: prereqNames,
    });
  }

  // Sort by priority then gap size
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return (b.requiredLevel - b.currentLevel) - (a.requiredLevel - a.currentLevel);
  });

  return gaps;
}

/**
 * Compute overall readiness percentage.
 */
export function computeReadiness(
  userSkills: UserSkillData[],
  roleSkills: RoleSkillData[]
): number {
  if (roleSkills.length === 0) return 0;

  const userSkillMap = new Map(userSkills.map((us) => [us.skillId, us.level]));
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const rs of roleSkills) {
    const weight = rs.importance === 'required' ? 2 : 1;
    totalPoints += rs.minimumLevel * weight;
    const userLevel = Math.min(userSkillMap.get(rs.skillId) ?? 0, rs.minimumLevel);
    earnedPoints += userLevel * weight;
  }

  return Math.round((earnedPoints / totalPoints) * 100);
}

/**
 * Topological sort of skills based on prerequisites.
 * Returns skills in learning order (prerequisites first).
 */
export function topologicalSort(
  skillIds: string[],
  prerequisites: PrerequisiteData[]
): string[] {
  const { adjacency } = buildSkillDAG(prerequisites);
  const skillSet = new Set(skillIds);

  // Kahn's algorithm
  const inDegree = new Map<string, number>();
  for (const id of skillIds) {
    inDegree.set(id, 0);
  }

  for (const id of skillIds) {
    const prereqs = adjacency.get(id) ?? [];
    for (const prereq of prereqs) {
      if (skillSet.has(prereq)) {
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    // Find skills that depend on current
    for (const id of skillIds) {
      const prereqs = adjacency.get(id) ?? [];
      if (prereqs.includes(current) && skillSet.has(id)) {
        inDegree.set(id, (inDegree.get(id) ?? 0) - 1);
        if (inDegree.get(id) === 0) {
          queue.push(id);
        }
      }
    }
  }

  // Add any remaining (cycle or disconnected)
  for (const id of skillIds) {
    if (!sorted.includes(id)) sorted.push(id);
  }

  return sorted;
}

/**
 * Determine what to learn next: skills whose prerequisites are all met.
 */
export function getNextSkills(
  gaps: GapItem[],
  prerequisites: PrerequisiteData[],
  allSkills: SkillData[],
  userSkills: UserSkillData[]
): GapItem[] {
  const userSkillMap = new Map(userSkills.map((us) => [us.skillId, us.level]));
  const nameToId = new Map(allSkills.map((s) => [s.name, s.id]));
  const { adjacency } = buildSkillDAG(prerequisites);

  const unmasteredGaps = gaps.filter((g) => g.status !== 'mastered');

  return unmasteredGaps.filter((gap) => {
    const skillId = nameToId.get(gap.skillName);
    if (!skillId) return true; // No ID match, include by default

    const prereqIds = adjacency.get(skillId) ?? [];
    // All prerequisites must be at least level 2 (familiar)
    return prereqIds.every((prereqId) => (userSkillMap.get(prereqId) ?? 0) >= 2);
  });
}

/**
 * Build the visual skill graph data structure for React Flow.
 */
export function buildSkillGraphData(
  allSkills: SkillData[],
  prerequisites: PrerequisiteData[],
  userSkills: UserSkillData[],
  roleSkills: RoleSkillData[]
): SkillGraphData {
  const userSkillMap = new Map(userSkills.map((us) => [us.skillId, us.level]));
  const roleSkillMap = new Map(roleSkills.map((rs) => [rs.skillId, rs]));
  const { adjacency, reverse } = buildSkillDAG(prerequisites);

  // Only include skills that are relevant to the role + their prerequisites
  const relevantSkillIds = new Set<string>();
  for (const rs of roleSkills) {
    relevantSkillIds.add(rs.skillId);
    // Add prerequisites recursively
    const addPrereqs = (id: string) => {
      const prereqs = adjacency.get(id) ?? [];
      for (const p of prereqs) {
        if (!relevantSkillIds.has(p)) {
          relevantSkillIds.add(p);
          addPrereqs(p);
        }
      }
    };
    addPrereqs(rs.skillId);
  }

  const nodes: SkillNode[] = [];
  for (const skill of allSkills) {
    if (!relevantSkillIds.has(skill.id)) continue;

    const userLevel = userSkillMap.get(skill.id) ?? 0;
    const roleSkill = roleSkillMap.get(skill.id);

    let status: 'mastered' | 'partial' | 'missing' | 'not_required';
    if (!roleSkill) {
      status = userLevel >= 2 ? 'mastered' : 'not_required';
    } else if (userLevel >= roleSkill.minimumLevel) {
      status = 'mastered';
    } else if (userLevel > 0) {
      status = 'partial';
    } else {
      status = 'missing';
    }

    const prereqIds = adjacency.get(skill.id) ?? [];
    const dependentIds = reverse.get(skill.id) ?? [];
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    nodes.push({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      level: userLevel,
      status,
      priority: roleSkill?.importance ?? 'none',
      prerequisites: prereqIds.map((id) => skillMap.get(id) ?? '').filter(Boolean),
      dependents: dependentIds.map((id) => skillMap.get(id) ?? '').filter(Boolean),
    });
  }

  const edges: SkillEdge[] = [];
  for (const p of prerequisites) {
    if (relevantSkillIds.has(p.skillId) && relevantSkillIds.has(p.prerequisiteId)) {
      edges.push({
        source: p.prerequisiteId,
        target: p.skillId,
        strength: p.strength,
      });
    }
  }

  return { nodes, edges };
}
