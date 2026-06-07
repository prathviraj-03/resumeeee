"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, Star, ThumbsUp, ThumbsDown,
  Lightbulb, BarChart3, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { getSession, submitAnswer, endSession } from "@/lib/api/interview";
import { getErrorMessage } from "@/lib/api/error";
import { cn, getScoreColor, INTERVIEW_TYPE_LABELS } from "@/lib/utils";
import type { InterviewSession, QuestionFeedback, InterviewQuestion } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";

// ── Normalise helpers ────────────────────────────────────────────────────
function normSession(s: InterviewSession): InterviewSession {
  return {
    ...s,
    type: s.type ?? (s.role as InterviewSession["type"]),
    currentQuestionIndex: s.currentQuestionIndex ?? s.current_question_index ?? 0,
    feedback: s.feedback ?? s.responses ?? [],
    overallScore: (s.overallScore ?? s.overall_score ?? s.finalScore ?? s.final_score ?? 0) / 10,
    startedAt: s.startedAt ?? s.started_at,
    completedAt: s.completedAt ?? s.completed_at,
  };
}

function normFeedback(f: QuestionFeedback): QuestionFeedback {
  return {
    ...f,
    questionId: f.questionId ?? f.question_id,
    responseId: f.responseId ?? f.response_id,
    strengths: f.strengths ?? [],
    improvements: f.improvements ?? f.areas_for_improvement ?? [],
    idealAnswer: f.idealAnswer ?? f.ideal_answer ?? "",
  };
}

function questionText(q: InterviewQuestion): string {
  return q.text ?? q.question ?? "";
}

