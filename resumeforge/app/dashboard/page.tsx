"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Target, Sparkles, Mic, Brain,
  ArrowRight, Upload, Clock, Zap, User,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import { listResumes } from "@/lib/api/resume";
import { listSessions } from "@/lib/api/interview";
import type { ActivityType } from "@/lib/api/types";

const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  resume_upload: Upload,
  ats_scored: Target,
  resume_optimized: Sparkles,
  interview_completed: Mic,
  skill_updated: Brain,
};
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  resume_upload: "text-primary-400 bg-primary-500/10",
  ats_scored: "text-warning bg-warning/10",
  resume_optimized: "text-success bg-success/10",
  interview_completed: "text-danger bg-danger/10",
  skill_updated: "text-purple-400 bg-purple-500/10",
};

const QUICK_ACTIONS = [
  { label: "Update Profile", description: "Keep your master profile up-to-date", href: "/dashboard/profile", icon: User, color: "from-primary-500 to-primary-700" },
  { label: "Score My Profile", description: "Check ATS compatibility against JD", href: "/dashboard/ats-score", icon: Target, color: "from-warning to-orange-600" },
  { label: "Tailored Resume", description: "Generate a custom resume from profile", href: "/dashboard/optimize", icon: Sparkles, color: "from-success to-emerald-600" },
  { label: "Practice Interview", description: "AI-powered mock sessions", href: "/dashboard/interview", icon: Mic, color: "from-danger to-rose-700" },
  { label: "Analyze Skills", description: "Find and close skill gaps", href: "/dashboard/skills", icon: Brain, color: "from-purple-500 to-violet-700" },
];

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; loading: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold text-zinc-100 font-mono mb-1">{value}</div>
            <div className="text-sm text-zinc-500">{label}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Derive stats from real service data
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: listResumes,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: listSessions,
  });

  const statsLoading = resumesLoading || sessionsLoading;

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const bestScore = completedSessions.length
    ? Math.max(...completedSessions.map((s) => s.overallScore ?? s.overall_score ?? 0))
    : 0;

  const statCards = [
    { label: "Resumes Uploaded", value: resumes?.length ?? 0, icon: FileText, color: "bg-primary-500/10 text-primary-400" },
    { label: "Best Interview Score", value: bestScore ? `${bestScore.toFixed(1)}/10` : "—", icon: Target, color: "bg-warning/10 text-warning" },
    { label: "Interviews Done", value: completedSessions.length, icon: Mic, color: "bg-danger/10 text-danger" },
    { label: "Sessions Started", value: sessions?.length ?? 0, icon: Brain, color: "bg-success/10 text-success" },
  ];

  // Build activity feed from real data
  const recentActivity = [
    ...(resumes?.slice(0, 2).map((r) => ({
      id: r.id,
      type: "resume_upload" as ActivityType,
      description: `Uploaded ${r.filename ?? r.original_filename ?? "resume"}`,
      timestamp: r.uploadedAt ?? r.uploaded_at ?? r.createdAt ?? r.created_at ?? new Date().toISOString(),
    })) ?? []),
    ...(completedSessions.slice(0, 3).map((s) => ({
      id: s.id,
      type: "interview_completed" as ActivityType,
      description: `Completed ${s.role ?? s.type ?? "interview"} interview — Score: ${(s.overallScore ?? s.overall_score ?? 0).toFixed(1)}/10`,
      timestamp: s.completedAt ?? s.completed_at ?? s.startedAt ?? s.started_at ?? new Date().toISOString(),
    })) ?? []),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const displayName = user?.fullName || user?.full_name || "there";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rf-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👋</span>
              <h2 className="text-2xl font-bold text-zinc-100">
                Welcome back, {displayName.split(" ")[0]}!
              </h2>
            </div>
            <p className="text-zinc-500 text-sm max-w-lg">
              Your AI-powered career dashboard. Optimize your resume, practice interviews, and close skill gaps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user?.role === "premium" ? "default" : "muted"} className="px-3 py-1.5 text-sm">
              {user?.role === "premium" ? <>✦ Premium Plan</> : <>Free Plan</>}
            </Badge>
            {user?.role !== "premium" && (
              <Button size="sm" variant="gradient"><Zap className="h-3.5 w-3.5" />Upgrade</Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
            <StatCard {...card} loading={statsLoading} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h3 className="section-title">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div key={action.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}>
                <Link href={action.href}>
                  <div className="rf-card p-4 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", action.color)}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">{action.label}</div>
                        <div className="text-xs text-zinc-600 truncate">{action.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="section-title">Recent Activity</h3>
          <div className="rf-card divide-y divide-surface-border">
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-600">No activity yet</p>
                <p className="text-xs text-zinc-700 mt-1">Generate a tailored resume or practice an interview!</p>
              </div>
            ) : (
              recentActivity.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type];
                const colorClass = ACTIVITY_COLORS[item.type];
                return (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.description}</p>
                      <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
