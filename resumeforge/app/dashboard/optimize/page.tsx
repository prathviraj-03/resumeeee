"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Download,
  CheckCircle2,
  Loader2,
  Circle,
  TrendingUp,
  ArrowRight,
  Edit3,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { startOptimize, downloadOptimizedPdf } from "@/lib/api/ai";
import { getErrorMessage, isRateLimitError } from "@/lib/api/error";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { OptimizeResult, OptimizeStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TemplatePickerModal } from "@/components/ui/TemplatePickerModal";

const schema = z.object({
  jobDescription: z.string().min(config.jdMinLength, `Min ${config.jdMinLength} chars`),
});
type FormData = z.infer<typeof schema>;

// Progress steps — mapped to backend progress % range
const STEPS = [
  { label: "Fetching your master profile",   minPct: 0  },
  { label: "OpenAI optimizing content",       minPct: 20 },
  { label: "Generating PDF",                  minPct: 60 },
  { label: "Uploading to storage",            minPct: 80 },
];

function StepList({ isPending }: { isPending: boolean }) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => setTick((t) => (t + 1) % STEPS.length), 2500);
    return () => clearInterval(id);
  }, [isPending]);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const done   = isPending && i < tick;
        const active = isPending && i === tick;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all",
              done ? "bg-success/10" : active ? "bg-primary-500/10" : "bg-secondary")}>
              {done   ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> :
               active ? <Loader2 className="h-3.5 w-3.5 text-primary-400 animate-spin" /> :
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/70" />}
            </div>
            <span className={cn("text-sm transition-colors",
              done ? "text-success" : active ? "text-foreground" : "text-muted-foreground/70")}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Editable Content Panel ───────────────────────────────────────────────────
interface EditableContentProps {
  result: OptimizeResult;
  onOverridesChange: (overrides: Record<string, string>) => void;
  onDownloadClick: () => void;
}

function EditableContent({ result, onOverridesChange, onDownloadClick }: EditableContentProps) {
  const [summary, setSummary] = useState(result.optimized_data?.summary ?? "");
  const [skills, setSkills] = useState<string[]>(result.optimized_data?.skills ?? []);
  const [newSkill, setNewSkill] = useState("");
  const [bullets, setBullets] = useState<{ original: string; optimized: string; section?: string }[]>(
    result.bullets ?? []
  );

  // Sync overrides up whenever state changes
  React.useEffect(() => {
    onOverridesChange({
      summary,
      skills: skills.join(", "),
    });
  }, [summary, skills, onOverridesChange]);

  const updateBullet = (idx: number, value: string) => {
    setBullets((prev) => prev.map((b, i) => (i === idx ? { ...b, optimized: value } : b)));
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Score improvement badge — only show if scores available */}
      {((result.originalScore ?? 0) > 0 || (result.optimizedScore ?? 0) > 0) && (
        <div className="rf-card p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Optimization Complete</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and edit the content below, then download with your preferred template
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
            <span className="text-sm text-muted-foreground font-mono">{result.originalScore}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-sm font-bold font-mono text-success">{result.optimizedScore}</span>
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
        </div>
      )}

      {/* Suggestions from AI */}
      {(result.optimized_data?.suggestions ?? []).length > 0 && (
        <div className="rf-card p-4 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AI Suggestions</p>
          <ul className="space-y-1">
            {result.optimized_data!.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary-400 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="rf-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-foreground">Professional Summary</h3>
          <span className="text-xs text-muted-foreground/70">(editable)</span>
        </div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full resize-none bg-secondary/50 border border-surface-border rounded-lg p-3
                     text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none
                     focus:border-primary-500/50 transition-colors min-h-[100px]"
          placeholder="Optimized summary will appear here…"
          rows={4}
        />
      </div>

      {/* Skills */}
      <div className="rf-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-foreground">Skills</h3>
          <span className="text-xs text-muted-foreground/70">(editable)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                         bg-secondary border border-border text-foreground/80"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="text-muted-foreground/70 hover:text-danger transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Add a skill…"
            className="flex-1 bg-secondary/50 border border-surface-border rounded-lg px-3 py-1.5
                       text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none
                       focus:border-primary-500/50 transition-colors"
          />
          <button
            onClick={addSkill}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground/80
                       hover:border-primary-500/40 hover:text-primary-400 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bullet changes */}
      {bullets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/80">Experience Bullets</h3>
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rf-card overflow-hidden"
            >
              {b.section && (
                <div className="px-4 py-2 border-b border-surface-border bg-secondary/60">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {b.section}
                  </span>
                </div>
              )}
              <div className="divide-y divide-surface-border">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    Original
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.original}</p>
                </div>
                <div className="p-3">
                  <div className="text-xs text-success uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Optimized
                    <span className="text-muted-foreground/70 normal-case">(editable)</span>
                  </div>
                  <textarea
                    value={b.optimized}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    className="w-full resize-none bg-transparent text-xs text-foreground leading-relaxed
                               focus:outline-none placeholder:text-muted-foreground/70"
                    rows={2}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Download CTA */}
      <Button variant="gradient" className="w-full h-11" onClick={onDownloadClick}>
        <Download className="h-4 w-4 mr-2" />
        Choose Template &amp; Download
      </Button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OptimizePage() {
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const jdValue = watch("jobDescription") || "";

  // New synchronous pipeline — backend returns the completed result in one request.
  // No polling needed. Backend flow: fetch profile → OpenAI → PDF → Cloudinary → response.
  const startMutation = useMutation({
    mutationFn: (d: FormData) => startOptimize({ jobDescription: d.jobDescription }),
    onSuccess: (data) => {
      setResult(data);
      setOverrides({});
      if (data.status === "completed") {
        toast.success("Resume optimized! Review and download below.");
      } else if (data.status === "failed") {
        toast.error("Optimization failed: " + (data.error ?? "Unknown error"));
      }
    },
    onError: (err) => toast.error(isRateLimitError(err)
      ? "AI rate limit — please wait a moment."
      : getErrorMessage(err)),
  });

  const isProcessing = startMutation.isPending;

  const handleDownload = async () => {
    const jobId = result?.jobId ?? (result as any)?.job_id;
    if (!jobId) return;
    await downloadOptimizedPdf(jobId, "optimized_resume.pdf");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">Generate Tailored Resume</h2>
        <p className="page-subtitle">
          Paste a Job Description — our AI tailors your master profile to it instantly.
          Then edit and download as a PDF.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: JD Input */}
        <div className="lg:col-span-7 space-y-6">
          <form
            id="optimize-form"
            onSubmit={handleSubmit((d) => startMutation.mutate(d))}
            className="space-y-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h3 className="text-lg font-medium text-foreground">Job Description</h3>
            </div>
            <Textarea
              placeholder="Paste the job description here…"
              className="h-[500px] font-sans text-sm resize-none bg-secondary/50 border-surface-border focus:border-primary-500/50 transition-colors"
              showCount
              value={jdValue}
              error={errors.jobDescription?.message}
              {...register("jobDescription")}
            />
          </form>
        </div>

        {/* Right: Options & Results */}
        <div className="lg:col-span-5 space-y-6">
          {/* Generate button */}
          <div className="rf-card p-6 border-surface-border">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-zinc-400" />
              <h3 className="text-md font-medium text-foreground">AI Optimization</h3>
            </div>
            <Button
              type="submit"
              form="optimize-form"
              variant="gradient"
              className="w-full h-12 text-md"
              loading={startMutation.isPending}
              disabled={isProcessing}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isProcessing ? "Generating…" : "Generate Tailored Resume"}
            </Button>
            {result && !isProcessing && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Optimization complete — edit below then download
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rf-card p-6 border-primary-500/30 bg-primary-500/5 relative overflow-hidden"
              >
                {/* Indeterminate progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full w-1/3 bg-primary-gradient rounded-full"
                    animate={{ x: ["0%", "300%"] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                  />
                </div>
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
                    <span className="text-sm font-medium text-foreground">AI is tailoring your profile…</span>
                  </div>
                  <StepList isPending={isProcessing} />
                  <p className="text-xs text-muted-foreground/70">This usually takes 10–20 seconds.</p>
                </div>
              </motion.div>
            )}

            {!isProcessing && result && (
              <EditableContent
                key="result"
                result={result}
                onOverridesChange={setOverrides}
                onDownloadClick={() => {
                  setPickerOpen(true);
                }}
              />
            )}

            {!isProcessing && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rf-card p-8 flex flex-col items-center justify-center text-center min-h-[200px] border-dashed border-2 border-surface-border bg-transparent"
              >
                <Sparkles className="h-8 w-8 text-muted-foreground/70 mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Your tailored content will appear here — review, edit, then download.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Picker Modal */}
      <TemplatePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Download Tailored Resume"
        overrides={overrides}
        filenameHint="tailored-resume"
      />
    </div>
  );
}
