"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Download, Trash2,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  listResumes, uploadResume, deleteResume, getDownloadUrl,
} from "@/lib/api/resume";

import { config } from "@/lib/config";
import { getErrorMessage, isRateLimitError } from "@/lib/api/error";
import { cn, formatBytes, formatRelativeTime, truncate } from "@/lib/utils";
import type { Resume } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── helpers ──────────────────────────────────────────────────────────────
function fileName(r: Resume) {
  return r.filename ?? r.original_filename ?? r.originalFilename ?? "resume";
}
function fileSize(r: Resume) {
  return r.fileSize ?? r.file_size ?? 0;
}
function uploadedAt(r: Resume) {
  return r.uploadedAt ?? r.uploaded_at ?? r.createdAt ?? r.created_at ?? "";
}
function resumeId(r: Resume) {
  return r.id ?? r.resume_id ?? "";
}

function resumeStatus(r: Resume): Resume["status"] {
  return r.status ?? "ready";
}


// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="empty-state py-24">
      <svg className="w-24 h-24 mb-6 opacity-30" viewBox="0 0 96 96" fill="none">
        <rect x="12" y="8" width="52" height="68" rx="6" stroke="#6366f1" strokeWidth="2" fill="none"/>
        <rect x="28" y="24" width="28" height="2" rx="1" fill="#6366f1" opacity="0.5"/>
        <rect x="28" y="32" width="22" height="2" rx="1" fill="#6366f1" opacity="0.3"/>
        <rect x="28" y="40" width="25" height="2" rx="1" fill="#6366f1" opacity="0.3"/>
        <circle cx="72" cy="72" r="18" fill="#1C1C1F" stroke="#27272A" strokeWidth="2"/>
        <path d="M72 64v16M64 72h16" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">No resumes yet</h3>
      <p className="text-sm text-zinc-600 mb-6 max-w-xs text-center">
        Upload your first resume to start scoring, optimizing, and practicing interviews.
      </p>
      <Button onClick={onUpload} variant="gradient">
        <Upload className="h-4 w-4" />Upload Resume
      </Button>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────
