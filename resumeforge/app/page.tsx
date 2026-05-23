"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Sparkles,
  Target,
  Mic,
  Brain,
  Github,
  Linkedin,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  Zap,
  ChevronRight,
  Layers,
  Cpu,
  Lock,
  Play,
  Check,
  Plus,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Interface for interactive demo steps
interface DemoStep {
  title: string;
  desc: string;
  badge: string;
  badgeVariant: "default" | "success" | "warning" | "danger";
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ats" | "interview" | "roadmap" | "templates">("ats");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // For Interactive Mock Simulation states
  const [simAtsScore, setSimAtsScore] = useState(45);
  const [simKeywordsMatched, setSimKeywordsMatched] = useState<string[]>(["React", "Next.js", "TypeScript"]);
  const [simKeywordsMissing, setSimKeywordsMissing] = useState<string[]>(["CI/CD", "Redis", "Docker"]);
  const [simNewKeyword, setSimNewKeyword] = useState("");
  const [simInterviewQuestionIndex, setSimInterviewQuestionIndex] = useState(0);
  const [simAnswerText, setSimAnswerText] = useState("");
  const [simFeedbackScore, setSimFeedbackScore] = useState<number | null>(null);
  const [simFeedbackStrengths, setSimFeedbackStrengths] = useState<string[]>([]);
  const [simFeedbackImprovements, setSimFeedbackImprovements] = useState<string[]>([]);
  const [simIsGeneratingRoadmap, setSimIsGeneratingRoadmap] = useState(false);
  const [simRoadmapWeeks, setSimRoadmapWeeks] = useState<{ week: string; topic: string; resource: string }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle simulating key matching in ATS Scorer demo
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simNewKeyword.trim()) return;
    const kw = simNewKeyword.trim();
    if (simKeywordsMissing.includes(kw)) {
      setSimKeywordsMissing(prev => prev.filter(k => k !== kw));
      setSimKeywordsMatched(prev => [...prev, kw]);
      setSimAtsScore(prev => Math.min(prev + 15, 95));
    } else if (!simKeywordsMatched.includes(kw)) {
      setSimKeywordsMatched(prev => [...prev, kw]);
      setSimAtsScore(prev => Math.min(prev + 8, 98));
    }
    setSimNewKeyword("");
  };

  // Simulating mock interview scoring
  const handleSimulateInterviewScore = () => {
    if (!simAnswerText.trim()) return;
    setSimFeedbackScore(82);
    setSimFeedbackStrengths(["Clear articulation of architecture details", "Demonstrates deep understanding of state management"]);
    setSimFeedbackImprovements(["Elaborate more on error handling & edge cases", "Structure answer using the STAR method"]);
  };

  // Simulating roadmap generation
  const handleGenerateSimRoadmap = () => {
    setSimIsGeneratingRoadmap(true);
    setTimeout(() => {
      setSimRoadmapWeeks([
        { week: "Week 1", topic: "Docker & Containerization Basics", resource: "Official Docker Docs & Katacoda Labs" },
        { week: "Week 2", topic: "CI/CD Pipeline Setup (GitHub Actions)", resource: "GitHub Learning Lab & Tailwind Tutorials" },
        { week: "Week 3", topic: "In-memory Caching with Redis & Pipelines", resource: "Redis University: RU101 Course" }
      ]);
      setSimIsGeneratingRoadmap(false);
    }, 1500);
  };

  // Safe mounting theme render to prevent layout shifts
  const renderThemeToggle = () => {
    if (!mounted) {
      return <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />;
    }
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl bg-secondary/80 hover:bg-secondary border border-border transition-all flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4.5 w-4.5 text-amber-400" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-indigo-600" />
        )}
      </button>
    );
  };

  const interviewQuestions = [
    "Tell me about a time you handled a massive performance bottleneck in a production application.",
    "How do you approach designing scalable microservice interactions with message queues?",
    "Explain how React Server Components differ from standard Client Components in Next.js 14."
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20 selection:text-primary">
      {/* ── Background Aesthetics ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] dark:bg-primary/5" />
        <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[140px] dark:bg-indigo-500/5" />
        <div className="absolute bottom-[-10%] left-[15%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] dark:bg-purple-500/5" />
        {/* Subtle grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
      </div>

      {/* ── NAVIGATION BAR ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/80 bg-background/70 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow-sm">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
              ResumeForge
              <span className="text-primary font-extrabold text-sm ml-0.5">X</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Interactive Demo</a>
            <a href="#architecture" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Architecture</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            {renderThemeToggle()}
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" className="shadow-glow-sm hover:scale-[1.02] transition-transform">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Career Intelligence Platform — Phase 6 Enabled
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-balance"
            >
              Accelerate Your Career with{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-500">
                Agentic AI Intelligence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground font-light mb-8 max-w-xl leading-relaxed"
            >
              ResumeForge-X utilizes advanced local and cloud-based AI chains to score resumes, optimize profiles, conduct tailored mock interviews, and dynamically target skill gaps with interactive roadmaps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
            >
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto font-semibold px-8 h-13 shadow-glow hover:scale-[1.03] transition-all">
                  Create Free Account <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium px-8 h-13">
                  Explore Demo <Play className="h-4 w-4 ml-1.5" />
                </Button>
              </a>
            </motion.div>

            {/* Quick trust metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-12 pt-8 border-t border-border flex flex-wrap gap-8 w-full"
            >
              <div>
                <span className="block text-2xl font-bold text-foreground">85%+</span>
                <span className="text-xs text-muted-foreground">ATS Success Rate</span>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div>
                <span className="block text-2xl font-bold text-foreground">3x</span>
                <span className="text-xs text-muted-foreground">More Interview Invitations</span>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div>
                <span className="block text-2xl font-bold text-foreground">10,000+</span>
                <span className="text-xs text-muted-foreground">Resumes Optimized</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Right Visual Presentation (Mock App Layout) */}
          <div className="lg:col-span-6 relative w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full max-w-[580px] rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-glow-lg overflow-hidden flex flex-col"
            >
              {/* Fake Window Title bar */}
              <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="text-xs font-mono text-muted-foreground ml-3">resumeforge-x_dashboard.tsx</span>
                </div>
                <Badge variant="success">✦ Agent Connected</Badge>
              </div>

              {/* Fake Dashboard layout */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Score Widget */}
                <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-card transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-muted-foreground">Overall ATS Strength</span>
                    <Target className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-foreground tracking-tight">87/100</span>
                      <span className="block text-[10px] text-success mt-1">✓ Excellent Match Score</span>
                    </div>
                    {/* Tiny animated SVG Dial chart */}
                    <div className="relative h-14 w-14 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" className="stroke-muted fill-none" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" className="stroke-primary fill-none" strokeWidth="4" strokeDasharray="150" strokeDashoffset="25" strokeLinecap="round" />
                      </svg>
                      <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
                    <div className="bg-primary h-full rounded-full w-[87%]" />
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-card transition-all">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Job Fit Target</span>
                  <div className="my-2">
                    <span className="block text-sm font-bold text-foreground truncate">Senior Architect</span>
                    <span className="text-xs text-muted-foreground truncate">Google DeepMind</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] w-fit">
                    <Clock className="h-3 w-3" /> Updated 2m ago
                  </div>
                </div>

                {/* Interactive feature preview card */}
                <div className="md:col-span-3 rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4.5 w-4.5 text-purple-400" />
                      <span className="text-xs font-semibold text-foreground">AI Skill Gap Recommendation</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">3 Roadmaps Available</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-xs font-medium">Distributed Caching with Redis</span>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-xs font-medium">CI/CD Automation Pipeline</span>
                      </div>
                      <Badge variant="default" className="bg-primary/20 text-primary">In Progress</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES (Detailed Product Walkthrough) ── */}
      <section id="features" className="py-24 bg-secondary/40 border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Core Modules</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-4">
              Everything you need to master your job application
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              ResumeForge-X streamlines the entire hiring pipeline. Build your Master Profile once and orchestrate tailored applications using smart, integrated services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary-gradient group-hover:text-white transition-all">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">ATS Score Engine</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                  Match your master resume with any Job Description instantly. Pinpoint exact keyword overlap, semantic scoring issues, and layout errors that filter you out.
                </p>
              </div>
              <a href="#demo" className="text-xs font-semibold text-primary hover:text-primary-600 inline-flex items-center gap-1.5 mt-2 transition-colors">
                Try ATS Scorer <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Tailored Optimization</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                  Automatically inject required professional achievements, action verbs, and tech tokens into your profile dynamically to create an optimized single-page PDF.
                </p>
              </div>
              <a href="#demo" className="text-xs font-semibold text-indigo-400 hover:text-indigo-600 inline-flex items-center gap-1.5 mt-2 transition-colors">
                View Optimizer <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">JD-Aware Mock Interviews</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                  Generate mock questions based on the targeted job role and JD. Answer via audio or text and receive professional scoring and comprehensive STAR feedback.
                </p>
              </div>
              <a href="#demo" className="text-xs font-semibold text-purple-400 hover:text-purple-600 inline-flex items-center gap-1.5 mt-2 transition-colors">
                Start Mock Session <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Skill Gap Roadmaps</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                  Find exact missing requirements for your dream job. Receive a customized learning roadmap, step-by-step milestones, and handpicked resources to study.
                </p>
              </div>
              <a href="#demo" className="text-xs font-semibold text-emerald-400 hover:text-emerald-600 inline-flex items-center gap-1.5 mt-2 transition-colors">
                Generate Roadmap <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PRODUCT DEMO / WALKTHROUGH ── */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Interactive Playground</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-4">
              Experience the core modules in real-time
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              Interact with the live simulator below. Get a feel for how ResumeForge-X guides and tailors your profile.
            </p>
          </div>

          {/* Interactive Demo Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Button
              variant={activeTab === "ats" ? "default" : "outline"}
              onClick={() => setActiveTab("ats")}
              className="rounded-full px-6 transition-all"
            >
              <Target className="h-4 w-4 mr-1.5" /> ATS Scorer
            </Button>
            <Button
              variant={activeTab === "interview" ? "default" : "outline"}
              onClick={() => setActiveTab("interview")}
              className="rounded-full px-6 transition-all"
            >
              <Mic className="h-4 w-4 mr-1.5" /> Mock Interview
            </Button>
            <Button
              variant={activeTab === "roadmap" ? "default" : "outline"}
              onClick={() => setActiveTab("roadmap")}
              className="rounded-full px-6 transition-all"
            >
              <Brain className="h-4 w-4 mr-1.5" /> Skill Roadmaps
            </Button>
            <Button
              variant={activeTab === "templates" ? "default" : "outline"}
              onClick={() => setActiveTab("templates")}
              className="rounded-full px-6 transition-all"
            >
              <Layers className="h-4 w-4 mr-1.5" /> Resume Templates
            </Button>
          </div>

          {/* Tab content area */}
          <div className="border border-border/80 bg-card/40 backdrop-blur-xl rounded-2xl shadow-glow-sm overflow-hidden min-h-[460px]">
            <AnimatePresence mode="wait">
              {activeTab === "ats" && (
                <motion.div
                  key="ats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-5">
                    <Badge variant="success">Interactive Simulator</Badge>
                    <h3 className="text-2xl font-bold">Try adding missing keywords to increase your score</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      Your master profile matches <strong>React, Next.js, and TypeScript</strong>, but lacks advanced architecture tags. Add keywords from the job description below to dynamically simulate a real ATS score optimization.
                    </p>
                    <form onSubmit={handleAddKeyword} className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="e.g. CI/CD, Redis, Docker"
                        value={simNewKeyword}
                        onChange={(e) => setSimNewKeyword(e.target.value)}
                        className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button type="submit">Add</Button>
                    </form>
                    <div className="text-xs text-muted-foreground">
                      Try typing <strong>&quot;CI/CD&quot;</strong>, <strong>&quot;Redis&quot;</strong>, or <strong>&quot;Docker&quot;</strong> to watch the score bump.
                    </div>
                  </div>

                  <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Dynamic ATS Strength Score</span>
                        <div className="text-3xl font-extrabold text-foreground mt-1">{simAtsScore} / 100</div>
                      </div>
                      <div className="h-10 px-3 rounded-lg bg-secondary/80 border border-border flex items-center justify-center font-mono text-xs">
                        {simAtsScore >= 80 ? "🔥 Highly Optimized" : simAtsScore >= 60 ? "⚡ Modest Fit" : "⚠️ Needs Improvement"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">Matched Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {simKeywordsMatched.map((k) => (
                          <div key={k} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                            <Check className="h-3.5 w-3.5" /> {k}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">Missing Target Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {simKeywordsMissing.length > 0 ? (
                          simKeywordsMissing.map((k) => (
                            <div key={k} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                              <Plus className="h-3.5 w-3.5" /> {k}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-success font-medium">✓ No missing target keywords! Excellent!</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "interview" && (
                <motion.div
                  key="interview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                    <div>
                      <Badge variant="success">Interactive Simulator</Badge>
                      <h3 className="text-2xl font-bold mt-2">JD-Aware AI Mock Interviewing</h3>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        Choose a practice question based on your JD. Type a short sample answer to simulate scoring and detailed STAR evaluation structure.
                      </p>
                      <div className="space-y-2 mt-4">
                        {interviewQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSimInterviewQuestionIndex(idx);
                              setSimFeedbackScore(null);
                              setSimFeedbackStrengths([]);
                              setSimFeedbackImprovements([]);
                            }}
                            className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                              simInterviewQuestionIndex === idx
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-secondary/40 border-border hover:bg-secondary text-muted-foreground"
                            }`}
                          >
                            Question {idx + 1}: {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="text-xs font-semibold text-foreground">
                      Question Selected: &quot;{interviewQuestions[simInterviewQuestionIndex]}&quot;
                    </div>
                    <textarea
                      placeholder="Type your answer response here (e.g. 'I managed state in Next.js using Zustand and optimized rendering with memoization...')"
                      value={simAnswerText}
                      onChange={(e) => setSimAnswerText(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
                    />
                    <Button onClick={handleSimulateInterviewScore} disabled={!simAnswerText.trim()} className="w-full">
                      Submit and Analyze Answer
                    </Button>

                    {simFeedbackScore && (
                      <div className="pt-4 border-t border-border space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">AI Grading Score</span>
                          <span className="text-lg font-bold text-success">{simFeedbackScore}/100</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="rounded-lg p-3 bg-success/5 border border-success/15 space-y-1">
                            <span className="text-[10px] font-bold text-success uppercase">Strengths Identified</span>
                            {simFeedbackStrengths.map((s, i) => (
                              <div key={i} className="text-xs font-light text-foreground flex items-start gap-1">
                                <Check className="h-3 w-3 text-success mt-0.5 shrink-0" /> {s}
                              </div>
                            ))}
                          </div>
                          <div className="rounded-lg p-3 bg-warning/5 border border-warning/15 space-y-1">
                            <span className="text-[10px] font-bold text-warning uppercase">Areas of Improvement</span>
                            {simFeedbackImprovements.map((s, i) => (
                              <div key={i} className="text-xs font-light text-foreground flex items-start gap-1">
                                <Plus className="h-3 w-3 text-warning mt-0.5 shrink-0 rotate-45" /> {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "roadmap" && (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-5">
                    <Badge variant="success">Interactive Simulator</Badge>
                    <h3 className="text-2xl font-bold">Bridge Your Professional Gaps</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      Select target roles and see how ResumeForge-X parses job descriptions to construct bespoke learning paths with weekly study plans and real reference resources.
                    </p>
                    <Button onClick={handleGenerateSimRoadmap} disabled={simIsGeneratingRoadmap} className="w-full">
                      {simIsGeneratingRoadmap ? "Analyzing requirements..." : "Simulate Learning Roadmap"}
                    </Button>
                  </div>

                  <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 space-y-4 min-h-[220px] flex flex-col justify-center">
                    {simIsGeneratingRoadmap ? (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <span className="text-xs text-muted-foreground">Scrubbing learning pathways database...</span>
                      </div>
                    ) : simRoadmapWeeks.length > 0 ? (
                      <div className="space-y-3">
                        {simRoadmapWeeks.map((item, idx) => (
                          <div key={idx} className="flex gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground">{item.week}: {item.topic}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Source: {item.resource}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-10">
                        Click the button to simulate a custom AI roadmap generation.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "templates" && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 space-y-8"
                >
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <Badge variant="success">Interactive Showcase</Badge>
                    <h3 className="text-2xl font-bold">Premium ATS-Compliant Layouts</h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      Export your single-page or two-page CV using validated professional spacing guidelines. Tested to bypass parsing algorithms cleanly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { name: "Executive Suite", type: "Classic Corporate", desc: "Optimized for management, Finance, and Enterprise consultancy roles." },
                      { name: "Tech Minimalist", type: "Engineering Lead", desc: "Heavy emphasis on core tech stack, code repos, and technical impact." },
                      { name: "Modern Startup", type: "Creative Product", desc: "Slight contemporary details perfect for fast-growing technology companies." }
                    ].map((tpl, i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all text-left">
                        <div className="h-40 bg-secondary/80 rounded-lg border border-border mb-4 flex items-center justify-center text-xs text-muted-foreground font-mono">
                          [ Template Preview ]
                        </div>
                        <div className="text-sm font-bold text-foreground">{tpl.name}</div>
                        <div className="text-[10px] text-primary font-medium mt-0.5">{tpl.type}</div>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed mt-2">{tpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL ARCHITECTURE SECTION ── */}
      <section id="architecture" className="py-24 bg-secondary/40 border-y border-border px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <Badge variant="default" className="bg-primary/20 text-primary">System Architecture</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Enterprise-Grade Microservice Execution Pipeline
            </h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              ResumeForge-X is engineered for high performance and cost efficiency. It separates computation-heavy tasks like AI chain executions, database writes, and PDF compile triggers into isolated microservices.
            </p>
            <div className="space-y-4">
              {[
                { title: "Gateway Router", desc: "Next.js routing layer with built-in API proxying, JWT-based security layers, and client-side caching." },
                { title: "AI Microservice Workers", desc: "FastAPI server running LangChain query chains, token tracking, and vector indexing." },
                { title: "Local Ollama Core Integration", desc: "Easily switch model bindings to locally run open-source LLMs like Llama 3 to maintain data isolation." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{item.title}</div>
                    <div className="text-xs text-muted-foreground font-light mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Diagram Mock */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="h-4.5 w-4.5 text-primary" /> Multi-Service Component Stack
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Status: Stable</span>
              </div>

              {/* Architecture visual boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-primary uppercase">Frontend Gateway</span>
                  <div className="text-xs font-bold text-foreground">Next.js WebApp</div>
                  <p className="text-[10px] text-muted-foreground">React components, tailwind hooks, and state management.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">AI Processing Service</span>
                  <div className="text-xs font-bold text-foreground">Python FastAPI</div>
                  <p className="text-[10px] text-muted-foreground">Ollama integration, LangChain scoring pipelines, and token analytics.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Worker Queue</span>
                  <div className="text-xs font-bold text-foreground">Celery &amp; Redis</div>
                  <p className="text-[10px] text-muted-foreground">Asynchronous interview session scoring and bulk data migrations.</p>
                </div>
              </div>

              {/* Security and Database */}
              <div className="rounded-xl border border-border bg-secondary/80 p-4 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">PostgreSQL &amp; Redis Storage</div>
                    <div className="text-[10px] text-muted-foreground">User master profiles, credential security, and cache layers.</div>
                  </div>
                </div>
                <Badge variant="success">SSL Secure</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Frequently Asked Questions</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-4">
            Answers to your queries
          </h2>
          <p className="text-muted-foreground font-light leading-relaxed text-sm">
            Everything you need to know about the pricing models, privacy safeguards, and Ollama operations.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the ATS matching algorithm evaluate my resume?",
              a: "ResumeForge-X performs a deep semantic parsing of your resume text alongside the Target Job Description. It checks for precise keywords, essential technology badges, years of professional expertise, and organizational alignment. The final score highlights key missing attributes so you can make informed adjustments."
            },
            {
              q: "Can I run the AI modules locally without paying cloud LLM API costs?",
              a: "Absolutely. ResumeForge-X is engineered to support open-source models out of the box. You can bind a local Ollama service (such as Llama 3) inside your settings dashboard, keeping your operational costs at absolute zero."
            },
            {
              q: "Are my uploaded CV documents and profiles secure?",
              a: "Yes. All profile records, uploaded templates, and simulated voice logs are encrypted at rest and in transit. Next.js server middleware enforces strict session validations on all profile setup pages."
            },
            {
              q: "What types of mock interview formats are supported?",
              a: "We currently support text-based input grading. You can read dynamically generated queries tailored to your application's JD, type a structured response, and instantly obtain professional grading feedback."
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between font-bold text-sm hover:bg-secondary/40 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`h-4.5 w-4.5 text-muted-foreground transition-transform ${faqOpen === idx ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <p className="p-5 text-xs text-muted-foreground font-light leading-relaxed bg-secondary/15">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CALL-TO-ACTION BANNER ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-16 text-center space-y-6 relative overflow-hidden shadow-glow-lg">
          <div className="absolute inset-0 bg-primary/5 blur-3xl pointer-events-none -z-10" />
          <Badge variant="default" className="bg-primary/20 text-primary">Unchain your potential</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Ready to design your career path?
          </h2>
          <p className="text-muted-foreground font-light leading-relaxed max-w-xl mx-auto text-sm sm:text-base">
            Create an account in less than a minute. Optimize your first resume, start training for mock interview targets, and master new skills with Gemini power.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold px-8 shadow-glow hover:scale-[1.02] transition-transform">
                Get Started For Free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium px-8">
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ELEGANT FOOTER ── */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-xl py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 border-b border-border pb-12 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary-gradient flex items-center justify-center shadow-glow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">ResumeForge<span className="text-primary text-sm font-extrabold">X</span></span>
            </div>
            <p className="text-xs text-muted-foreground font-light leading-relaxed max-w-xs">
              ResumeForge-X leverages automated AI pipelines to elevate candidate job search effectiveness, providing detailed metrics, JD-aware interviews, and interactive roadmaps.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2 rounded-lg bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4 text-left">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Product Modules</div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">ATS Scoring</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">JD-Aware Interviews</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Skill Gap Analyzer</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Export Templates</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4 text-left">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Technical Stack</div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-default">Next.js WebApp Router</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Python FastAPI Engine</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Celery Queue workers</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">PostgreSQL &amp; Redis storage</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4 text-left">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">System Security</div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" /> JWT Session Tokens</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> SSL TLS Encrypted</li>
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-indigo-400" /> Optional Local Ollama</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <div>© 2026 ResumeForge-X. Phase 6 Completed. All Rights Reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Status Logs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}