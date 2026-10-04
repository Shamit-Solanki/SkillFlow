'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitBranch,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FolderGit2,
  Flame,
  RefreshCw,
  Plus,
  Minus,
  Briefcase,
  Layers,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { SkillGraphVisualizer } from '@/components/SkillGraphVisualizer';
import type { SkillNode } from '@/types';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    availableHoursPerWeek: number;
    learningStyle: string;
  };
  skills: Array<{
    id: string;
    name: string;
    category: string;
    level: number;
  }>;
  roadmap: {
    id: string;
    title: string;
    summary: string;
    targetRole: string;
    totalWeeks: number;
    status: string;
    overallProgress: number;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      order: number;
      weekStart: number;
      weekEnd: number;
      status: string;
      progress: number;
      items: Array<{
        id: string;
        skillName: string;
        skillId: string;
        status: string;
        priority: string;
        reason: string;
        projectTitle: string;
        projectDescription: string;
        order: number;
      }>;
    }>;
  } | null;
  gaps: Array<{
    skillName: string;
    currentLevel: number;
    requiredLevel: number;
    status: 'mastered' | 'partial' | 'missing';
    priority: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
    prerequisites: string[];
  }>;
  readiness: number;
  skillGraph: {
    nodes: Array<{
      id: string;
      name: string;
      category: string;
      level: number;
      status: 'mastered' | 'partial' | 'missing' | 'not_required';
      priority: string;
      prerequisites: string[];
      dependents: string[];
    }>;
    edges: Array<{
      source: string;
      target: string;
      strength: string;
    }>;
  };
  nextSkills: Array<{
    skillName: string;
    currentLevel: number;
    requiredLevel: number;
    status: 'mastered' | 'partial' | 'missing';
    priority: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
    prerequisites: string[];
  }>;
}

interface RoleOption {
  id: string;
  name: string;
  description: string;
}

