'use client';

import { useState } from 'react';
import { ArrowRight, BarChart3, GitBranch, Layers, Sparkles, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SkillFlow</span>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-Powered Career Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your skills.
            <br />
            <span className="gradient-text">Your roadmap.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            SkillFlow analyzes where you are, maps where you want to go, and builds a
            personalized learning path to get you there — with real projects, not generic advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-xl text-lg font-semibold hover:bg-accent transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Flow visualization */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {[
            { label: 'Your Skills', icon: Layers, color: 'text-blue-400' },
            { label: 'Gap Analysis', icon: Target, color: 'text-orange-400' },
            { label: 'Skill Graph', icon: GitBranch, color: 'text-purple-400' },
            { label: 'Roadmap', icon: TrendingUp, color: 'text-green-400' },
            { label: 'Target Role', icon: BarChart3, color: 'text-cyan-400' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="flex-1 p-6 rounded-xl border border-border bg-card text-center hover:border-primary/50 transition-colors">
                <step.icon className={`w-8 h-8 mx-auto mb-3 ${step.color}`} />
                <p className="font-medium text-sm">{step.label}</p>
              </div>
              {i < 4 && (
                <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-4">Not another AI chatbot.</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            SkillFlow generates structured, actionable data — not vague career advice.
            Every recommendation is backed by skill dependency analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Skill Gap Analysis',
                description:
                  'See exactly which skills you have, which you\'re missing, and which need leveling up — all mapped against your target role.',
                icon: Target,
              },
              {
                title: 'Interactive Skill Graph',
                description:
                  'Visualize skill dependencies and prerequisites as an interactive graph. See where you stand and what unlocks next.',
                icon: GitBranch,
              },
              {
                title: 'Project-Based Roadmap',
                description:
                  'Get a milestone-based learning plan with real projects designed to close your specific skill gaps.',
                icon: TrendingUp,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to map your career?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Takes 2 minutes to set up. AI-generated roadmap in seconds.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>SkillFlow</span>
          </div>
          <p>Built with AI for learners everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
