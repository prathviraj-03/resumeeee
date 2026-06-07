"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, AlertCircle, Clock, ExternalLink, BookOpen, Map, Target } from "lucide-react";
import { toast } from "sonner";
import { runGapAnalysis, getRoadmap } from "@/lib/api/skills";
import { getUserProfile } from "@/lib/api/profile";
import { getErrorMessage, isRateLimitError } from "@/lib/api/error";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { GapAnalysisResult, UserProfile } from "@/lib/api/types";
import type { RoadmapResponse } from "@/lib/api/skills";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  jobDescription: z.string().min(config.jdMinLength, `Min ${config.jdMinLength} chars`),
});
type FormData = z.infer<typeof schema>;

function normaliseGap(raw: GapAnalysisResult) {
  const present = raw.matched ?? [];
  const partial  = raw.partially_matched ?? [];
  const missing  = raw.missing ?? [];
  const cats = raw.skillCategories ?? [];
  const score = raw.overallScore ?? raw.overall_score ?? 0;
  return { present, partial, missing, categories: cats, score };
}

function isValidRoadmap(data: unknown): data is RoadmapResponse {
  const r = data as Partial<RoadmapResponse> | null;
  if (!r || !Array.isArray(r.weeks)) return false;

  return r.weeks.every((week) => (
    typeof week?.week_number === "number" &&
    typeof week?.focus_area === "string" &&
    Array.isArray(week?.items)
  ));
}

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<"analysis" | "roadmap">("analysis");
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["profile"], queryFn: getUserProfile,
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const jdValue = watch("jobDescription") || "";

  const analyzeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return runGapAnalysis({
        jobDescription: data.jobDescription,
        profileData: profile,
        currentSkills: profile?.skills || []
      });
    },
    onSuccess: (data) => {
      roadmapMutation.reset();
      setGapResult(data);
      setActiveTab("analysis");

      const { missing } = normaliseGap(data);
      if (!missing.length) {
        toast.success("Skill gap analysis complete. No missing skills found.");
        return;
      }

      toast.success("Skill gap analysis complete! Generating roadmap...");
      roadmapMutation.mutate({
        missingSkills: missing,
        jobDescription: jdValue,
      });
    },
    onError: (err) => toast.error(isRateLimitError(err) ? "Rate limit — please wait." : getErrorMessage(err)),
  });

  const roadmapMutation = useMutation({
    mutationFn: async (payload: { missingSkills: string[]; jobDescription: string }) => {
      if (!payload.missingSkills.length) throw new Error("No missing skills to build a roadmap for.");
      return getRoadmap({
        jobDescription: payload.jobDescription,
        profileData: profile,
        currentSkills: payload.missingSkills,
      });
    },
    onSuccess: (data) => {
      if (!isValidRoadmap(data)) {
        setActiveTab("analysis");
        toast.error("Roadmap data is incomplete. Please try again.");
        return;
      }
      setActiveTab("roadmap");
      toast.success("Learning roadmap generated!");
    },
    onError: (err) => {
      setActiveTab("analysis");
      toast.error(err instanceof Error ? err.message : getErrorMessage(err));
    },
  });

  const rData = isValidRoadmap(roadmapMutation.data) ? roadmapMutation.data : null;
  const { present, partial, missing } = gapResult ? normaliseGap(gapResult) : { present:[], partial:[], missing:[] };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">Skill Gap & Roadmap</h2>
        <p className="page-subtitle">Identify missing skills from your target role and generate a personalized learning plan.</p>
      </div>

      {/* Input */}
      <div className="rf-card p-6 mb-8">
        <form onSubmit={handleSubmit((d) => analyzeMutation.mutate(d))} className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 mb-4">
            <div className="mt-1"><Target className="h-5 w-5 text-primary-400" /></div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Target Role</h3>
              <p className="text-xs text-zinc-400 mt-1">
                We&apos;ll analyze your Master Profile against this job description to find missing skills.
              </p>
            </div>
          </div>
          
          <Textarea 
            label="Job Description"
            placeholder="Paste the job description (e.g. 'Senior Frontend Engineer at Acme Corp...') requirements here..."
            className="h-32 min-h-[128px]"
            value={jdValue} error={errors.jobDescription?.message}
            {...register("jobDescription")} 
          />
          
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="gradient" loading={analyzeMutation.isPending || roadmapMutation.isPending} disabled={profileLoading || roadmapMutation.isPending}>
              <Brain className="h-4 w-4" />
              {analyzeMutation.isPending || roadmapMutation.isPending ? "Analysing Profile…" : "Analyse Skill Gap"}
            </Button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      {gapResult && (
        <div className="flex gap-2 mb-6 border-b border-surface-border pb-px">
          <button onClick={() => setActiveTab("analysis")} 
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", 
              activeTab === "analysis" ? "border-primary-500 text-primary-400" : "border-transparent text-muted-foreground hover:text-foreground/80")}>
            Gap Analysis
          </button>
          <button onClick={() => setActiveTab("roadmap")} disabled={!gapResult}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", 
              activeTab === "roadmap" ? "border-primary-500 text-primary-400" : "border-transparent text-muted-foreground hover:text-foreground/80 disabled:opacity-50")}>
            Learning Roadmap
          </button>
        </div>
      )}

      {/* Analysis Tab */}
      {gapResult && activeTab === "analysis" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Matched", count: present.length, color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
              { label: "Partially Matched", count: partial.length, color: "text-warning", bg: "bg-warning/10", icon: Clock },
              { label: "Missing", count: missing.length, color: "text-danger", bg: "bg-danger/10", icon: AlertCircle },
            ].map((s) => (
              <div key={s.label} className={cn("rf-card p-4 text-center", s.bg)}>
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
                <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rf-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Missing Skills (Priority Gaps)</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {missing.length > 0 ? missing.map(m => (
                <div key={m} className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                  {m}
                </div>
              )) : <span className="text-sm text-muted-foreground">No missing skills! You&apos;re a perfect match.</span>}
            </div>

            {missing.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-surface-border">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Bridge the Gap</h4>
                  <p className="text-xs text-muted-foreground mt-1">Let AI generate a week-by-week learning roadmap with real courses and resources.</p>
                </div>
                <Button variant="gradient" onClick={() => roadmapMutation.mutate({ missingSkills: missing, jobDescription: jdValue })} loading={roadmapMutation.isPending}>
                  <Map className="h-4 w-4" /> Generate Roadmap
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Roadmap Tab */}
      {activeTab === "roadmap" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {roadmapMutation.isPending ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="w-px h-full bg-surface-border my-2" />
                  </div>
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : rData ? (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-primary-500/20" />
              
              {rData.weeks.map((week) => (
                <div key={week.week_number} className="relative flex gap-6 mb-8 last:mb-0">
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-primary-500 text-black font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    W{week.week_number}
                  </div>
                  
                  {/* Content Card */}
                  <div className="flex-1 rf-card p-5">
                    <h3 className="text-lg font-bold text-primary-400 mb-4">{week.focus_area}</h3>
                    <div className="space-y-4">
                      {week.items.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-secondary/50 border border-surface-border flex items-start gap-3">
                          <div className="mt-0.5"><BookOpen className="h-4 w-4 text-zinc-400" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">{item.title}</span>
                              {item.priority === "High" && <Badge variant="danger" className="text-[10px]">High Priority</Badge>}
                              <Badge variant="muted" className="text-[10px]">{item.skill}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
                            <a href={item.resource} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-full transition-colors">
                              <ExternalLink className="h-3 w-3" /> View Resource
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Failed to load roadmap. Please try generating it again.
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!gapResult && !analyzeMutation.isPending && (
        <div className="empty-state py-16">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Map className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <h3 className="text-base font-semibold text-zinc-400 mb-2">No active roadmap</h3>
          <p className="text-sm text-muted-foreground/70 max-w-xs text-center">
            Paste a job description above to identify your skill gaps and generate a personalized learning plan.
          </p>
        </div>
      )}
    </div>
  );
}
