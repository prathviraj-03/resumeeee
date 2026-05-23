"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Shield, Globe, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { getMe } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config";
import { getErrorMessage } from "@/lib/api/error";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  linkedin:  z.string().url("Must be a valid URL").optional().or(z.literal("")),
  portfolio: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword:     z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    initialData: user ?? undefined,
  });

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      apiClient.put(API_ENDPOINTS.profile.update, data),
    onSuccess: () => toast.success("Profile updated."),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      apiClient.post("/api/auth/change-password", {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password updated.");
      passwordForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const displayName = (me?.fullName ?? me?.full_name ?? me?.email ?? "User");
  const initials = getInitials(displayName);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Security */}
          <motion.section id="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rf-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />Security
            </h3>
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
              Manage your password and authentication settings. These are handled securely by our Auth Microservice.
            </div>
            <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
              <Input label="Current Password" type="password" placeholder="••••••••"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register("currentPassword")} />
              <Input label="New Password" type="password" placeholder="Min. 8 characters"
                hint="Must include uppercase and a number"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register("newPassword")} />
              <Input label="Confirm New Password" type="password" placeholder="Re-enter new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register("confirmPassword")} />
              <Button type="submit" variant="outline" size="sm" loading={passwordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </motion.section>

          {/* Upgrade banner */}
          {me?.role !== "premium" && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rf-card p-6 border-primary-500/20 bg-primary-500/5">
              <h3 className="text-base font-semibold text-foreground mb-2">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited AI optimisations, priority processing, and advanced interview modes.
              </p>
              <Button variant="gradient">Upgrade Now — $9/mo</Button>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