export default function DashboardPage() {
  const params = useParams();
  const userId = (params?.userId as string) || 'demo';

  const [data, setData] = useState<DashboardData | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'gaps' | 'graph'>('roadmap');

  // GitHub sync modal state
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubSyncUsername, setGithubSyncUsername] = useState('');
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubSyncMessage, setGithubSyncMessage] = useState<string | null>(null);

  const handleSyncGithub = async () => {
    if (!githubSyncUsername.trim()) return;
    setIsSyncingGithub(true);
    setGithubSyncMessage(null);

    try {
      const scanRes = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: githubSyncUsername.trim(),
          userId,
          autoSync: true,
        }),
      });

      if (!scanRes.ok) {
        const err = await scanRes.json();
        throw new Error(err.error || 'Failed to sync with GitHub');
      }

      const scanData = await scanRes.json();

      await fetch('/api/roadmap/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      await fetchData();

      setGithubSyncMessage(
        `Successfully synced ${scanData.detectedSkills.length} skills from @${scanData.username} (${scanData.publicReposCount} repositories)! Your roadmap and readiness have been updated.`
      );
    } catch (err: any) {
      alert(err.message || 'Error syncing GitHub');
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, rolesRes] = await Promise.all([
        fetch(`/api/dashboard/${userId}`),
        fetch('/api/roles'),
      ]);

      if (!dashRes.ok) throw new Error('Failed to load dashboard');
      const json = await dashRes.json();
      setData(json);

      if (rolesRes.ok) {
        const rolesJson = await rolesRes.json();
        setRoles(rolesJson);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const toggleItemProgress = async (itemId: string, currentStatus: string) => {
    try {
      setUpdatingItemId(itemId);
      const nextStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update item status');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRoleChange = async (targetRoleId: string) => {
    try {
      setIsRecalculating(true);
      const res = await fetch('/api/roadmap/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetRoleId }),
      });
      if (!res.ok) throw new Error('Failed to adapt roadmap to new role');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error changing role');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      const res = await fetch('/api/roadmap/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to recalculate roadmap');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recalculating');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleUpdateSkillLevel = async (skillName: string, delta: number) => {
    if (!data) return;
    const skillNode = data.skillGraph.nodes.find((n) => n.name === skillName);
    if (!skillNode) return;

    const newLevel = Math.max(0, Math.min(5, skillNode.level + delta));
    try {
      setUpdatingSkillId(skillNode.id);
      const res = await fetch('/api/user/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          skillId: skillNode.id,
          level: newLevel,
        }),
      });
      if (!res.ok) throw new Error('Failed to update skill level');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating skill');
    } finally {
      setUpdatingSkillId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading your personalized roadmap...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Unable to load roadmap</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error || 'Data could not be retrieved.'}</p>
        <Link
          href="/onboarding"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Go to Onboarding
        </Link>
      </div>
    );
  }

  const { user, roadmap, gaps, readiness, skillGraph, nextSkills } = data;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SkillFlow</span>
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-medium">{user.name}'s Journey</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGithubSyncUsername(
                  data?.user?.email?.split('@')[0] || ''
                );
                setGithubModalOpen(true);
              }}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent transition-colors flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-primary" />
              Sync GitHub
            </button>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="text-xs px-3 py-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Roadmap'}
            </button>
            <Link
              href="/onboarding"
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground"
            >
              Restart
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Header Hero Banner */}
        <section className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Target className="w-3.5 h-3.5" />
                  Target Role: {roadmap?.targetRole || 'Software Engineer'}
                </div>

                {/* Role Switcher */}
                {roles.length > 0 && (
                  <div className="relative inline-flex items-center">
                    <select
                      value={roles.find((r) => r.name === roadmap?.targetRole)?.id || ''}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={isRecalculating}
                      className="text-xs py-1 px-3 pr-8 rounded-full border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary appearance-none hover:bg-accent"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          Switch to: {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2.5 pointer-events-none" />
                  </div>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {roadmap?.title || 'Personalized Career Path'}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {roadmap?.summary ||
                  'Follow your structured milestones, close critical skill gaps, and build portfolio projects to become job-ready.'}
              </p>
            </div>

            {/* Readiness Card */}
            <div className="flex items-center gap-4 bg-background/80 p-5 rounded-xl border border-border/80 min-w-[240px] shadow-sm">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-muted/30"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-primary transition-all duration-1000 ease-out"
                    fill="transparent"
                    strokeDasharray={163.3}
                    strokeDashoffset={163.3 - (163.3 * readiness) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold">{readiness}%</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Role Readiness</p>
                <p className="text-sm font-medium">
                  {readiness >= 75 ? 'Job Ready' : readiness >= 40 ? 'Progressing' : 'Starting Out'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {roadmap?.overallProgress ?? 0}% Roadmap Finished
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to Learn Next (Actionable Spotlight) */}
        {nextSkills && nextSkills.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold">What to Learn Next</h2>
              <span className="text-xs text-muted-foreground">
                (Prerequisites already fulfilled — ready for immediate study)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextSkills.map((sk) => (
                <div
                  key={sk.skillName}
                  className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{sk.skillName}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          sk.priority === 'critical'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                        }`}
                      >
                        {sk.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {sk.reason}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target Level: {sk.requiredLevel}/5</span>
                    <button
                      onClick={() => handleUpdateSkillLevel(sk.skillName, 1)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                    >
                      <Plus className="w-3 h-3" /> Level Up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-[3px] ${
              activeTab === 'roadmap'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Milestone Roadmap
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-[3px] ${
              activeTab === 'gaps'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-4 h-4" />
            Skill Gap Breakdown ({gaps.length})
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-[3px] ${
              activeTab === 'graph'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Interactive Skill DAG & Canvas
          </button>
        </div>

        {/* TAB 1: ROADMAP & CAPSTONE PROJECTS */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-fade-in">
            {roadmap?.milestones.map((milestone, idx) => (
              <div
                key={milestone.id}
                className="border border-border rounded-xl bg-card overflow-hidden shadow-sm"
              >
                {/* Milestone Header */}
                <div className="p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-base">{milestone.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Weeks {milestone.weekStart} – {milestone.weekEnd} • {milestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-28 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground min-w-[32px]">
                      {milestone.progress}%
                    </span>
                  </div>
                </div>

                {/* Milestone Items & Project */}
                <div className="p-5 space-y-4">
                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {milestone.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-lg border text-sm flex items-start justify-between gap-3 transition-colors ${
                          item.status === 'completed'
                            ? 'bg-muted/30 border-border text-muted-foreground'
                            : 'border-border bg-background'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                item.status === 'completed' ? 'line-through' : ''
                              }`}
                            >
                              {item.skillName}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                                item.priority === 'critical'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          {item.reason && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                          )}
                        </div>

                        <button
                          onClick={() => toggleItemProgress(item.id, item.status)}
                          disabled={updatingItemId === item.id}
                          className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-all ${
                            item.status === 'completed'
                              ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20'
                              : 'hover:bg-accent border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Hands-on Project */}
                  {milestone.items[0]?.projectTitle && (
                    <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide">
                        <FolderGit2 className="w-4 h-4" />
                        Milestone Capstone Project
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {milestone.items[0].projectTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {milestone.items[0].projectDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SKILL GAP BREAKDOWN & PROFICIENCY CONTROLS */}
        {activeTab === 'gaps' && (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm animate-fade-in">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Deterministic Role vs. Current Skills Comparison</h3>
                <p className="text-xs text-muted-foreground">
                  Evaluated against requirements for {roadmap?.targetRole}. Click + / - to adjust your level.
                </p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {gaps.map((gap) => (
                <div
                  key={gap.skillName}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{gap.skillName}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          gap.status === 'mastered'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : gap.status === 'partial'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {gap.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{gap.reason}</p>
                    {gap.prerequisites.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Prerequisites: <span className="text-foreground">{gap.prerequisites.join(', ')}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Proficiency stepper */}
                    <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border">
                      <button
                        onClick={() => handleUpdateSkillLevel(gap.skillName, -1)}
                        disabled={gap.currentLevel <= 0}
                        className="p-1 rounded hover:bg-background disabled:opacity-30 text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono font-bold px-1.5">
                        Lvl {gap.currentLevel}/{gap.requiredLevel}
                      </span>
                      <button
                        onClick={() => handleUpdateSkillLevel(gap.skillName, 1)}
                        disabled={gap.currentLevel >= 5}
                        className="p-1 rounded hover:bg-background disabled:opacity-30 text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded font-medium capitalize ${
                        gap.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : gap.priority === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {gap.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIVE SKILL DAG & CANVAS */}
        {activeTab === 'graph' && (
          <div className="space-y-4 animate-fade-in">
            <SkillGraphVisualizer
              nodes={skillGraph.nodes}
              edges={skillGraph.edges}
              onSelectSkill={(node) => {
                // optionally jump or inspect
              }}
            />
          </div>
        )}
      </main>

      {/* GitHub Sync Modal */}
      {githubModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in relative">
            <button
              onClick={() => {
                setGithubModalOpen(false);
                setGithubSyncMessage(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Sync Skills from GitHub</h3>
                <p className="text-xs text-muted-foreground">Scan repositories to update your skill profile</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              SkillFlow will inspect your public repositories, primary languages, and framework tags, infer your demonstrated skills, and recalculate your role readiness score automatically.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  GitHub Profile / Username
                </label>
                <input
                  type="text"
                  value={githubSyncUsername}
                  onChange={(e) => setGithubSyncUsername(e.target.value)}
                  placeholder="e.g. torvalds or github.com/username"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {githubSyncMessage && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{githubSyncMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGithubModalOpen(false);
                    setGithubSyncMessage(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent text-muted-foreground"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSyncGithub}
                  disabled={isSyncingGithub || !githubSyncUsername.trim()}
                  className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSyncingGithub ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning & Recalculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Scan & Sync Skills
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
