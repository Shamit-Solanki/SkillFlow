'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GitBranch, Loader2, Sparkles, X, FolderGit2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'profile' | 'skills' | 'role' | 'details' | 'analyzing';

const COMMON_SKILLS = [
  'Programming Fundamentals', 'HTML', 'CSS', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'Node.js', 'Python', 'Git & Version Control',
  'SQL & Databases', 'REST APIs', 'Docker', 'Linux & Command Line',
  'Data Structures', 'Algorithms', 'Testing', 'Machine Learning Basics',
  'Tailwind CSS', 'Cloud Services (AWS/GCP)',
];

const SKILL_LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Familiar' },
  { value: 3, label: 'Proficient' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('profile');
  const [error, setError] = useState('');

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [githubScanResult, setGithubScanResult] = useState<{
    username: string;
    avatarUrl: string;
    reposCount: number;
    skillsCount: number;
    topLangs: string[];
    summary: string;
  } | null>(null);

  // Skills
  const [selectedSkills, setSelectedSkills] = useState<Map<string, number>>(new Map());
  const [customSkill, setCustomSkill] = useState('');

  // Role
  const [targetRole, setTargetRole] = useState('');
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Details
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [learningStyle, setLearningStyle] = useState('balanced');
  const [resumeText, setResumeText] = useState('');
  const [projects, setProjects] = useState('');

  const toggleSkill = (skill: string) => {
    const next = new Map(selectedSkills);
    if (next.has(skill)) {
      next.delete(skill);
    } else {
      next.set(skill, 2); // default to 'familiar'
    }
    setSelectedSkills(next);
  };

  const setSkillLevel = (skill: string, level: number) => {
    const next = new Map(selectedSkills);
    next.set(skill, level);
    setSelectedSkills(next);
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.has(customSkill.trim())) {
      const next = new Map(selectedSkills);
      next.set(customSkill.trim(), 2);
      setSelectedSkills(next);
      setCustomSkill('');
    }
  };

  const fetchRoles = async () => {
    if (roles.length > 0) return;
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data);
    } catch {
      setError('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const goToRoles = () => {
    setStep('role');
    fetchRoles();
  };

  const handleScanGithub = async () => {
    if (!githubInput.trim()) return;
    setIsScanningGithub(true);
    setError('');

    try {
      const res = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: githubInput }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to scan GitHub profile');
      }

      const data = await res.json();

      if (!name.trim() && data.name) setName(data.name);
      if (!bio.trim() && data.bio) setBio(data.bio);

      // Auto-populate detected skills
      const nextSkills = new Map(selectedSkills);
      data.detectedSkills.forEach((ds: { name: string; level: number }) => {
        const current = nextSkills.get(ds.name) || 0;
        nextSkills.set(ds.name, Math.max(current, ds.level));
      });
      setSelectedSkills(nextSkills);

      setGithubScanResult({
        username: data.username,
        avatarUrl: data.avatarUrl,
        reposCount: data.publicReposCount,
        skillsCount: data.detectedSkills.length,
        topLangs: data.topLanguages.slice(0, 3).map((l: any) => l.language),
        summary: data.summary,
      });
    } catch (e: any) {
      setError(e.message || 'Could not scan GitHub profile');
    } finally {
      setIsScanningGithub(false);
    }
  };

  const handleSubmit = async () => {
    setStep('analyzing');
    setError('');

    try {
      const skills = Array.from(selectedSkills.entries()).map(([name, level]) => ({
        name,
        level,
      }));

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          bio,
          skills,
          targetRoleId: targetRole,
          hoursPerWeek,
          learningStyle,
          resumeText,
          projects,
          githubUrl: githubInput.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create profile');
      }

      const data = await res.json();
      router.push(`/dashboard/${data.userId}`);
    } catch (e: any) {
      setError(e.message);
      setStep('details');
    }
  };

  const steps: Step[] = ['profile', 'skills', 'role', 'details', 'analyzing'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <nav className="border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SkillFlow</span>
          </div>
          <div className="flex gap-2">
            {steps.slice(0, 4).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 'profile' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Let's get to know you</h1>
            <p className="text-muted-foreground mb-8">Basic info to personalize your experience.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Short bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself — your background, what you're studying, what you've built..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* GitHub Auto-Extract Card */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Extract Skills from GitHub (Optional)
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Auto-Analysis
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  SkillFlow scans your public repositories, languages, and topics to automatically extract your skills and rate your baseline proficiency.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleScanGithub())}
                    placeholder="github.com/yourusername or yourusername"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleScanGithub}
                    disabled={isScanningGithub || !githubInput.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isScanningGithub ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Scan Profile
                      </>
                    )}
                  </button>
                </div>

                {githubScanResult && (
                  <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-3 text-xs animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={githubScanResult.avatarUrl}
                        alt={githubScanResult.username}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          @{githubScanResult.username}
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {githubScanResult.reposCount} public repos • Top:{' '}
                          {githubScanResult.topLangs.join(', ') || 'Code'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      +{githubScanResult.skillsCount} skills detected
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={() => setStep('skills')}
                disabled={!name.trim() || !email.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 'skills' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">What do you know?</h1>
            <p className="text-muted-foreground mb-6">
              Select your current skills and rate your proficiency. Don't worry about being perfect — AI will help refine this.
            </p>

            {githubScanResult && (
              <div className="mb-6 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Auto-selected <strong>{githubScanResult.skillsCount} skills</strong> inferred from your GitHub repositories (@{githubScanResult.username}).
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Synced</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {COMMON_SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                    selectedSkills.has(skill)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedSkills.has(skill) && <Check className="w-4 h-4 flex-shrink-0" />}
                    <span className="truncate">{skill}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-8">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                placeholder="Add another skill..."
                className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addCustomSkill}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Add
              </button>
            </div>

            {/* Level assignment */}
            {selectedSkills.size > 0 && (
              <div className="border border-border rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-4">Rate your proficiency</h3>
                <div className="space-y-4">
                  {Array.from(selectedSkills.entries()).map(([skill, level]) => (
                    <div key={skill} className="flex items-center gap-4">
                      <span className="w-40 text-sm truncate">{skill}</span>
                      <div className="flex gap-2 flex-1">
                        {SKILL_LEVELS.map((sl) => (
                          <button
                            key={sl.value}
                            onClick={() => setSkillLevel(skill, sl.value)}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                              level === sl.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            {sl.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('profile')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={goToRoles}
                disabled={selectedSkills.size === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Target Role */}
        {step === 'role' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Where do you want to go?</h1>
            <p className="text-muted-foreground mb-8">
              Select the role you're working toward. We'll analyze exactly what you need to get there.
            </p>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setTargetRole(role.id)}
                    className={`p-6 rounded-xl border text-left transition-all ${
                      targetRole === role.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{role.name}</h3>
                      {targetRole === role.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10 flex justify-between">
              <button
                onClick={() => setStep('skills')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!targetRole}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 'details' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Fine-tune your roadmap</h1>
            <p className="text-muted-foreground mb-8">
              Optional details that help us create a better plan for you.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available hours per week: {hoursPerWeek}h
                </label>
                <input
                  type="range"
                  min={2}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>2h</span>
                  <span>40h</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Learning style</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'visual', label: 'Visual (Videos)' },
                    { value: 'project-based', label: 'Project-Based' },
                    { value: 'balanced', label: 'Balanced' },
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setLearningStyle(style.value)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        learningStyle === style.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resume/experience (optional)
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume, describe your experience, or list projects you've worked on..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Projects you've built (optional)
                </label>
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="Describe projects you've completed or are working on..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="mt-10 flex justify-between">
              <button
                onClick={() => setStep('role')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-4 h-4" />
                Generate My Roadmap
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-24">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing your skills...</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Our AI is mapping your skills, identifying gaps, and building a personalized roadmap.
              This usually takes 10-20 seconds.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
              {[
                'Extracting skill data...',
                'Analyzing skill gaps...',
                'Building prerequisite graph...',
                'Generating milestones...',
                'Creating project recommendations...',
              ].map((msg, i) => (
                <div key={msg} className="flex items-center gap-2" style={{ animationDelay: `${i * 0.3}s` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
