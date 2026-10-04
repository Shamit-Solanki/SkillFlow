import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const skills = [
  // Programming Fundamentals
  { name: 'Programming Fundamentals', category: 'fundamentals', description: 'Core programming concepts: variables, loops, functions, OOP' },
  { name: 'Data Structures', category: 'fundamentals', description: 'Arrays, linked lists, stacks, queues, trees, graphs' },
  { name: 'Algorithms', category: 'fundamentals', description: 'Sorting, searching, dynamic programming, greedy algorithms' },
  { name: 'Git & Version Control', category: 'tools', description: 'Git workflows, branching, merging, pull requests' },
  
  // Frontend
  { name: 'HTML', category: 'frontend', description: 'Semantic HTML, accessibility, forms' },
  { name: 'CSS', category: 'frontend', description: 'Layouts, flexbox, grid, responsive design, animations' },
  { name: 'JavaScript', category: 'frontend', description: 'ES6+, async/await, DOM manipulation, closures, prototypes' },
  { name: 'TypeScript', category: 'frontend', description: 'Type system, generics, interfaces, utility types' },
  { name: 'React', category: 'frontend', description: 'Components, hooks, state management, context, effects' },
  { name: 'Next.js', category: 'frontend', description: 'SSR, SSG, API routes, App Router, middleware' },
  { name: 'Tailwind CSS', category: 'frontend', description: 'Utility-first CSS framework, responsive design' },
  { name: 'UI/UX Design Basics', category: 'frontend', description: 'Design principles, wireframing, prototyping, user research' },
  
  // Backend
  { name: 'Node.js', category: 'backend', description: 'Server-side JavaScript, event loop, streams, modules' },
  { name: 'Python', category: 'backend', description: 'Python programming, pip, virtual environments' },
  { name: 'REST APIs', category: 'backend', description: 'RESTful design, HTTP methods, status codes, CRUD' },
  { name: 'GraphQL', category: 'backend', description: 'Queries, mutations, subscriptions, schema design' },
  { name: 'SQL & Databases', category: 'backend', description: 'SQL queries, joins, indexing, normalization' },
  { name: 'NoSQL Databases', category: 'backend', description: 'MongoDB, document stores, key-value stores' },
  { name: 'Authentication & Security', category: 'backend', description: 'OAuth, JWT, encryption, OWASP, CORS' },
  { name: 'Testing', category: 'backend', description: 'Unit testing, integration testing, TDD, test frameworks' },
  
  // DevOps
  { name: 'Linux & Command Line', category: 'devops', description: 'Shell scripting, file system, processes, permissions' },
  { name: 'Docker', category: 'devops', description: 'Containers, images, Dockerfile, docker-compose' },
  { name: 'CI/CD', category: 'devops', description: 'GitHub Actions, Jenkins, automated testing and deployment' },
  { name: 'Cloud Services (AWS/GCP)', category: 'devops', description: 'Cloud computing, serverless, storage, compute, networking' },
  { name: 'Kubernetes', category: 'devops', description: 'Container orchestration, pods, services, deployments' },
  
  // Data / AI
  { name: 'Machine Learning Basics', category: 'data', description: 'Supervised/unsupervised learning, model training, evaluation' },
  { name: 'Deep Learning', category: 'data', description: 'Neural networks, CNNs, RNNs, transformers' },
  { name: 'Data Analysis', category: 'data', description: 'Pandas, NumPy, data cleaning, visualization' },
  { name: 'Statistics & Probability', category: 'data', description: 'Distributions, hypothesis testing, regression, Bayesian inference' },
  
  // System Design
  { name: 'System Design', category: 'architecture', description: 'Scalability, load balancing, caching, microservices' },
  { name: 'API Design', category: 'architecture', description: 'API versioning, pagination, error handling, documentation' },
  { name: 'Networking Basics', category: 'fundamentals', description: 'TCP/IP, HTTP/HTTPS, DNS, ports, protocols' },
];

