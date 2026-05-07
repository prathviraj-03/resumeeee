"use client";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Phone, Linkedin, Globe, Github,
  Save, Loader2, UserCircle, Briefcase, GraduationCap,
  Plus, Trash2, ChevronRight, Brain, Sparkles,
  MapPin, Target, FolderGit2, Trophy,
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
import { cn } from "@/lib/utils";
import type { UpdateProfileRequest } from "@/lib/api/types";

// ── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  full_name:       z.string().optional().or(z.literal("")),
  phone_number:    z.string().optional().or(z.literal("")),
  location:        z.string().optional().or(z.literal("")),
  linkedin_url:    z.string().optional().or(z.literal("")),
  github_url:      z.string().optional().or(z.literal("")),
  portfolio_url:   z.string().optional().or(z.literal("")),
  summary:         z.string().max(800).optional().or(z.literal("")),
  target_role:     z.string().optional().or(z.literal("")),
  target_industry: z.string().optional().or(z.literal("")),
  years_experience:z.coerce.number().min(0).max(60).optional(),
  skills:          z.array(z.string()).optional(),
  certifications:  z.array(z.string()).optional(),
  languages:       z.array(z.string()).optional(),
  experience: z.array(z.object({
    title: z.string().min(1), company: z.string().min(1),
    duration: z.string().optional(), description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    degree: z.string().min(1), institution: z.string().min(1),
    year: z.string().optional(), cgpa: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string().min(1), description: z.string().optional(),
    tech_stack: z.string().optional(), url: z.string().optional(),
  })).optional(),
  awards: z.array(z.object({
    title: z.string().min(1), description: z.string().optional(),
  })).optional(),
});
type ProfileForm = z.infer<typeof schema>;

// ── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "identity",   label: "Identity",    icon: UserCircle },
  { id: "career",     label: "Career",      icon: Target },
  { id: "experience", label: "Experience",  icon: Briefcase },
  { id: "education",  label: "Education",   icon: GraduationCap },
  { id: "projects",   label: "Projects",    icon: FolderGit2 },
  { id: "skills",     label: "Skills",      icon: Brain },
  { id: "awards",     label: "Awards",      icon: Trophy },
] as const;
type TabId = typeof TABS[number]["id"];

