"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, Mic, Brain, Github, Linkedin, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-primary-500/30 transition-all group hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6 text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-surface-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold font-mono">RF</span>
            </div>
            <span className="text-xl font-bold text-zinc-100 tracking-tight">ResumeForge<span className="text-primary-500">-X</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/register">
              <Button variant="gradient" className="rounded-full px-6">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-4xl opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" /> Powered by Gemini & LangChain
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight text-zinc-100 mb-6 text-balance leading-tight"
          >
            Your AI-Powered <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-400 to-purple-400">Career Accelerator</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Optimize your resume for ATS systems, practice tailored mock interviews, and generate personalized learning roadmaps—all driven by intelligent AI agents.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button variant="gradient" size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto shadow-glow">
                Start For Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto border-surface-border hover:bg-zinc-800">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-t border-surface-border/50 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-zinc-100 mb-4">A complete toolkit for your career.</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">ResumeForge-X replaces multiple tools by centralizing your Master Profile and using context-aware AI microservices to guide you to your next job.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Target} 
            title="ATS Optimization Engine" 
            description="Paste a Job Description and instantly see how well your profile matches. Generate a tailored PDF resume optimized to beat the ATS."
            delay={0.1}
          />
          <FeatureCard 
            icon={Mic} 
            title="JD-Aware Interviews" 
            description="Practice mock interviews that dynamically generate questions based on the exact job you are applying for. Get real-time LLM scoring."
            delay={0.2}
          />
          <FeatureCard 
            icon={Brain} 
            title="Skill Gap Roadmaps" 
            description="Identify what you're missing for a target role. Our AI generates a week-by-week learning roadmap with real resources to bridge the gap."
            delay={0.3}
          />
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-surface-card py-24 border-t border-surface-border/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-800/50 mb-6 border border-surface-border">
            <ShieldCheck className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">Enterprise-grade architecture.</h2>
          <div className="flex flex-wrap justify-center gap-8 mt-8 text-zinc-500 font-medium text-sm">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500" /> Microservices (Python & Node)</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500" /> PostgreSQL & Redis</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500" /> Async Celery Workers</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-500" /> API Gateway Rate Limiting</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-surface-border/50 py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border border-surface-border bg-surface-card flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-400">RF</span>
            </div>
            <span className="text-sm font-medium text-zinc-500">© 2026 ResumeForge-X. Phase 6 Completed.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-zinc-500 hover:text-primary-400 transition-colors"><Github className="h-5 w-5" /></a>
            <a href="#" className="text-zinc-500 hover:text-primary-400 transition-colors"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