const prerequisites: [string, string][] = [
  // Frontend chain
  ['CSS', 'HTML'],
  ['JavaScript', 'Programming Fundamentals'],
  ['TypeScript', 'JavaScript'],
  ['React', 'JavaScript'],
  ['React', 'HTML'],
  ['React', 'CSS'],
  ['Next.js', 'React'],
  ['Next.js', 'Node.js'],
  ['Tailwind CSS', 'CSS'],
  ['Tailwind CSS', 'HTML'],
  
  // Backend chain
  ['Node.js', 'JavaScript'],
  ['REST APIs', 'Node.js'],
  ['REST APIs', 'Networking Basics'],
  ['GraphQL', 'REST APIs'],
  ['SQL & Databases', 'Programming Fundamentals'],
  ['NoSQL Databases', 'Programming Fundamentals'],
  ['Authentication & Security', 'REST APIs'],
  ['API Design', 'REST APIs'],
  
  // Fundamentals chain
  ['Data Structures', 'Programming Fundamentals'],
  ['Algorithms', 'Data Structures'],
  
  // DevOps chain
  ['Docker', 'Linux & Command Line'],
  ['CI/CD', 'Git & Version Control'],
  ['CI/CD', 'Testing'],
  ['Kubernetes', 'Docker'],
  ['Cloud Services (AWS/GCP)', 'Linux & Command Line'],
  ['Cloud Services (AWS/GCP)', 'Networking Basics'],
  
  // Data / AI chain
  ['Data Analysis', 'Python'],
  ['Data Analysis', 'Statistics & Probability'],
  ['Machine Learning Basics', 'Python'],
  ['Machine Learning Basics', 'Statistics & Probability'],
  ['Machine Learning Basics', 'Data Analysis'],
  ['Deep Learning', 'Machine Learning Basics'],
  
  // Testing
  ['Testing', 'Programming Fundamentals'],
  
  // System Design
  ['System Design', 'REST APIs'],
  ['System Design', 'SQL & Databases'],
];

