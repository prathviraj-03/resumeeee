"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Target, Sparkles, Mic, Brain,
  ArrowRight, Upload, Clock, Zap, User,
  Trophy, TrendingUp, CheckCircle2, Activity, BarChart3, Layers,
  Code2, Users, Briefcase, Shield, Flame, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime, getDisplayName } from "@/lib/utils";
import { listSessions } from "@/lib/api/interview";
import { getUserProfile } from "@/lib/api/profile";
import type { InterviewSummary } from "@/lib/api/types";

// ── Feature Cards Config ─────────────────────────────────────────────────────
const FEATURES = [
  {
    label: "Master Profile",
    description: "Build your single source of truth — all experience, skills, and projects in one place.",
    href: "/dashboard/profile",
    icon: User,
    gradient: "from-violet-500 to-indigo-600",
    glowDark: "rgba(139,92,246,0.25)",
    glowLight: "rgba(139,92,246,0.12)",
    tag: "Foundation",
  },
  {
    label: "ATS Score",
    description: "Instantly check how well your profile matches any job description.",
    href: "/dashboard/ats-score",
    icon: Target,
    gradient: "from-amber-500 to-orange-600",
    glowDark: "rgba(245,158,11,0.25)",
    glowLight: "rgba(245,158,11,0.12)",
    tag: "Analysis",
  },
  {
    label: "Tailor Resume",
    description: "AI rewrites your resume bullets for every specific role you apply to.",
    href: "/dashboard/optimize",
    icon: Sparkles,
    gradient: "from-emerald-500 to-teal-600",
    glowDark: "rgba(16,185,129,0.25)",
    glowLight: "rgba(16,185,129,0.12)",
    tag: "AI-Powered",
  },
  {
    label: "Mock Interview",
    description: "Practice with real LLM-graded sessions for technical, behavioral, and HR rounds.",
    href: "/dashboard/interview",
    icon: Mic,
    gradient: "from-rose-500 to-pink-600",
    glowDark: "rgba(244,63,94,0.25)",
    glowLight: "rgba(244,63,94,0.12)",
    tag: "Practice",
  },
  {
    label: "Skill Gap Analysis",
    description: "Discover missing skills and get a personalized learning roadmap.",
    href: "/dashboard/skills",
    icon: Brain,
    gradient: "from-purple-500 to-fuchsia-600",
    glowDark: "rgba(168,85,247,0.25)",
    glowLight: "rgba(168,85,247,0.12)",
    tag: "Growth",
  },
  {
    label: "Resume Templates",
    description: "Choose from professionally designed DOCX templates and export in seconds.",
    href: "/dashboard/templates",
    icon: Layers,
    gradient: "from-sky-500 to-blue-600",
    glowDark: "rgba(14,165,233,0.25)",
    glowLight: "rgba(14,165,233,0.12)",
    tag: "Export",
  },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = React.useState(0);
  useEffect(() => {
    let startTs: number | null = null;
    const end = value;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!startTs) startTs = timestamp;
      const progress = Math.min((timestamp - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(end * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, icon: Icon, gradient, delay, loading,
}: {
  label: string; value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string; delay: number; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative group overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      {/* Subtle gradient hover tint */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br rounded-2xl", gradient)} />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ) : (
        <>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-sm", gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight mb-0.5">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </>
      )}
    </motion.div>
  );
}

// ── Feature Action Card ───────────────────────────────────────────────────────
function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link href={feature.href}>
        <div className="group relative h-full rounded-2xl border border-border bg-card p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20">
          {/* Background gradient blob on hover */}
          <div className={cn("absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl", feature.gradient)} />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-sm", feature.gradient)}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                {feature.tag}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
              {feature.label}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>

            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-muted-foreground group-hover:text-primary transition-all duration-300">
              <span>Open</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const strokeDashoffset = circumference * (1 - pct);
  const color = score >= 8 ? "#22C55E" : score >= 6 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={5} className="text-border" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        className="progress-ring transition-all duration-1000"
      />
    </svg>
  );
}

