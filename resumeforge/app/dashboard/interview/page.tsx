"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mic, Plus, Clock, Star, ChevronRight, Code2, Users, Briefcase, Target } from "lucide-react";
import { toast } from "sonner";
import { listSessions, startSession } from "@/lib/api/interview";
import { getErrorMessage } from "@/lib/api/error";
import { cn, formatDate, DIFFICULTY_LABELS } from "@/lib/utils";
import { getUserProfile } from "@/lib/api/profile";
import type { InterviewSummary, InterviewType, InterviewDifficulty, UserProfile } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const schema = z.object({
  type: z.enum(["technical", "behavioral", "hr"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  jobDescription: z.string().optional(),
});
type ConfigForm = z.infer<typeof schema>;

const TYPE_CONFIG = {
  technical: { icon: Code2,    label: "Technical",  desc: "Algorithms, system design" },
  behavioral:{ icon: Users,    label: "Behavioral", desc: "STAR method, soft skills" },
  hr:        { icon: Briefcase,label: "HR",          desc: "Culture fit, career goals" },
};
const DIFF_COLOR = {
  easy:   "text-success bg-success/10 border-success/30",
  medium: "text-warning bg-warning/10 border-warning/30",
  hard:   "text-danger  bg-danger/10  border-danger/30",
};

// Normalise session summary from backend
function normSummary(s: InterviewSummary) {
  return {
    ...s,
    type: (s.type ?? s.role) as InterviewType | undefined,
    overallScore: s.overallScore ?? s.overall_score,
    questionCount: s.questionCount ?? s.question_count,
    startedAt: s.startedAt ?? s.started_at ?? "",
    completedAt: s.completedAt ?? s.completed_at,
  };
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="empty-state">
      <svg className="w-24 h-24 mb-6 opacity-30" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="32" stroke="#6366f1" strokeWidth="2" fill="none"/>
        <circle cx="48" cy="48" r="14" stroke="#6366f1" strokeWidth="2" fill="#1C1C1F"/>
        <path d="M48 34v28M34 48h28" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      </svg>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">No interviews yet</h3>
      <p className="text-sm text-zinc-600 mb-6 max-w-xs text-center">
        Start a mock interview — questions are fetched from the curated question bank based on role and difficulty.
      </p>
      <Button onClick={onStart} variant="gradient"><Plus className="h-4 w-4" />Start First Interview</Button>
    </div>
  );
}

function ConfigModal({ open, onClose, onStart, isPending }: {
  open: boolean; onClose: () => void;
  onStart: (c: ConfigForm) => void; isPending: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ConfigForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: "technical", difficulty: "medium", questionCount: 10, jobDescription: "" },
  });
  const t = watch("type"); const d = watch("difficulty"); const n = watch("questionCount");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Interview</DialogTitle>
          <DialogDescription>Questions are pulled from the backend question bank, or dynamically generated if a Job Description is provided.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onStart)} className="grid md:grid-cols-2 gap-6 py-2">
          
          {/* Left Column: Basic Settings */}
          <div className="space-y-5">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Interview Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TYPE_CONFIG) as [InterviewType, typeof TYPE_CONFIG[InterviewType]][]).map(([type, cfg]) => (
                  <button type="button" key={type} onClick={() => setValue("type", type)}
                    className={cn("p-3 rounded-xl border text-center transition-all",
                      t === type ? "border-primary-500 bg-primary-500/10 text-primary-400"
                                 : "border-surface-border text-zinc-500 hover:text-zinc-300")}>
                    <cfg.icon className="h-4 w-4 mx-auto mb-1.5" />
                    <div className="text-xs font-medium">{cfg.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {(["easy","medium","hard"] as InterviewDifficulty[]).map((diff) => (
                  <button type="button" key={diff} onClick={() => setValue("difficulty", diff)}
                    className={cn("flex-1 py-2 rounded-xl border text-xs font-medium transition-all",
                      d === diff ? DIFF_COLOR[diff] : "border-surface-border text-zinc-500 hover:text-zinc-300")}>
                    {DIFFICULTY_LABELS[diff]}
                  </button>
                ))}
              </div>
            </div>
            {/* Count */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Questions</label>
              <div className="flex gap-2">
                {[5,10,15].map((num) => (
                  <button type="button" key={num} onClick={() => setValue("questionCount", num as 5|10|15)}
                    className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                      n === num ? "border-primary-500 bg-primary-500/10 text-primary-400"
                                : "border-surface-border text-zinc-500 hover:text-zinc-300")}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: JD Aware */}
          <div className="space-y-4 flex flex-col h-full border-l border-surface-border pl-6">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-primary-500/20 bg-primary-500/5">
              <div className="mt-0.5"><Target className="h-4 w-4 text-primary-400" /></div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Tailor to a Role</h4>
                <p className="text-xs text-zinc-400 mt-1">Paste a job description and we&apos;ll generate custom questions matching its requirements.</p>
              </div>
            </div>
            <Textarea 
              label="Job Description (Optional)" 
              placeholder="Paste the job description..."
              className="flex-1 min-h-[160px] text-sm"
              error={errors.jobDescription?.message}
              {...register("jobDescription")}
            />
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 flex justify-end gap-3 mt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" loading={isPending}>
              <Mic className="h-4 w-4" />Start Interview
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"], queryFn: getUserProfile,
  });

  const { data: rawSessions, isLoading } = useQuery<InterviewSummary[]>({
    queryKey: ["interview-sessions"], queryFn: listSessions,
  });
  const sessions = rawSessions?.map(normSummary) ?? [];

  const startMutation = useMutation({
    mutationFn: startSession,
    onSuccess: (session) => {
      toast.success("Interview session started!");
      router.push(`/dashboard/interview/${session.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header flex items-start justify-between">
        <div>
          <h2 className="page-title">Mock Interview</h2>
          <p className="page-subtitle">AI-powered sessions with real-time LLM scoring on clarity, accuracy, and tone</p>
        </div>
        <Button variant="gradient" onClick={() => setConfigOpen(true)}>
          <Plus className="h-4 w-4" />New Interview
        </Button>
      </div>

      {isLoading ? (
        <div className="rf-card divide-y divide-surface-border">
          {[1,2,3].map((i) => (
            <div key={i} className="p-5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
              <Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : !sessions.length ? (
        <EmptyState onStart={() => setConfigOpen(true)} />
      ) : (
        <div className="rf-card divide-y divide-surface-border">
          {sessions.map((s, i) => {
            const typeKey = (s.type ?? "technical") as keyof typeof TYPE_CONFIG;
            const TypeIcon = TYPE_CONFIG[typeKey]?.icon ?? Mic;
            const score = s.overallScore ?? 0;
            const scoreColor = score >= 8 ? "text-success" : score >= 6 ? "text-warning" : "text-danger";
            return (
              <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                onClick={() => router.push(`/dashboard/interview/${s.id}`)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/interview/${s.id}`)}>
                <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <TypeIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-zinc-200">
                      {TYPE_CONFIG[typeKey]?.label ?? s.role ?? "Interview"}
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full border", DIFF_COLOR[s.difficulty] ?? "")}>
                      {DIFFICULTY_LABELS[s.difficulty]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.startedAt ? formatDate(s.startedAt) : "—"}</span>
                    {s.questionCount && <span>{s.questionCount} questions</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Badge variant={s.status === "completed" ? "success" : s.status === "active" ? "default" : "muted"} className="capitalize">
                    {s.status}
                  </Badge>
                  {s.status === "completed" && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-zinc-600" />
                      <span className={cn("text-sm font-bold font-mono", scoreColor)}>{score.toFixed(1)}</span>
                      <span className="text-xs text-zinc-600">/10</span>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)}
        onStart={(cfg) => { setConfigOpen(false); startMutation.mutate({ ...cfg, profileData: profile }); }}
        isPending={startMutation.isPending} />
    </div>
  );
}