// ── Feedback card ────────────────────────────────────────────────────────
function FeedbackCard({ feedback }: { feedback: QuestionFeedback }) {
  const fb = normFeedback(feedback);
  const score = fb.score ?? 0;
  const color = getScoreColor((score / 10) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rf-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">Answer Feedback</h4>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4" style={{ color }} />
            <span className="text-xl font-bold font-mono" style={{ color }}>{score.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground/70">/10</span>
          </div>
        </div>

        {/* Sub-scores if backend returns them */}
        {(fb.clarity_score !== undefined || fb.technical_score !== undefined) && (
          <div className="flex gap-4 mb-3 text-xs">
            {fb.clarity_score   !== undefined && <span className="text-muted-foreground">Clarity: <span className="text-foreground/80 font-mono">{fb.clarity_score}</span></span>}
            {fb.technical_score !== undefined && <span className="text-muted-foreground">Technical: <span className="text-foreground/80 font-mono">{fb.technical_score}</span></span>}
            {fb.tone_score      !== undefined && <span className="text-muted-foreground">Tone: <span className="text-foreground/80 font-mono">{fb.tone_score}</span></span>}
          </div>
        )}

        {((fb.strengths as string[] | undefined) || []).length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-medium text-success uppercase tracking-wider">Strengths</span>
            </div>
            <ul className="space-y-1.5">
              {((fb.strengths as string[] | undefined) || []).map((s, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {((fb.improvements as string[] | undefined) || []).length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium text-warning uppercase tracking-wider">Areas to Improve</span>
            </div>
            <ul className="space-y-1.5">
              {((fb.improvements as string[] | undefined) || []).map((s, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {fb.idealAnswer && (
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary-400" />
              <span className="text-xs font-medium text-primary-400 uppercase tracking-wider">Ideal Answer Preview</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/60 rounded-lg p-3">{fb.idealAnswer}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Session summary ──────────────────────────────────────────────────────
function SessionSummary({ session: s }: { session: InterviewSession }) {
  const radar = s.radarScores ? [
    { axis: "Relevance",  value: s.radarScores.relevance },
    { axis: "Depth",      value: s.radarScores.depth },
    { axis: "Clarity",    value: s.radarScores.clarity },
    { axis: "Structure",  value: s.radarScores.structure },
    { axis: "Confidence", value: s.radarScores.confidence },
  ] : [];

  const overall = s.overallScore ?? 0;
  const overallColor = getScoreColor((overall / 10) * 100);
  const feedbackList = (s.feedback ?? []).map(normFeedback);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rf-card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">Interview Complete!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {s.type ? INTERVIEW_TYPE_LABELS[s.type] : s.role ?? "Interview"} · {s.questions?.length ?? 0} questions
          </p>
          <div className="inline-flex items-baseline gap-1">
            <span className="text-5xl font-bold font-mono" style={{ color: overallColor }}>{overall.toFixed(1)}</span>
            <span className="text-xl text-muted-foreground">/10</span>
          </div>
          <div className="text-sm mt-1" style={{ color: overallColor }}>
            {overall >= 8 ? "Excellent" : overall >= 6 ? "Good" : overall >= 4 ? "Fair" : "Needs Work"}
          </div>
          {/* Executive summary from backend */}
          {(s.summary ?? s.executive_summary) && (
            <p className="mt-4 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed bg-secondary/40 rounded-lg p-3">
              {s.summary ?? s.executive_summary}
            </p>
          )}
        </div>
      </div>

      {/* Radar chart */}
      {radar.length > 0 && (
        <div className="rf-card p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />Performance Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radar}>
              <PolarGrid stroke="#27272A" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#71717a", fontSize: 11 }} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-question breakdown */}
      {feedbackList.length > 0 && s.questions?.length > 0 && (
        <div className="rf-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">Per-Question Feedback</h4>
          </div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Question</th></tr></thead>
            <tbody>
              {s.questions.map((q, i) => (
                <tr key={q.id}>
                  <td className="font-mono text-muted-foreground">{i + 1}</td>
                  <td className="text-muted-foreground max-w-xs">
                    <span className="line-clamp-2 text-xs">{questionText(q)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button variant="gradient" className="w-full" onClick={() => window.location.href = "/dashboard/interview"}>
        Back to Interviews
      </Button>
    </motion.div>
  );
}

// ── Active session ────────────────────────────────────────────────────────
export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: rawSession, isLoading } = useQuery<InterviewSession>({
    queryKey: ["interview-session", sessionId],
    queryFn: () => getSession(sessionId),
  });

  const session = rawSession ? normSession(rawSession) : null;

  const submitMutation = useMutation({
    mutationFn: (answerText: string) => {
      const q = session!.questions[session!.currentQuestionIndex!];
      return submitAnswer(sessionId, { questionId: q.id, answerText });
    },
    onSuccess: (feedback) => {
      const fb = normFeedback(feedback);
      // Automatically proceed to next instead of showing feedback
      handleNext();
      queryClient.setQueryData<InterviewSession>(["interview-session", sessionId], (old) =>
        old ? { ...old, feedback: [...(old.feedback ?? []), fb] } : old
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const endMutation = useMutation({
    mutationFn: () => endSession(sessionId),
    onSuccess: (final) => {
      queryClient.setQueryData(["interview-session", sessionId], final);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleNext = () => {
    if (!session) return;
    const isLast = (session.currentQuestionIndex ?? 0) >= session.questions.length - 1;
    if (isLast) {
      endMutation.mutate();
    } else {
      queryClient.setQueryData<InterviewSession>(["interview-session", sessionId], (old) =>
        old ? { ...old, currentQuestionIndex: (old.currentQuestionIndex ?? 0) + 1 } : old
      );
      setAnswer("");
      setCurrentFeedback(null);
      setShowFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/dashboard/interview"}>
          Back to Interviews
        </Button>
      </div>
    );
  }

  if (session.status === "completed") return <SessionSummary session={session} />;

  const currentIdx = session.currentQuestionIndex ?? 0;
  const currentQ = session.questions[currentIdx];
  const progress = (currentIdx / session.questions.length) * 100;
  const isLast = currentIdx >= session.questions.length - 1;
  const typeLabel = session.type ? INTERVIEW_TYPE_LABELS[session.type] : session.role ?? "Interview";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <span>Question {currentIdx + 1} of {session.questions.length}</span>
          <span className="font-medium text-zinc-400">{typeLabel} · {session.difficulty}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQ?.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} className="rf-card p-7">
          <div className="text-xs text-primary-400 uppercase tracking-widest font-medium mb-3">
            {currentQ?.category ?? "Question"}
          </div>
          <p className="text-lg font-medium text-foreground leading-relaxed">{currentQ ? questionText(currentQ) : "Loading…"}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answer input */}
      <div className="space-y-4">
        <Textarea 
          label="Your Answer"
          placeholder="Type your answer here… Be specific and use real examples."
          className="h-40" 
          value={answer} 
          onChange={(e) => setAnswer(e.target.value)} 
          showCount 
          disabled={submitMutation.isPending}
        />
        <Button 
          variant="gradient" 
          className="w-full"
          onClick={() => submitMutation.mutate(answer)}
          loading={submitMutation.isPending}
          disabled={!answer.trim() || submitMutation.isPending}>
          {isLast ? "Submit & Finish" : "Submit Answer"}
        </Button>
      </div>
    </div>
  );
}