// ── Interview History Row ─────────────────────────────────────────────────────
function InterviewRow({ session, index }: { session: InterviewSummary; index: number }) {
  const score = (session.overallScore ?? session.overall_score ?? 0) / 10;
  const scoreColor = score >= 8 ? "text-success" : score >= 6 ? "text-warning" : "text-danger";
  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    technical: Code2, behavioral: Users, hr: Briefcase,
  };
  const typeKey = (session.type ?? "technical") as string;
  const TypeIcon = typeIcons[typeKey] ?? Mic;
  const typeBg: Record<string, string> = {
    technical: "bg-sky-500/10 text-sky-500",
    behavioral: "bg-purple-500/10 text-purple-500",
    hr: "bg-amber-500/10 text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Link href={`/dashboard/interview/${session.id}`}>
        <div className="group flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-border">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", typeBg[typeKey] ?? "bg-secondary text-muted-foreground")}>
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground capitalize">{typeKey} Interview</div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize">{session.difficulty} · {session.status}</div>
          </div>
          {session.status === "completed" && (
            <div className="flex items-center gap-2 shrink-0">
              <ScoreRing score={score} size={32} />
              <div className="text-right">
                <div className={cn("text-sm font-bold font-mono", scoreColor)}>{score.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">/10</div>
              </div>
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: listSessions,
  });

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];
  const bestScore = completedSessions.length
    ? Math.max(...completedSessions.map((s) => (s.overallScore ?? s.overall_score ?? 0) / 10))
    : 0;
  const avgScore = completedSessions.length
    ? completedSessions.reduce((acc, s) => acc + (s.overallScore ?? s.overall_score ?? 0) / 10, 0) / completedSessions.length
    : 0;

  const displayName = profile?.full_name || getDisplayName(user);
  const firstName = displayName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentCompleted = [...completedSessions]
    .sort((a, b) => {
      const aDate = a.completedAt ?? a.completed_at ?? a.startedAt ?? a.started_at ?? "";
      const bDate = b.completedAt ?? b.completed_at ?? b.startedAt ?? b.started_at ?? "";
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card"
      >
        {/* Decorative gradient — subtle in both modes */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-3xl" />
        <div className="absolute top-0 right-0 w-80 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                {firstName[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{greeting}</p>
                <h1 className="text-2xl font-bold text-foreground leading-none">
                  {firstName} <span className="text-2xl">👋</span>
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-3 max-w-md leading-relaxed">
              Your AI career command center — build the perfect resume, ace every interview, and close skill gaps faster.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Badge
                variant={user?.role === "premium" ? "default" : "muted"}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  user?.role === "premium"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400"
                    : ""
                )}
              >
                {user?.role === "premium" ? "✦ Premium" : "Free Plan"}
              </Badge>
              {sessions && sessions.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {user?.role !== "premium" && (
              <Button variant="gradient" className="gap-2">
                <Zap className="h-3.5 w-3.5" />
                Upgrade to Premium
              </Button>
            )}
            <Link href="/dashboard/optimize">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Tailor
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Metrics Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Interviews Done" value={completedSessions.length} icon={CheckCircle2} gradient="from-indigo-500 to-violet-600" delay={0.1} loading={sessionsLoading} />
        <MetricCard label="Best Score" value={bestScore ? `${bestScore.toFixed(1)}/10` : "—"} icon={Trophy} gradient="from-amber-500 to-orange-600" delay={0.15} loading={sessionsLoading} />
        <MetricCard label="Avg Score" value={avgScore ? `${avgScore.toFixed(1)}/10` : "—"} icon={BarChart3} gradient="from-emerald-500 to-teal-600" delay={0.2} loading={sessionsLoading} />
        <MetricCard label="In Progress" value={activeSessions.length} icon={Flame} gradient="from-rose-500 to-pink-600" delay={0.25} loading={sessionsLoading} />
      </div>

      {/* ── Feature Cards Grid ────────────────────────────────────────────────── */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-5"
        >
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-base font-semibold text-foreground">What would you like to do?</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.href} feature={feature} index={i} />
          ))}
        </div>
      </div>

      {/* ── Bottom: Interview History + Sidebar ──────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Interview History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="lg:col-span-3 rounded-2xl border border-border bg-card shadow-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-danger" />
              <h3 className="text-sm font-semibold text-foreground">Recent Interviews</h3>
            </div>
            <Link href="/dashboard/interview">
              <span className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          <div className="p-2">
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentCompleted.length === 0 ? (
              <div className="py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-3">
                  <Mic className="h-7 w-7 text-danger opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">No interviews yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Start practicing to see your scores here</p>
                <Link href="/dashboard/interview">
                  <Button variant="outline" className="text-xs h-8 px-4">
                    Start Interview
                  </Button>
                </Link>
              </div>
            ) : (
              recentCompleted.map((s, i) => (
                <InterviewRow key={s.id} session={s} index={i} />
              ))
            )}
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Career Progress */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Career Progress</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: "Profile Complete", value: user?.is_setup_done ? 100 : 40, color: "from-indigo-500 to-violet-500", textColor: "text-indigo-500" },
                { label: "Interview Readiness", value: completedSessions.length > 0 ? Math.min(100, completedSessions.length * 20) : 0, color: "from-rose-500 to-pink-500", textColor: "text-rose-500" },
                { label: "Best Score", value: bestScore > 0 ? Math.round(bestScore * 10) : 0, color: "from-amber-500 to-orange-500", textColor: "text-amber-600" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("font-mono font-semibold", item.textColor)}>{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started Checklist */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
            </div>

            <div className="space-y-1">
              {[
                { step: "1", label: "Complete your profile", done: !!user?.is_setup_done, href: "/dashboard/profile" },
                { step: "2", label: "Run an ATS score check", done: false, href: "/dashboard/ats-score" },
                { step: "3", label: "Generate a tailored resume", done: false, href: "/dashboard/optimize" },
                { step: "4", label: "Practice a mock interview", done: completedSessions.length > 0, href: "/dashboard/interview" },
              ].map((item) => (
                <Link key={item.step} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group cursor-pointer",
                    item.done ? "opacity-50" : "hover:bg-secondary/60"
                  )}>
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                      item.done
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.step}
                    </div>
                    <span className={cn(
                      "text-xs flex-1 transition-colors",
                      item.done ? "text-muted-foreground line-through" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {item.label}
                    </span>
                    {!item.done && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
