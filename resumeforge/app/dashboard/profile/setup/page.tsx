"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Briefcase, ChevronRight, ChevronLeft,
  Save, Loader2, Sparkles, GraduationCap, Link as LinkIcon, Plus, Trash2, Github, Linkedin, Globe
} from "lucide-react";
import { toast } from "sonner";
import { setupProfile } from "@/lib/api/profile";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Combine the schemas for the steps
const setupSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Must be a valid email"),
  phone_number: z.string().min(5, "Phone number is required"),
  location: z.string().optional(),
  target_role: z.string().min(2, "Target role is required"),
  years_experience: z.coerce.number().min(0).optional(),
  
  summary: z.string().min(50, "Summary should be at least 50 characters to help AI").max(1000),
  
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
  certifications: z.array(z.string()).optional(),
  
  projects: z.array(z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(10, "Brief description is required"),
    url: z.string().optional(),
  })).min(1, "At least one project is required to stand out"),
  
  skills: z.array(z.string()).min(3, "Add at least 3 skills"),
  
  linkedin_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  portfolio_url: z.string().url().optional().or(z.literal("")),
});

type SetupForm = z.infer<typeof setupSchema>;

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Professional Summary" },
  { id: 3, title: "Experience" },
  { id: 4, title: "Education" },
  { id: 5, title: "Projects & Skills" },
];

