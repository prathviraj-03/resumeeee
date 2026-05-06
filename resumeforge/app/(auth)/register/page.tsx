"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { register as registerApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  fullName:        z.string().min(2, "Name must be at least 2 characters"),
  email:           z.string().email("Invalid email address"),
  password:        z.string().min(8, "Minimum 8 characters")
                     .regex(/[A-Z]/, "Must include an uppercase letter")
                     .regex(/[0-9]/, "Must include a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  "ATS scoring against any job description",
  "AI-powered resume optimisation (async Celery)",
  "Mock interviews with LLM real-time feedback",
  "Skill gap analysis with learning recommendations",
];

export default function RegisterPage() {
  const router = useRouter();
  const { login: loginStore } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const { user } = await registerApi(data);
      const normUser = { ...user, fullName: user.fullName ?? user.full_name ?? user.email };
      loginStore(normUser as typeof user);
      toast.success("Account created! Welcome to ResumeForge.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setError("email", { message: "An account with this email already exists" });
      else if (status === 422) setError("email", { message: msg });
      else toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Features panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-surface-card border-r border-surface-border flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="h-9 w-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100 tracking-tight">ResumeForge</span>
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-3 leading-tight">Land your dream job with AI</h2>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
            ResumeForge uses a microservices AI backend — Auth, AI, Interview, Profile and Skill Gap — all under one gateway.
          </p>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                </div>
                <span className="text-sm text-zinc-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Create your account</h1>
          <p className="text-sm text-zinc-500 mb-8">Free forever. No credit card required.</p>

          <div className="rf-card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input label="Full Name" type="text" placeholder="Jane Smith" autoComplete="name"
                leftIcon={<User className="h-4 w-4" />} error={errors.fullName?.message}
                {...register("fullName")} />
              <Input label="Email" type="email" placeholder="jane@example.com" autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message}
                {...register("email")} />
              <Input label="Password" type="password" placeholder="Min. 8 characters" autoComplete="new-password"
                leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message}
                hint="Must include uppercase and a number"
                {...register("password")} />
              <Input label="Confirm Password" type="password" placeholder="Re-enter password" autoComplete="new-password"
                leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message}
                {...register("confirmPassword")} />
              <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting} size="lg">
                Create Account<ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-4 text-xs text-zinc-600 text-center">
              By registering you agree to our{" "}
              <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline">Privacy Policy</Link>.
            </p>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-zinc-500">Already have an account? </span>
            <Link href="/login" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
