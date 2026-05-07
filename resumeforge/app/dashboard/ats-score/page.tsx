"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ArrowRight, CheckCircle2, XCircle, Info, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserProfile } from "@/lib/api/profile";
import { getErrorMessage } from "@/lib/api/error";
import { config } from "@/lib/config";
import { cn, getScoreColor, getScoreLabel } from "@/lib/utils";
import type { ATSScoreResult, ScorePillar, UserProfile } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { calculateAtsScore } from "@/lib/api/ai";

const schema = z.object({
  jobDescription: z.string().min(config.jdMinLength, `Paste the job description (min ${config.jdMinLength} chars)`),
});
type FormData = z.infer<typeof schema>;

function normaliseATS(raw: any): any {
  const score = raw.composite_score ?? raw.overallScore ?? raw.overall_score ?? raw.score ?? 0;
  const matched = raw.keyword_matches ?? raw.matchedKeywords ?? raw.matched_keywords ?? [];
  const missing = raw.keyword_gaps ?? raw.missingKeywords ?? raw.missing_keywords ?? raw.gaps ?? [];

  let pillars: ScorePillar[] = raw.pillars ?? raw.breakdown ?? [];
  if (pillars.length === 0) {
    pillars = [
      { name: "Keyword Match",    score: raw.keyword_score ?? Math.min(100, Math.round(score * 1.05)), weight: 60, description: "" },
      { name: "Semantic Fit",     score: raw.semantic_score ?? Math.min(100, Math.round(score * 0.95)), weight: 25, description: "" },
      { name: "Format Quality",   score: raw.format_score ?? Math.min(100, Math.round(score * 0.9)),  weight: 15, description: "" },
    ];
  }
  return { ...raw, overallScore: score, pillars, matchedKeywords: matched, missingKeywords: missing };
}

function CircularProgress({ score }: { score: number }) {
  const r = 56; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = getScoreColor(score);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="progress-ring">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#27272A" strokeWidth="10" />
        <motion.circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div className="text-4xl font-bold font-mono" style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
          {score}
        </motion.div>
        <div className="text-xs text-zinc-500 mt-0.5">/ 100</div>
      </div>
    </div>
  );
}

function ResultPanel({ result, jd }: { result: ATSScoreResult; jd: string }) {
  const norm = normaliseATS(result);
  const score = norm.overallScore!;
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
      {/* Score ring */}
      <div className="rf-card p-6 text-center">
        {(result as ATSScoreResult & { cached?: boolean }).cached && (
          <div className="text-xs text-zinc-600 mb-2">⚡ Cached result (Redis · 24h)</div>
        )}
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">ATS Compatibility Score</div>
        <CircularProgress score={score} />
        <div className="mt-3">
          <span className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ color: getScoreColor(score), background: `${getScoreColor(score)}15` }}>
            {getScoreLabel(score)}
          </span>
        </div>
      </div>

      {/* Pillars */}
      <div className="rf-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300">Score Breakdown</h3>
        {norm.pillars!.map((p: ScorePillar, i: number) => (
          <motion.div key={p.name} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">{p.name}</span>
                <span className="text-xs text-zinc-600">({p.weight}%)</span>
              </div>
              <span className="text-xs font-mono font-semibold" style={{ color: getScoreColor(p.score) }}>{p.score}</span>
            </div>
            <Progress value={p.score} scoreColor className="h-1.5" />
          </motion.div>
        ))}
      </div>

      {/* Keywords */}
      <div className="rf-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300">Keyword Analysis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-success">Matched ({norm.matchedKeywords!.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {norm.matchedKeywords!.map((k: string) => <span key={k} className="keyword-badge keyword-matched">{k}</span>)}
              {norm.matchedKeywords!.length === 0 && <span className="text-xs text-zinc-600">None detected</span>}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="h-3.5 w-3.5 text-danger" />
              <span className="text-xs font-medium text-danger">Missing ({norm.missingKeywords!.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {norm.missingKeywords!.map((k: string) => <span key={k} className="keyword-badge keyword-missing">{k}</span>)}
              {norm.missingKeywords!.length === 0 && <span className="text-xs text-zinc-600">All covered!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {norm.suggestions && norm.suggestions.length > 0 && (
        <div className="rf-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-zinc-300">Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {norm.suggestions.map((s: string, i: number) => (
              <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <Link href={`/dashboard/optimize?jd=${encodeURIComponent(jd)}`}>
        <Button variant="gradient" className="w-full">
          <TrendingUp className="h-4 w-4" />Optimize Resume with AI<ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function ATSScorePage() {
  const [result, setResult] = useState<ATSScoreResult | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["profile"], queryFn: getUserProfile,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const jdValue = watch("jobDescription") || "";

  const scoreMutation = useMutation({
    mutationFn: calculateAtsScore,
    onSuccess: (data) => { setResult(data); toast.success("ATS score calculated!"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">ATS Scorer</h2>
        <p className="page-subtitle">Semantic keyword analysis against your job description — results cached 24h via Redis</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <form onSubmit={handleSubmit((d) => { setResult(null); scoreMutation.mutate(d); })} className="space-y-5">
            <div className="rf-card p-4 border border-primary-500/20 bg-primary-500/5 mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1"><Target className="h-5 w-5 text-primary-400" /></div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Scoring Master Profile</h4>
                  <p className="text-xs text-zinc-400 mt-1">We will automatically extract experience, skills, and projects from your Master Profile to analyze your fit for this role.</p>
                </div>
              </div>
            </div>

            <Textarea label="Job Description" placeholder="Paste the full job description here…"
              className="h-64" showCount value={jdValue}
              hint="Tip: include the full JD for best semantic analysis"
              error={errors.jobDescription?.message}
              {...register("jobDescription")} />

            <Button type="submit" variant="gradient" className="w-full" loading={scoreMutation.isPending}>
              <Target className="h-4 w-4" />
              {scoreMutation.isPending ? "Analysing…" : "Calculate ATS Score"}
            </Button>
          </form>

          {!result && !scoreMutation.isPending && (
            <div className="mt-6 rf-card p-5 border-primary-500/20 bg-primary-500/5">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3">How it works</h4>
              <ol className="space-y-2 text-xs text-zinc-500">
                {[
                  "Your resume is compared against the JD using semantic NLP analysis",
                  "Keywords are matched with contextual relevance (not just exact strings)",
                  "Gaps are identified across 3 weighted pillars",
                  "Results are cached in Redis for 24h for fast re-scoring",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-400 font-mono shrink-0">{i + 1}.</span>{s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {scoreMutation.isPending && (
            <div className="mt-6 space-y-4">
              <div className="rf-card p-6 text-center"><Skeleton className="h-[140px] w-[140px] rounded-full mx-auto" /></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rf-card p-5 space-y-3">
                  <Skeleton className="h-4 w-32" /><Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && <ResultPanel key={result.id ?? "r"} result={result} jd={jdValue} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
