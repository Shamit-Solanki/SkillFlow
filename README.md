# SkillFlow 🚀

> **AI-Powered Personalized Career Roadmap Platform**
> 
> SkillFlow transforms:
> **Current Skills → Skill Gap Analysis → Prerequisite DAG → Prioritized Learning Path → Capstone Projects → Target Role**

SkillFlow is not a chatbot that gives generic advice. It generates **structured, deterministic data** powered by a technical prerequisite DAG (Directed Acyclic Graph) and structured LLM output (Gemini 2.5 Flash).

---

## ✨ Features

- **Interactive Multi-Step Onboarding**: Profile creation, interactive skill selection with level rating (0–5), and target role selection.
- **Deterministic Skill Gap Analysis**: In-memory graph engine computes exact missing/partial/mastered skills, gap sizes, and priority ranks.
- **Interactive Skill DAG Canvas**: Custom hierarchical SVG graph visualizer with stage stratification (*Foundations* → *Core* → *Frameworks* → *Advanced*), animated Bézier curves, status color coding, and node inspection.
- **"What to Learn Next" Spotlight**: Identifies unmastered skills whose prerequisites are already fulfilled.
- **Milestone-Based Roadmap**: Structured stages with time estimates, learning objectives, and portfolio-grade capstone projects.
- **Progress Tracking & Leveling**: Interactive task completion toggles that dynamically update milestone completion bars and advance skill levels.
- **Adaptive Roadmap Recalculation**: On-the-fly role switcher and "Recalculate Roadmap" trigger that re-evaluates the DAG when your skills or target career change.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Lucide Icons
- **Database & ORM**: Prisma ORM with SQLite
- **AI Engine**: Google Gemini API (`@google/genai`) using Gemini 2.5 Flash with structured JSON schemas (`responseSchema`)
- **Graph Engine**: Native in-memory Directed Acyclic Graph with Kahn's topological sort

---

## 🚀 Quickstart for Any Machine

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd SkillFlow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini API key to `.env` if you want to use live LLM extraction. Without an API key, the deterministic fallback handles all graph and roadmap calculations automatically.

### 4. Initialize and seed the database
```bash
# Push Prisma schema and seed 32 skills, 35 prerequisites, 5 roles, and demo roadmap
npm run db:push
npm run seed
```

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: `http://localhost:3000`
- **Pre-populated Demo Dashboard**: `http://localhost:3000/dashboard/demo`
- **Onboarding Flow**: `http://localhost:3000/onboarding`

---

## 📂 Project Structure

```
SkillFlow/
├── prisma/
│   ├── schema.prisma       # Database schema (User, Skill, Role, Roadmap, Milestone)
│   └── seed.ts             # 32 skills, 35 DAG prerequisites, 5 roles, demo data
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/   # Dashboard data endpoint (user, gaps, graph, roadmap)
│   │   │   ├── onboarding/  # Ingests user profile & generates roadmap
│   │   │   ├── progress/    # Toggles item completion and levels up skills
│   │   │   ├── roles/       # Lists target career roles
│   │   │   ├── roadmap/     # Adaptive roadmap recalculation API
│   │   │   └── user/        # Direct skill proficiency adjustment API
│   │   ├── dashboard/       # Main user dashboard page
│   │   ├── onboarding/      # Step-by-step onboarding flow
│   │   ├── globals.css      # Design system variables & custom scrollbar
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Product landing page
│   ├── components/
│   │   └── SkillGraphVisualizer.tsx  # Interactive SVG DAG canvas
│   ├── lib/
│   │   ├── ai.ts            # Gemini 2.5 Flash structured output service
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── skill-engine.ts  # In-memory DAG, topological sort & gap analyzer
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── index.ts         # Shared Zod schemas and TypeScript models
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```