export default function ProfileSetupWizard() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      full_name: user?.fullName || "",
      email: user?.email || "",
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
    }
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: "projects" });

  const currentSkills = watch("skills") || [];
  const currentCerts = watch("certifications") || [];

  const addSkill = () => {
    if (skillInput && !currentSkills.includes(skillInput)) {
      setValue("skills", [...currentSkills, skillInput], { shouldValidate: true });
      setSkillInput("");
    }
  };

  const addCert = () => {
    if (certInput && !currentCerts.includes(certInput)) {
      setValue("certifications", [...currentCerts, certInput], { shouldValidate: true });
      setCertInput("");
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    switch (step) {
      case 1: fieldsToValidate = ["full_name", "email", "phone_number", "location", "target_role", "years_experience"]; break;
      case 2: fieldsToValidate = ["summary"]; break;
      case 3: fieldsToValidate = ["experience"]; break;
      case 4: fieldsToValidate = ["education", "certifications"]; break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => Math.min(s + 1, STEPS.length));
    } else {
      toast.error("Please fill out all required fields correctly before proceeding.");
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onInvalid = () => {
    toast.error("Please fix the errors on this page before submitting.");
  };

  const onSubmit = async (data: SetupForm) => {
    setIsSubmitting(true);
    try {
      const response = await setupProfile(data);
      updateUser({ is_setup_done: true, completion_score: response.completion_score });
      toast.success("Profile setup complete! Welcome to ResumeForge.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Complete Your Master Profile</h1>
        <p className="text-muted-foreground text-sm mb-6">This information allows our AI to generate targeted resumes and interviews for you.</p>
        
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-secondary -z-10" />
          <div className="absolute left-0 top-1/2 h-0.5 bg-primary-500 transition-all duration-300 -z-10" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.id ? "bg-primary-500 text-white shadow-glow-sm" : "bg-secondary text-muted-foreground border border-border"}`}>
                {s.id}
              </div>
              <span className={`text-[10px] uppercase tracking-wider hidden sm:block ${step >= s.id ? "text-foreground/80 font-medium" : "text-muted-foreground/70"}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="rf-card p-6 md:p-10 min-h-[400px]">
        <form id="setup-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><User className="h-5 w-5 text-primary-400" /> Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name *" {...register("full_name")} error={errors.full_name?.message} leftIcon={<User className="h-4 w-4" />} />
                  <Input label="Email *" {...register("email")} error={errors.email?.message} disabled leftIcon={<Mail className="h-4 w-4" />} />
                  <Input label="Phone Number *" {...register("phone_number")} error={errors.phone_number?.message} leftIcon={<Phone className="h-4 w-4" />} />
                  <Input label="Location (City, Country)" {...register("location")} error={errors.location?.message} leftIcon={<MapPin className="h-4 w-4" />} />
                  <Input label="Target Role * (e.g. Frontend Developer)" {...register("target_role")} error={errors.target_role?.message} leftIcon={<Briefcase className="h-4 w-4" />} />
                  <Input label="Years of Experience" type="number" {...register("years_experience")} error={errors.years_experience?.message} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary-400" /> Professional Summary</h2>
                <p className="text-sm text-muted-foreground">Provide a strong overview of your career. Our AI will use this as a base to tailor your resume for specific jobs.</p>
                <Textarea label="Summary *" placeholder="I am a software engineer with..." {...register("summary")} error={errors.summary?.message} className="h-48" />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary-400" /> Work Experience</h2>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendExp({ title: "", company: "", duration: "", description: "" })}>
                    <Plus className="h-3 w-3 mr-1" /> Add Job
                  </Button>
                </div>
                {expFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No experience added. Click &apos;Add Job&apos; if you have work history.</p>
                ) : (
                  <div className="space-y-6">
                    {expFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-secondary/50 rounded-xl border border-border relative group">
                        <button type="button" onClick={() => removeExp(index)} className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-danger rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Input label="Job Title" {...register(`experience.${index}.title`)} error={errors.experience?.[index]?.title?.message} />
                          <Input label="Company" {...register(`experience.${index}.company`)} error={errors.experience?.[index]?.company?.message} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <Input label="Duration (e.g. Jan 2020 - Present)" {...register(`experience.${index}.duration`)} />
                          <Textarea label="Achievements (Bullet points)" {...register(`experience.${index}.description`)} className="h-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary-400" /> Education & Certs</h2>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendEdu({ degree: "", institution: "", year: "" })}>
                    <Plus className="h-3 w-3 mr-1" /> Add Education
                  </Button>
                </div>
                <div className="space-y-4 mb-8">
                  {eduFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-secondary/50 rounded-xl border border-border relative">
                      <div className="md:col-span-5"><Input label="Degree / Major" {...register(`education.${index}.degree`)} error={errors.education?.[index]?.degree?.message} /></div>
                      <div className="md:col-span-5"><Input label="Institution" {...register(`education.${index}.institution`)} error={errors.education?.[index]?.institution?.message} /></div>
                      <div className="md:col-span-2 relative">
                        <Input label="Year" {...register(`education.${index}.year`)} />
                        <button type="button" onClick={() => removeEdu(index)} className="absolute top-8 right-2 text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground/80 mb-3">Certifications</h3>
                  <div className="flex gap-2 mb-4">
                    <Input placeholder="e.g. AWS Certified Solutions Architect" value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())} />
                    <Button type="button" variant="secondary" onClick={addCert}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentCerts.map(cert => (
                      <div key={cert} className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground/80 flex items-center gap-2">
                        {cert} <Trash2 className="h-3 w-3 cursor-pointer hover:text-danger" onClick={() => setValue("certifications", currentCerts.filter(c => c !== cert))} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Github className="h-5 w-5 text-primary-400" /> Key Projects *</h2>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendProj({ name: "", description: "", url: "" })}>
                      <Plus className="h-3 w-3 mr-1" /> Add Project
                    </Button>
                  </div>
                  {errors.projects?.root && <p className="text-danger text-sm mb-4">{errors.projects.root.message}</p>}
                  <div className="space-y-4">
                    {projFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-secondary/50 rounded-xl border border-border relative">
                        <button type="button" onClick={() => removeProj(index)} className="absolute top-4 right-4 text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Input label="Project Name" {...register(`projects.${index}.name`)} error={errors.projects?.[index]?.name?.message} />
                          <Input label="Project URL (optional)" {...register(`projects.${index}.url`)} />
                        </div>
                        <Textarea label="Description" {...register(`projects.${index}.description`)} error={errors.projects?.[index]?.description?.message} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground/80 mb-3">Skills *</h3>
                  {errors.skills && <p className="text-danger text-sm mb-2">{errors.skills.message}</p>}
                  <div className="flex gap-2 mb-4">
                    <Input placeholder="e.g. React, Node.js, Leadership" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                    <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentSkills.map(skill => (
                      <div key={skill} className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 text-sm flex items-center gap-2">
                        {skill} <Trash2 className="h-3 w-3 cursor-pointer hover:text-danger" onClick={() => setValue("skills", currentSkills.filter(s => s !== skill), { shouldValidate: true })} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="LinkedIn URL" {...register("linkedin_url")} leftIcon={<Linkedin className="h-4 w-4" />} />
                  <Input label="GitHub URL" {...register("github_url")} leftIcon={<Github className="h-4 w-4" />} />
                  <Input label="Portfolio URL" {...register("portfolio_url")} leftIcon={<Globe className="h-4 w-4" />} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={prevStep} disabled={step === 1 || isSubmitting}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        {step < STEPS.length ? (
          <Button variant="gradient" onClick={nextStep}>
            Next Step <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button variant="gradient" form="setup-form" type="submit" loading={isSubmitting}>
            <Save className="h-4 w-4 mr-2" /> Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
}
