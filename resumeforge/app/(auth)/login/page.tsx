"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/api/profile";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { login: loginStore } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const { user } = await login(data);
      // Fetch the full profile to get missing fields like is_setup_done
      const profile = await getUserProfile().catch(() => ({} as import("@/lib/api/types").UserProfile));
      // Normalise snake_case fields
      const normUser = {
        ...profile,
        ...user,
        fullName: user.fullName ?? user.full_name ?? user.email,
        is_setup_done: profile.is_setup_done ?? user.is_setup_done,
      };
      loginStore(normUser as typeof user);
      const name = normUser.fullName.split(" ")[0];
      toast.success(`Welcome back, ${name}!`);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setError("password", { message: "Incorrect email or password" });
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100 tracking-tight">ResumeForge</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-500">Sign in to continue to your dashboard</p>
        </div>

        <div className="rf-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message}
              {...register("email")} />
            <Input label="Password" type="password" placeholder="••••••••" autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message}
              {...register("password")} />
            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-primary-400 transition-colors">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting} size="lg">
              Sign In<ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-sm text-zinc-500">Don&apos;t have an account? </span>
            <Link href="/register" className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign up free
            </Link>
          </div>
        </div>

        {/* Gateway info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-zinc-700 font-mono">POST {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
