import { GoogleGenAI } from '@google/genai';
import {
  SkillExtractionResultSchema,
  RoadmapGenerationResultSchema,
  type SkillExtractionResult,
  type RoadmapGenerationResult,
  type GapItem,
} from '@/types';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env file.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * AI Call 1: Extract and normalize skills from user-provided text.
 * Input: User's bio, resume, project descriptions, etc.
 * Output: Structured list of skills with estimated proficiency levels.
 */
export async function extractSkills(userInput: {
  bio?: string;
  resumeText?: string;
  skills?: string[];
  projects?: string;
  experience?: string;
}): Promise<SkillExtractionResult> {
  const ai = getClient();

  const prompt = `You are a technical career advisor and skill assessor.

Analyze the following user information and extract ALL technical skills they possess.
For each skill, estimate their proficiency level on a scale of 0-5:
- 0 = No knowledge
- 1 = Beginner (heard of it, minimal practice)
- 2 = Familiar (some hands-on experience, needs guidance)
- 3 = Proficient (can work independently on standard tasks)
- 4 = Advanced (deep knowledge, can handle complex scenarios)
- 5 = Expert (can teach others, architectural decisions)

Use CANONICAL skill names. For example:
- Use "JavaScript" not "JS" or "vanilla js"
- Use "React" not "ReactJS" or "React.js"
- Use "Node.js" not "NodeJS" or "node"
- Use "SQL & Databases" not "MySQL" or "PostgreSQL" (unless specifically advanced)
- Use "Git & Version Control" not "git" or "github"
- Use "Programming Fundamentals" for general coding ability
- Use "REST APIs" not "API development"
- Use "Docker" not "containerization"
- Use "CI/CD" not "continuous integration"
- Use "Cloud Services (AWS/GCP)" not specific cloud provider names
- Use "Linux & Command Line" not "bash" or "terminal"
- Use "Machine Learning Basics" not "ML"

Be thorough but honest. Only assign levels supported by evidence.

USER INFORMATION:
${userInput.bio ? `Bio: ${userInput.bio}` : ''}
${userInput.resumeText ? `Resume: ${userInput.resumeText}` : ''}
${userInput.skills?.length ? `Self-reported skills: ${userInput.skills.join(', ')}` : ''}
${userInput.projects ? `Projects: ${userInput.projects}` : ''}
${userInput.experience ? `Experience: ${userInput.experience}` : ''}
`;

  const zodSchema = SkillExtractionResultSchema;
  const jsonSchema = zodToGeminiSchema(zodSchema);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI');

  const parsed = JSON.parse(text);
  return SkillExtractionResultSchema.parse(parsed);
}

/**
 * AI Call 2: Generate a personalized roadmap with milestones and project recommendations.
 * Input: Gap analysis results + user preferences.
 * Output: Structured roadmap with milestones, skills per milestone, and projects.
 */
export async function generateRoadmap(input: {
  targetRole: string;
  gaps: GapItem[];
  userContext: {
    name: string;
    availableHoursPerWeek: number;
    learningStyle: string;
    currentSkillsSummary: string;
  };
}): Promise<RoadmapGenerationResult> {
  const ai = getClient();

  const gapsSummary = input.gaps
    .map(
      (g) =>
        `- ${g.skillName}: current level ${g.currentLevel}/5, needs ${g.requiredLevel}/5, status: ${g.status}, priority: ${g.priority}`
    )
    .join('\n');

  const prompt = `You are an expert career coach and technical learning path designer.

Create a personalized learning roadmap for a student working toward becoming a ${input.targetRole}.

STUDENT PROFILE:
- Name: ${input.userContext.name}
- Available time: ${input.userContext.availableHoursPerWeek} hours per week
- Learning style preference: ${input.userContext.learningStyle}
- Current skills summary: ${input.userContext.currentSkillsSummary}

SKILL GAPS TO ADDRESS:
${gapsSummary}

INSTRUCTIONS:
1. Create 3-6 milestones ordered logically (prerequisites before dependents).
2. Each milestone should span 1-4 weeks and group related skills.
3. Prioritize critical and high-priority gaps in earlier milestones.
4. Each milestone MUST include exactly one hands-on project that practices the milestone's skills.
5. Projects should be practical, portfolio-worthy, and progressively more complex.
6. Estimate total weeks based on the student's available hours.
7. The roadmap title should be motivating and specific to their journey.
8. Use the EXACT skill names from the gap analysis.

IMPORTANT: Only include skills from the gap analysis that have status "missing" or "partial". Do NOT include mastered skills.`;

  const jsonSchema = zodToGeminiSchema(RoadmapGenerationResultSchema);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from AI');

  const parsed = JSON.parse(text);
  return RoadmapGenerationResultSchema.parse(parsed);
}

/**
 * Convert Zod schema to a Gemini-compatible JSON schema.
 * Gemini uses a subset of OpenAPI 3.0 schema.
 */
function zodToGeminiSchema(zodSchema: any): any {
  const jsonSchema = zodSchemaToJsonSchema(zodSchema);
  return cleanForGemini(jsonSchema);
}

function zodSchemaToJsonSchema(schema: any): any {
  // Use Zod's built-in JSON schema generation approach
  // We manually map the Zod types we use
  const def = schema._def;

  if (!def) return { type: 'STRING' };

  switch (def.typeName) {
    case 'ZodString':
      return { type: 'STRING', description: def.description };
    case 'ZodNumber':
      const numSchema: any = { type: 'NUMBER', description: def.description };
      for (const check of def.checks || []) {
        if (check.kind === 'min') numSchema.minimum = check.value;
        if (check.kind === 'max') numSchema.maximum = check.value;
      }
      return numSchema;
    case 'ZodEnum':
      return { type: 'STRING', enum: def.values, description: def.description };
    case 'ZodArray':
      return {
        type: 'ARRAY',
        items: zodSchemaToJsonSchema(def.type),
        description: def.description,
      };
    case 'ZodObject': {
      const properties: any = {};
      const required: string[] = [];
      const shape = def.shape();
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodSchemaToJsonSchema(value);
        // Check if field is optional
        const fieldDef = (value as any)?._def;
        if (fieldDef?.typeName !== 'ZodOptional') {
          required.push(key);
        }
      }
      return {
        type: 'OBJECT',
        properties,
        required,
        description: def.description,
      };
    }
    case 'ZodOptional':
      return zodSchemaToJsonSchema(def.innerType);
    case 'ZodDefault':
      return zodSchemaToJsonSchema(def.innerType);
    case 'ZodEffects':
      return zodSchemaToJsonSchema(def.schema);
    default:
      return { type: 'STRING' };
  }
}

function cleanForGemini(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;

  const cleaned: any = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === '$schema' || key === 'additionalProperties' || key === '$ref') continue;
    if (value === undefined || value === null) continue;
    if (key === 'description' && !value) continue;
    if (Array.isArray(value)) {
      cleaned[key] = value.map((item: any) =>
        typeof item === 'object' ? cleanForGemini(item) : item
      );
    } else if (typeof value === 'object') {
      cleaned[key] = cleanForGemini(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
