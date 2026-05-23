"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ email: z.string().email("Invalid email address") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">ResumeForge</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Reset password</h1>
          <p className="text-sm text-muted-foreground">We will send a recovery link to your email</p>
        </div>
        <div className="rf-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Check your inbox</h3>
                <p className="text-sm text-muted-foreground">A password reset link has been sent. It expires shortly.</p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2"><ArrowLeft className="h-4 w-4" />Back to login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input label="Email" type="email" placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message}
                {...register("email")} />
              <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting}>
                Send Reset Link
              </Button>
              <Link href="/login">
                <Button type="button" variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4" />Back to login
                </Button>
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
