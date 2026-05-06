"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, Mail, Phone, Linkedin, Globe, 
  ShieldCheck, Save, Loader2, UserCircle,
  Briefcase, GraduationCap, Plus, Trash2, 
  ChevronRight, Brain, Sparkles, FileText
} from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, updateUserProfile } from "@/lib/api/profile";
import { getMe } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/error";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { UpdateProfileRequest } from "@/lib/api/types";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").optional().or(z.literal("")),
  phone_number: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  summary: z.string().max(500, "Summary too long").optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company is required"),
    duration: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    degree: z.string().min(1, "Degree is required"),
    institution: z.string().min(1, "Institution is required"),
    year: z.string().optional(),
  })).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "skills">("personal");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: authData } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile"], queryFn: getUserProfile,
  });

  const {
    register, handleSubmit, reset, control, watch, setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      experience: [],
      education: [],
      skills: [],
    }
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });

  const currentSkills = watch("skills") || [];

  useEffect(() => {
    if (profileData) {
      reset({
        full_name: profileData.full_name || "",
        phone_number: profileData.phone_number || "",
        linkedin_url: profileData.linkedin_url || "",
        portfolio_url: profileData.portfolio_url || "",
        summary: profileData.summary || "",
        skills: profileData.skills || [],
        experience: (profileData.experience as any[]) || [],
        education: (profileData.education as any[]) || [],
      });
    }
  }, [profileData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateUserProfile(data),
    onSuccess: () => {
      toast.success("Master Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const addSkill = () => {
    if (skillInput && !currentSkills.includes(skillInput)) {
      setValue("skills", [...currentSkills, skillInput], { shouldDirty: true });
      setSkillInput("");
    }
  };

  if (!mounted) return null;

  const displayName = profileData?.full_name || authData?.fullName || authData?.email || "User";
  const initials = getInitials(displayName);

  const TABS = [
    { id: "personal",   label: "Identity",    icon: UserCircle },
    { id: "experience", label: "Experience",  icon: Briefcase },
    { id: "education",  label: "Education",   icon: GraduationCap },
    { id: "skills",     label: "Skills & AI", icon: Brain },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Master Profile</h2>
          <p className="page-subtitle">Your central source of truth for AI resume generation</p>
        </div>
        <Button 
          onClick={handleSubmit((d) => updateMutation.mutate(d))}
          variant="gradient"
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Sync Master Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                activeTab === tab.id 
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent"
              )}
            >
              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary-400" : "text-zinc-600")} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="ml-auto h-3 w-3" />}
            </button>
          ))}
          
          <div className="mt-8 p-5 rounded-2xl bg-zinc-800/30 border border-surface-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-warning" />
              <span className="text-xs font-bold text-zinc-300 uppercase">AI Power</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Filling this Master Profile allows our AI to generate high-scoring resumes for any job in seconds without you needing to re-type anything.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <form className="space-y-6">
            <AnimatePresence mode="wait">
              {/* PERSONAL / IDENTITY */}
              {activeTab === "personal" && (
                <motion.div 
                  key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rf-card p-8 space-y-6"
                >
                  <div className="flex items-center gap-6 mb-4">
                    <div className="h-20 w-20 rounded-2xl bg-primary-gradient p-0.5 shadow-glow-sm">
                      <div className="h-full w-full rounded-[14px] bg-zinc-900 flex items-center justify-center text-2xl font-bold text-primary-400">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">{displayName}</h3>
                      <p className="text-sm text-zinc-500">{authData?.email}</p>
                      <Badge variant="outline" className="mt-2 text-[10px] uppercase border-primary-500/30 text-primary-400">Identity Verified</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Full Name" {...register("full_name")} error={errors.full_name?.message} leftIcon={<User className="h-4 w-4" />} />
                    <Input label="Phone Number" {...register("phone_number")} error={errors.phone_number?.message} leftIcon={<Phone className="h-4 w-4" />} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="LinkedIn" type="url" {...register("linkedin_url")} error={errors.linkedin_url?.message} leftIcon={<Linkedin className="h-4 w-4" />} />
                    <Input label="Portfolio" type="url" {...register("portfolio_url")} error={errors.portfolio_url?.message} leftIcon={<Globe className="h-4 w-4" />} />
                  </div>

                  <Textarea label="Professional Summary" placeholder="Briefly describe your expertise..." {...register("summary")} error={errors.summary?.message} className="h-32" />
                </motion.div>
              )}

              {/* EXPERIENCE */}
              {activeTab === "experience" && (
                <motion.div 
                  key="experience" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Work History</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendExp({ title: "", company: "", duration: "", description: "" })} className="h-8">
                      <Plus className="h-3.5 w-3.5 mr-1" />Add Experience
                    </Button>
                  </div>
                  
                  {expFields.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <Briefcase className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No experience added yet.</p>
                    </div>
                  )}

                  {expFields.map((field, index) => (
                    <div key={field.id} className="rf-card p-6 relative group">
                      <button type="button" onClick={() => removeExp(index)} className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input label="Job Title" {...register(`experience.${index}.title`)} />
                        <Input label="Company" {...register(`experience.${index}.company`)} />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <Input label="Duration (e.g. 2020 - Present)" {...register(`experience.${index}.duration`)} />
                        <Textarea label="Key Achievements" placeholder="Use bullet points..." {...register(`experience.${index}.description`)} className="h-24" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* EDUCATION */}
              {activeTab === "education" && (
                <motion.div 
                  key="education" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Education</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendEdu({ degree: "", institution: "", year: "" })} className="h-8">
                      <Plus className="h-3.5 w-3.5 mr-1" />Add Education
                    </Button>
                  </div>

                  {eduFields.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <GraduationCap className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No education added yet.</p>
                    </div>
                  )}

                  {eduFields.map((field, index) => (
                    <div key={field.id} className="rf-card p-6 relative group">
                      <button type="button" onClick={() => removeEdu(index)} className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1"><Input label="Degree" {...register(`education.${index}.degree`)} /></div>
                        <div className="md:col-span-1"><Input label="Institution" {...register(`education.${index}.institution`)} /></div>
                        <div className="md:col-span-1"><Input label="Year" {...register(`education.${index}.year`)} /></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* SKILLS */}
              {activeTab === "skills" && (
                <motion.div 
                  key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rf-card p-8 space-y-6"
                >
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary-400" /> Skill Inventory
                  </h3>
                  
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Add a skill (e.g. React, Python, Project Management)" 
                      value={skillInput} 
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} variant="outline" className="shrink-0">Add</Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentSkills.map((skill) => (
                      <Badge 
                        key={skill} 
                        className="pl-3 pr-1 py-1 gap-2 bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => setValue("skills", currentSkills.filter(s => s !== skill), { shouldDirty: true })}
                          className="p-0.5 rounded-full hover:bg-danger/20 hover:text-danger text-zinc-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {currentSkills.length === 0 && (
                      <p className="text-xs text-zinc-600 italic">No skills added. Add some to help the AI match you to jobs.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
}