const targetRoles = [
  {
    name: 'Frontend Developer',
    description: 'Build user interfaces and web applications with modern frameworks',
    category: 'engineering',
    skills: [
      { skillName: 'HTML', importance: 'required', minimumLevel: 4 },
      { skillName: 'CSS', importance: 'required', minimumLevel: 4 },
      { skillName: 'JavaScript', importance: 'required', minimumLevel: 4 },
      { skillName: 'TypeScript', importance: 'required', minimumLevel: 3 },
      { skillName: 'React', importance: 'required', minimumLevel: 4 },
      { skillName: 'Next.js', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'Tailwind CSS', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'Git & Version Control', importance: 'required', minimumLevel: 3 },
      { skillName: 'REST APIs', importance: 'required', minimumLevel: 3 },
      { skillName: 'Testing', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'UI/UX Design Basics', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Programming Fundamentals', importance: 'required', minimumLevel: 3 },
    ],
  },
  {
    name: 'Full Stack Developer',
    description: 'End-to-end web development from frontend to backend and deployment',
    category: 'engineering',
    skills: [
      { skillName: 'HTML', importance: 'required', minimumLevel: 3 },
      { skillName: 'CSS', importance: 'required', minimumLevel: 3 },
      { skillName: 'JavaScript', importance: 'required', minimumLevel: 4 },
      { skillName: 'TypeScript', importance: 'required', minimumLevel: 3 },
      { skillName: 'React', importance: 'required', minimumLevel: 3 },
      { skillName: 'Next.js', importance: 'required', minimumLevel: 3 },
      { skillName: 'Node.js', importance: 'required', minimumLevel: 4 },
      { skillName: 'REST APIs', importance: 'required', minimumLevel: 4 },
      { skillName: 'SQL & Databases', importance: 'required', minimumLevel: 3 },
      { skillName: 'Git & Version Control', importance: 'required', minimumLevel: 3 },
      { skillName: 'Docker', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Authentication & Security', importance: 'required', minimumLevel: 3 },
      { skillName: 'Testing', importance: 'required', minimumLevel: 3 },
      { skillName: 'CI/CD', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Programming Fundamentals', importance: 'required', minimumLevel: 3 },
      { skillName: 'System Design', importance: 'recommended', minimumLevel: 2 },
    ],
  },
  {
    name: 'Backend Developer',
    description: 'Server-side development, APIs, databases, and infrastructure',
    category: 'engineering',
    skills: [
      { skillName: 'Programming Fundamentals', importance: 'required', minimumLevel: 4 },
      { skillName: 'Node.js', importance: 'required', minimumLevel: 4 },
      { skillName: 'Python', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'REST APIs', importance: 'required', minimumLevel: 4 },
      { skillName: 'SQL & Databases', importance: 'required', minimumLevel: 4 },
      { skillName: 'NoSQL Databases', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'Authentication & Security', importance: 'required', minimumLevel: 4 },
      { skillName: 'Docker', importance: 'required', minimumLevel: 3 },
      { skillName: 'Linux & Command Line', importance: 'required', minimumLevel: 3 },
      { skillName: 'Testing', importance: 'required', minimumLevel: 3 },
      { skillName: 'Git & Version Control', importance: 'required', minimumLevel: 3 },
      { skillName: 'System Design', importance: 'required', minimumLevel: 3 },
      { skillName: 'API Design', importance: 'required', minimumLevel: 3 },
      { skillName: 'CI/CD', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Cloud Services (AWS/GCP)', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Networking Basics', importance: 'required', minimumLevel: 3 },
    ],
  },
  {
    name: 'ML Engineer',
    description: 'Build and deploy machine learning models and data pipelines',
    category: 'engineering',
    skills: [
      { skillName: 'Python', importance: 'required', minimumLevel: 4 },
      { skillName: 'Programming Fundamentals', importance: 'required', minimumLevel: 4 },
      { skillName: 'Statistics & Probability', importance: 'required', minimumLevel: 4 },
      { skillName: 'Data Analysis', importance: 'required', minimumLevel: 4 },
      { skillName: 'Machine Learning Basics', importance: 'required', minimumLevel: 4 },
      { skillName: 'Deep Learning', importance: 'required', minimumLevel: 3 },
      { skillName: 'SQL & Databases', importance: 'required', minimumLevel: 3 },
      { skillName: 'Docker', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Cloud Services (AWS/GCP)', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'Linux & Command Line', importance: 'required', minimumLevel: 3 },
      { skillName: 'Git & Version Control', importance: 'required', minimumLevel: 3 },
      { skillName: 'Data Structures', importance: 'required', minimumLevel: 3 },
      { skillName: 'Algorithms', importance: 'required', minimumLevel: 3 },
    ],
  },
  {
    name: 'DevOps Engineer',
    description: 'Infrastructure, CI/CD pipelines, containerization, and cloud platforms',
    category: 'engineering',
    skills: [
      { skillName: 'Linux & Command Line', importance: 'required', minimumLevel: 4 },
      { skillName: 'Docker', importance: 'required', minimumLevel: 4 },
      { skillName: 'Kubernetes', importance: 'required', minimumLevel: 3 },
      { skillName: 'CI/CD', importance: 'required', minimumLevel: 4 },
      { skillName: 'Cloud Services (AWS/GCP)', importance: 'required', minimumLevel: 4 },
      { skillName: 'Git & Version Control', importance: 'required', minimumLevel: 4 },
      { skillName: 'Networking Basics', importance: 'required', minimumLevel: 4 },
      { skillName: 'Python', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'Programming Fundamentals', importance: 'required', minimumLevel: 3 },
      { skillName: 'System Design', importance: 'required', minimumLevel: 3 },
      { skillName: 'Authentication & Security', importance: 'recommended', minimumLevel: 3 },
      { skillName: 'Testing', importance: 'recommended', minimumLevel: 2 },
      { skillName: 'SQL & Databases', importance: 'recommended', minimumLevel: 2 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.roadmapItem.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.roadmap.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.roleSkill.deleteMany();
  await prisma.skillPrerequisite.deleteMany();
  await prisma.targetRole.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();

  // Create skills
  const skillMap = new Map<string, string>();
  for (const skill of skills) {
    const created = await prisma.skill.create({
      data: {
        name: skill.name,
        normalizedName: skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        category: skill.category,
        description: skill.description,
      },
    });
    skillMap.set(skill.name, created.id);
  }
  console.log(`✅ Created ${skills.length} skills`);

  // Create prerequisites
  for (const [skillName, prereqName] of prerequisites) {
    const skillId = skillMap.get(skillName);
    const prereqId = skillMap.get(prereqName);
    if (skillId && prereqId) {
      await prisma.skillPrerequisite.create({
        data: { skillId, prerequisiteId: prereqId },
      });
    }
  }
  console.log(`✅ Created ${prerequisites.length} prerequisite relationships`);

  // Create target roles and their required skills
  for (const role of targetRoles) {
    const createdRole = await prisma.targetRole.create({
      data: {
        name: role.name,
        description: role.description,
        category: role.category,
      },
    });

    for (const rs of role.skills) {
      const skillId = skillMap.get(rs.skillName);
      if (skillId) {
        await prisma.roleSkill.create({
          data: {
            roleId: createdRole.id,
            skillId,
            importance: rs.importance,
            minimumLevel: rs.minimumLevel,
          },
        });
      }
    }
  }
  console.log(`✅ Created ${targetRoles.length} target roles with skill requirements`);

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@skillflow.dev',
      name: 'Demo User',
      bio: 'Computer science student interested in web development',
      availableHoursPerWeek: 15,
      learningStyle: 'project-based',
    },
  });

  // Add some skills to the demo user
  const demoSkills = [
    { name: 'Programming Fundamentals', level: 3 },
    { name: 'HTML', level: 3 },
    { name: 'CSS', level: 2 },
    { name: 'JavaScript', level: 2 },
    { name: 'Git & Version Control', level: 2 },
    { name: 'Python', level: 2 },
  ];

  for (const ds of demoSkills) {
    const skillId = skillMap.get(ds.name);
    if (skillId) {
      await prisma.userSkill.create({
        data: {
          userId: demoUser.id,
          skillId,
          level: ds.level,
          source: 'self-reported',
        },
      });
    }
  }
  console.log(`✅ Created demo user with ${demoSkills.length} skills`);

  // Create demo roadmap for Frontend Developer
  const frontendRole = await prisma.targetRole.findUnique({
    where: { name: 'Frontend Developer' },
  });

  if (frontendRole) {
    const demoRoadmap = await prisma.roadmap.create({
      data: {
        userId: demoUser.id,
        targetRoleId: frontendRole.id,
        title: 'Zero to Frontend Engineer',
        summary: 'Targeted path to advance from fundamentals to modern React & Next.js development.',
        totalWeeks: 8,
        status: 'active',
      },
    });

    const m1 = await prisma.milestone.create({
      data: {
        roadmapId: demoRoadmap.id,
        title: 'Modern JavaScript & TypeScript Mastery',
        description: 'Level up async JavaScript, closures, and strict typing with TypeScript.',
        order: 0,
        weekStart: 1,
        weekEnd: 3,
        status: 'in_progress',
      },
    });

    const jsSkillId = skillMap.get('JavaScript');
    const tsSkillId = skillMap.get('TypeScript');
    if (jsSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m1.id,
          skillId: jsSkillId,
          priority: 'critical',
          reason: 'Master ES6+, Promises, and Event Loop for frontend frameworks.',
          projectTitle: 'Interactive Kanban Board',
          projectDescription: 'Build a drag-and-drop task board with state persistence in localStorage.',
          order: 0,
          status: 'completed',
        },
      });
    }
    if (tsSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m1.id,
          skillId: tsSkillId,
          priority: 'critical',
          reason: 'TypeScript is required for enterprise and modern web development.',
          projectTitle: 'Interactive Kanban Board (TS Refactor)',
          projectDescription: 'Refactor the Kanban board into strictly-typed TypeScript with custom generic models.',
          order: 1,
          status: 'in_progress',
        },
      });
    }

    const m2 = await prisma.milestone.create({
      data: {
        roadmapId: demoRoadmap.id,
        title: 'Component Architecture with React & Tailwind',
        description: 'Deep dive into hooks, memoization, state management, and modern styling.',
        order: 1,
        weekStart: 4,
        weekEnd: 6,
        status: 'not_started',
      },
    });

    const reactSkillId = skillMap.get('React');
    const twSkillId = skillMap.get('Tailwind CSS');
    if (reactSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m2.id,
          skillId: reactSkillId,
          priority: 'critical',
          reason: 'Core UI framework required for the target role.',
          projectTitle: 'Real-time Analytics Dashboard',
          projectDescription: 'Build a responsive multi-page dashboard consuming external APIs with charting.',
          order: 0,
          status: 'not_started',
        },
      });
    }
    if (twSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m2.id,
          skillId: twSkillId,
          priority: 'medium',
          reason: 'Accelerates UI component styling and responsive layouts.',
          projectTitle: 'Real-time Analytics Dashboard',
          projectDescription: 'Style the dashboard with dark mode support and micro-interactions.',
          order: 1,
          status: 'not_started',
        },
      });
    }

    const m3 = await prisma.milestone.create({
      data: {
        roadmapId: demoRoadmap.id,
        title: 'Fullstack Next.js & Production Readiness',
        description: 'Learn App Router, Server Actions, API routes, and testing.',
        order: 2,
        weekStart: 7,
        weekEnd: 8,
        status: 'not_started',
      },
    });

    const nextSkillId = skillMap.get('Next.js');
    const testSkillId = skillMap.get('Testing');
    if (nextSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m3.id,
          skillId: nextSkillId,
          priority: 'high',
          reason: 'Modern production React standard with SSR and edge features.',
          projectTitle: 'Production E-commerce Platform',
          projectDescription: 'Deploy a server-rendered storefront with cart management and automated tests.',
          order: 0,
          status: 'not_started',
        },
      });
    }
    if (testSkillId) {
      await prisma.roadmapItem.create({
        data: {
          milestoneId: m3.id,
          skillId: testSkillId,
          priority: 'medium',
          reason: 'Ensures application stability and codebase reliability.',
          projectTitle: 'Production E-commerce Platform',
          projectDescription: 'Add unit and integration tests using Vitest and React Testing Library.',
          order: 1,
          status: 'not_started',
        },
      });
    }
    console.log('✅ Created demo roadmap with 3 milestones and 6 items');
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