// ── TagInput helper ──────────────────────────────────────────────────────────
function TagInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); setInput(""); }
  };
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <Input placeholder={`Add ${label.toLowerCase()}…`} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
        <Button type="button" variant="outline" className="shrink-0" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <Badge key={v} className="pl-3 pr-1 py-1 gap-2 bg-zinc-800 text-zinc-300 border-zinc-700">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))}
              className="p-0.5 rounded-full hover:text-red-400 text-zinc-500 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {values.length === 0 && <p className="text-xs text-zinc-600 italic">None added yet.</p>}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabId>("identity");

  useEffect(() => { setMounted(true); }, []);

  const { data: authData } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: profileData, isLoading } = useQuery({ queryKey: ["user-profile"], queryFn: getUserProfile });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isDirty } } =
    useForm<ProfileForm>({ resolver: zodResolver(schema), defaultValues: { skills: [], certifications: [], languages: [], experience: [], education: [], projects: [], awards: [] } });

  const { fields: expF,  append: addExp,  remove: rmExp  } = useFieldArray({ control, name: "experience" });
  const { fields: eduF,  append: addEdu,  remove: rmEdu  } = useFieldArray({ control, name: "education" });
  const { fields: projF, append: addProj, remove: rmProj } = useFieldArray({ control, name: "projects" });
  const { fields: awdF,  append: addAwd,  remove: rmAwd  } = useFieldArray({ control, name: "awards" });

  const skills        = watch("skills")        || [];
  const certifications= watch("certifications") || [];
  const languages     = watch("languages")     || [];

  useEffect(() => {
    if (!profileData) return;
    reset({
      full_name:       profileData.full_name        || "",
      phone_number:    profileData.phone_number      || "",
      location:        profileData.location          || "",
      linkedin_url:    profileData.linkedin_url      || "",
      github_url:      profileData.github_url        || "",
      portfolio_url:   profileData.portfolio_url     || "",
      summary:         profileData.summary           || "",
      target_role:     profileData.target_role       || "",
      target_industry: profileData.target_industry   || "",
      years_experience:profileData.years_experience  ?? undefined,
      skills:          profileData.skills            || [],
      certifications:  profileData.certifications    || [],
      languages:       profileData.languages         || [],
      experience:      (profileData.experience  as any[]) || [],
      education:       (profileData.education   as any[]) || [],
      projects:        (profileData.projects    as any[]) || [],
      awards:          (profileData.awards      as any[]) || [],
    });
  }, [profileData, reset]);

  const saveMutation = useMutation({
    mutationFn: (d: UpdateProfileRequest) => updateUserProfile(d),
    onSuccess: () => { toast.success("Profile saved!"); queryClient.invalidateQueries({ queryKey: ["user-profile"] }); },
    onError: err => toast.error(getErrorMessage(err)),
  });

  if (!mounted) return null;

  const displayName = profileData?.full_name || authData?.fullName || "User";
  const initials = getInitials(displayName);

  const slide = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Master Profile</h2>
          <p className="page-subtitle">Your source of truth for AI resume generation</p>
        </div>
        <Button onClick={handleSubmit(d => saveMutation.mutate(d))} variant="gradient"
          disabled={!isDirty || saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                tab === t.id
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent")}>
              <t.icon className={cn("h-4 w-4", tab === t.id ? "text-primary-400" : "text-zinc-600")} />
              {t.label}
              {tab === t.id && <ChevronRight className="ml-auto h-3 w-3" />}
            </button>
          ))}

          <div className="mt-6 p-4 rounded-2xl bg-zinc-800/30 border border-surface-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-warning" />
              <span className="text-xs font-bold text-zinc-300 uppercase">AI Power</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Complete all sections so our AI can generate high-scoring resumes for any job in seconds.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <form className="space-y-6">
            <AnimatePresence mode="wait">

              {/* ── IDENTITY ─────────────────────────────────────────────── */}
              {tab === "identity" && (
                <motion.div key="identity" {...slide} className="rf-card p-8 space-y-6">
                  <div className="flex items-center gap-5 mb-2">
                    <div className="h-16 w-16 rounded-2xl bg-primary-gradient p-0.5 shadow-glow-sm">
                      <div className="h-full w-full rounded-[14px] bg-zinc-900 flex items-center justify-center text-xl font-bold text-primary-400">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">{displayName}</h3>
                      <p className="text-sm text-zinc-500">{authData?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Full Name"    {...register("full_name")}    leftIcon={<User    className="h-4 w-4" />} />
                    <Input label="Phone"        {...register("phone_number")} leftIcon={<Phone   className="h-4 w-4" />} />
                    <Input label="Location"     {...register("location")}     leftIcon={<MapPin  className="h-4 w-4" />} placeholder="City, Country" />
                    <Input label="LinkedIn URL" {...register("linkedin_url")} leftIcon={<Linkedin className="h-4 w-4" />} type="url" />
                    <Input label="GitHub URL"   {...register("github_url")}   leftIcon={<Github  className="h-4 w-4" />} type="url" />
                    <Input label="Portfolio"    {...register("portfolio_url")}leftIcon={<Globe   className="h-4 w-4" />} type="url" />
                  </div>
                  <Textarea label="Professional Summary" {...register("summary")}
                    placeholder="Briefly describe your expertise and what you bring to the table…" className="h-32" />
                </motion.div>
              )}

              {/* ── CAREER INTENT ─────────────────────────────────────────── */}
              {tab === "career" && (
                <motion.div key="career" {...slide} className="rf-card p-8 space-y-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Career Intent</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Target Role"         {...register("target_role")}     leftIcon={<Target className="h-4 w-4" />} placeholder="e.g. Software Engineer" />
                    <Input label="Target Industry"     {...register("target_industry")} leftIcon={<Briefcase className="h-4 w-4" />} placeholder="e.g. FinTech, Healthcare" />
                    <Input label="Years of Experience" {...register("years_experience")} type="number" min={0} max={60} placeholder="e.g. 3" />
                  </div>
                </motion.div>
              )}

              {/* ── EXPERIENCE ────────────────────────────────────────────── */}
              {tab === "experience" && (
                <motion.div key="experience" {...slide} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Work History</h3>
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => addExp({ title: "", company: "", duration: "", description: "" })}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add
                    </Button>
                  </div>
                  {expF.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <Briefcase className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No experience added yet.</p>
                    </div>
                  )}
                  {expF.map((f, i) => (
                    <div key={f.id} className="rf-card p-6 relative group space-y-4">
                      <button type="button" onClick={() => rmExp(i)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Job Title" {...register(`experience.${i}.title`)} />
                        <Input label="Company"   {...register(`experience.${i}.company`)} />
                      </div>
                      <Input label="Duration (e.g. Jan 2022 – Present)" {...register(`experience.${i}.duration`)} />
                      <Textarea label="Key Achievements" {...register(`experience.${i}.description`)} className="h-24"
                        placeholder="Describe responsibilities and achievements…" />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── EDUCATION ─────────────────────────────────────────────── */}
              {tab === "education" && (
                <motion.div key="education" {...slide} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Education</h3>
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => addEdu({ degree: "", institution: "", year: "", cgpa: "" })}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add
                    </Button>
                  </div>
                  {eduF.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <GraduationCap className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No education added yet.</p>
                    </div>
                  )}
                  {eduF.map((f, i) => (
                    <div key={f.id} className="rf-card p-6 relative group">
                      <button type="button" onClick={() => rmEdu(i)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Degree"      {...register(`education.${i}.degree`)} />
                        <Input label="Institution" {...register(`education.${i}.institution`)} />
                        <Input label="Year"        {...register(`education.${i}.year`)} placeholder="e.g. 2024" />
                        <Input label="CGPA / Grade" {...register(`education.${i}.cgpa`)} placeholder="e.g. 8.5 / 10" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── PROJECTS ──────────────────────────────────────────────── */}
              {tab === "projects" && (
                <motion.div key="projects" {...slide} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Projects</h3>
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => addProj({ name: "", description: "", tech_stack: "", url: "" })}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add
                    </Button>
                  </div>
                  {projF.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <FolderGit2 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No projects added yet.</p>
                    </div>
                  )}
                  {projF.map((f, i) => (
                    <div key={f.id} className="rf-card p-6 relative group space-y-4">
                      <button type="button" onClick={() => rmProj(i)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Project Name" {...register(`projects.${i}.name`)} />
                        <Input label="Tech Stack"   {...register(`projects.${i}.tech_stack`)} placeholder="e.g. React, Node.js, PostgreSQL" />
                      </div>
                      <Input label="Project URL / GitHub Link" {...register(`projects.${i}.url`)} type="url" leftIcon={<Globe className="h-4 w-4" />} />
                      <Textarea label="Description" {...register(`projects.${i}.description`)} className="h-24"
                        placeholder="What the project does and your role in it…" />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* ── SKILLS ────────────────────────────────────────────────── */}
              {tab === "skills" && (
                <motion.div key="skills" {...slide} className="rf-card p-8 space-y-8">
                  <TagInput label="Skills"
                    values={skills}
                    onChange={v => setValue("skills", v, { shouldDirty: true })} />
                  <TagInput label="Certifications"
                    values={certifications}
                    onChange={v => setValue("certifications", v, { shouldDirty: true })} />
                  <TagInput label="Languages Spoken"
                    values={languages}
                    onChange={v => setValue("languages", v, { shouldDirty: true })} />
                </motion.div>
              )}

              {/* ── AWARDS ────────────────────────────────────────────────── */}
              {tab === "awards" && (
                <motion.div key="awards" {...slide} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Awards & Achievements</h3>
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => addAwd({ title: "", description: "" })}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add
                    </Button>
                  </div>
                  {awdF.length === 0 && (
                    <div className="rf-card p-12 text-center border-dashed border-zinc-800">
                      <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No awards added yet.</p>
                    </div>
                  )}
                  {awdF.map((f, i) => (
                    <div key={f.id} className="rf-card p-6 relative group space-y-4">
                      <button type="button" onClick={() => rmAwd(i)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Input label="Award Title" {...register(`awards.${i}.title`)} />
                      <Textarea label="Description" {...register(`awards.${i}.description`)} className="h-20"
                        placeholder="What you received it for…" />
                    </div>
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
}