function UploadZone({ onFilesAccepted, uploadProgress, isUploading }: {
  onFilesAccepted: (files: File[]) => void;
  uploadProgress: number;
  isUploading: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: onFilesAccepted,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: config.maxFileSize,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "dropzone",
        isDragActive && !isDragReject && "border-primary-500/60 bg-primary-500/5",
        isDragReject && "border-danger/60 bg-danger/5",
        isUploading && "pointer-events-none"
      )}
      role="button" tabIndex={0} aria-label="Resume upload drop zone"
    >
      <input {...getInputProps()} aria-label="File input" />
      {isUploading ? (
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto">
            <Upload className="h-6 w-6 text-primary-400 animate-bounce" />
          </div>
          <div className="text-sm font-medium text-zinc-300 text-center">
            {uploadProgress < 100 ? "Uploading to Cloudinary..." : "AI Parsing in Progress..."}
          </div>

          <div className="w-48 mx-auto">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary-gradient rounded-full" initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }} transition={{ ease: "easeOut" }} />
            </div>
            <div className="text-xs text-zinc-600 mt-1.5 font-mono">{uploadProgress}%</div>
          </div>
        </div>
      ) : isDragActive ? (
        <div className="space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto">
            <Upload className="h-6 w-6 text-primary-400" />
          </div>
          <p className="text-sm font-medium text-primary-400">Release to upload</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
            <Upload className="h-6 w-6 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Drop your resume here, or <span className="text-primary-400">browse</span>
            </p>
            <p className="text-xs text-zinc-600 mt-1">PDF or DOCX · Max 10MB · Stored on Cloudinary</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Resume card ───────────────────────────────────────────────────────────
function ResumeCard({ resume, onDelete, onDownload }: {
  resume: Resume;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  const status = resumeStatus(resume);
  const STATUS_CFG = {
    ready:      { icon: CheckCircle, color: "text-success", label: "Ready" },
    uploaded:   { icon: CheckCircle, color: "text-success", label: "Uploaded" },
    parsed:     { icon: CheckCircle, color: "text-success", label: "AI Parsed" },
    processing: { icon: Clock,       color: "text-warning", label: "Processing" },
    error:      { icon: AlertCircle, color: "text-danger",  label: "Error" },

  };
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ready;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }} className="rf-card p-5 group">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="h-5 w-5 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{truncate(fileName(resume), 44)}</h3>
              <div className="flex items-center gap-3 mt-1">
                {resume.version && <span className="text-xs text-zinc-600 font-mono">v{resume.version}</span>}
                {fileSize(resume) > 0 && <span className="text-xs text-zinc-600">{formatBytes(fileSize(resume))}</span>}
                {uploadedAt(resume) && <span className="text-xs text-zinc-600">{formatRelativeTime(uploadedAt(resume))}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {(resume.isActive ?? resume.is_active) && <Badge variant="success" className="text-xs">Active</Badge>}
              <Badge variant={status === "ready" || status === "uploaded" ? "success" : status === "processing" ? "warning" : "danger"} className="text-xs">
                <cfg.icon className="h-3 w-3" />{cfg.label}
              </Badge>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" onClick={() => onDownload(resumeId(resume))} className="h-7 text-xs" aria-label="Download">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-danger hover:text-danger hover:bg-danger/10" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete &ldquo;{fileName(resume)}&rdquo;? This removes the file from Cloudinary and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(resumeId(resume))}>Delete</AlertDialogAction>
                </AlertDialogFooter>

              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const [mounted, setMounted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: listResumes,
    enabled: mounted, // Only fetch once mounted to avoid hydration issues
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadResume(file, setUploadProgress),
    onSuccess: (data) => {
      // Profile service returns the resume object directly, but we support common wrappers for robustness
      const newResume = (data as any).resume || (data as any).document || data;
      queryClient.setQueryData<Resume[]>(["resumes"], (old = []) => [newResume as Resume, ...old]);
      toast.success("Resume uploaded successfully!");
      setUploadProgress(0);
    },
    onError: (err) => {
      toast.error(isRateLimitError(err) ? "Upload rate limit — please wait." : getErrorMessage(err));
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["resumes"] });
      const prev = queryClient.getQueryData<Resume[]>(["resumes"]);
      queryClient.setQueryData<Resume[]>(["resumes"], (old = []) => 
        old.filter((r) => resumeId(r) !== id)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["resumes"], ctx.prev);
      toast.error("Failed to delete resume.");
    },
    onSuccess: () => {
      toast.success("Resume deleted.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });



  const parseMutation = useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: () => {
      toast.info("AI parsing has been moved to the Optimize section. Use 'Generate Tailored Resume' to process your profile.");
    },
  });

  const handleDownload = async (id: string) => {
    const loadingToast = toast.loading("Generating secure link...");
    try {
      const data = await getDownloadUrl(id);
      toast.dismiss(loadingToast);
      const url = data.url ?? data.download_url;
      if (!url) throw new Error("No URL received");
      
      // Open in same window or download? window.open is usually blocked.
      // We can create a temporary link and click it.
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "");
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Could not get download link.");
    }
  };


  const handleFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.size > config.maxFileSize) { toast.error("File too large — max 10MB."); return; }
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">Resume Management</h2>
        <p className="page-subtitle">Upload and manage your resumes — stored securely on Cloudinary</p>
      </div>

      <UploadZone onFilesAccepted={handleFiles} uploadProgress={uploadProgress} isUploading={uploadMutation.isPending} />

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rf-card p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !resumes || resumes.length === 0 ? (
          <EmptyState onUpload={() => {}} />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400">
                {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
              </h3>
            </div>
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3">
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resumeId(resume)}
                    resume={resume}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
