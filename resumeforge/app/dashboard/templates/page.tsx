"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  Trash2,
  Save,
  Star,
  StarOff,
  Download,
  FileText,
  Sparkles,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSupportedTokens,
  renderAndDownload,
  triggerDownload,
} from "@/lib/api/templates";
import type { ResumeTemplate, SupportedToken } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Token Palette (Read Only) ────────────────────────────────────────────────
function TokenPalette({ tokens }: { tokens: SupportedToken[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((t) => (
        <div
          key={t.token}
          title={t.description}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono
                     bg-primary-500/10 border border-primary-500/20 text-primary-400"
        >
          {t.token}
        </div>
      ))}
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  isSelected,
  onSelect,
  onDelete,
  onSetDefault,
}: {
  template: ResumeTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      onClick={onSelect}
      className={cn(
        "group relative p-3.5 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "border-primary-500/50 bg-primary-500/10"
          : "border-surface-border bg-zinc-900/50 hover:border-zinc-600"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              isSelected ? "bg-primary-500/20" : "bg-zinc-800"
            )}
          >
            <FileText
              className={cn(
                "h-4 w-4",
                isSelected ? "text-primary-400" : "text-zinc-500"
              )}
            />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium truncate",
                isSelected ? "text-zinc-100" : "text-zinc-300"
              )}
            >
              {template.name}
            </p>
            {template.description && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {template.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {template.is_default ? (
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="p-1 text-zinc-600 hover:text-yellow-400 transition-colors"
            >
              <StarOff className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-zinc-600 hover:text-danger transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {template.is_default && (
        <div className="mt-2">
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            ✦ Default
          </Badge>
        </div>
      )}

      {!template.user_id && (
        <div className="mt-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary-500/30 text-primary-400">
            System Template
          </Badge>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery<ResumeTemplate[]>({
    queryKey: ["templates"],
    queryFn: listTemplates,
  });

  const { data: tokens = [] } = useQuery<SupportedToken[]>({
    queryKey: ["template-tokens"],
    queryFn: getSupportedTokens,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("File required");
      return createTemplate({
        name: uploadName,
        description: uploadDesc,
        file: selectedFile,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template uploaded!");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to upload template"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; description?: string; is_default?: boolean }) =>
      updateTemplate(data.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setSelectedId(null);
      toast.success("Template deleted");
    },
  });

  // Handlers
  const resetForm = () => {
    setIsNew(false);
    setSelectedFile(null);
    setUploadName("");
    setUploadDesc("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (templateId: string, name: string) => {
    setDownloadingId(templateId);
    try {
      const url = await renderAndDownload(templateId);
      triggerDownload(url, `${name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
      toast.success("Resume downloaded!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Download failed — check your profile data";
      toast.error(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="page-title">Custom DOCX Templates</h2>
          <p className="page-subtitle">
            Upload your own .docx file with placeholders like{" "}
            <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-primary-400 font-mono text-xs">
              {"{{full_name}}"}
            </code>{" "}
            to generate personalized resumes.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 min-h-[600px]">
        {/* Left: Template List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Button
            variant="gradient"
            className="w-full h-11"
            onClick={() => {
              setIsNew(true);
              setSelectedId(null);
            }}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Upload New Template
          </Button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {templatesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center rf-card border-dashed">
                <FileText className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">No templates yet</p>
              </div>
            ) : (
              templates.map((t) => (
                <TemplateCard
                  key={t.template_id}
                  template={t}
                  isSelected={selectedId === t.template_id}
                  onSelect={() => {
                    setSelectedId(t.template_id);
                    setIsNew(false);
                  }}
                  onDelete={() => deleteMutation.mutate(t.template_id)}
                  onSetDefault={() => updateMutation.mutate({ id: t.template_id, is_default: true })}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Upload / Details */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isNew ? (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rf-card p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-primary-400" />
                    Upload .docx Template
                  </h3>
                  <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Template Name</label>
                    <Input
                      placeholder="e.g. Modern Professional"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Description (Optional)</label>
                    <Input
                      placeholder="e.g. Two-column layout"
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all",
                    selectedFile
                      ? "border-primary-500/50 bg-primary-500/5"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.name.endsWith(".docx")) setSelectedFile(file);
                    else toast.error("Please upload a .docx file");
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <>
                      <FileText className="h-12 w-12 text-primary-400 mb-3" />
                      <p className="text-sm font-medium text-zinc-200">{selectedFile.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                        <FileUp className="h-6 w-6 text-zinc-500" />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">
                        Click or drag your .docx template here
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">Placeholders use {"{{key}}"} syntax</p>
                    </>
                  )}
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 flex gap-3">
                  <Info className="h-5 w-5 text-primary-400 shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Make sure your .docx contains placeholders like <code className="text-primary-400">{"{{full_name}}"}</code>, 
                    <code className="text-primary-400">{"{{summary}}"}</code>, etc. You can find the full list of 
                    supported tokens below.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    disabled={!selectedFile || !uploadName || createMutation.isPending}
                    loading={createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    Upload Template
                  </Button>
                </div>
              </motion.div>
            ) : selectedId ? (
              <motion.div
                key="template-details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rf-card p-6 space-y-8"
              >
                {(() => {
                  const t = templates.find((tmp) => tmp.template_id === selectedId);
                  if (!t) return null;
                  return (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                            <FileText className="h-6 w-6 text-primary-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-zinc-100">{t.name}</h3>
                            <p className="text-sm text-zinc-500 mt-0.5">{t.description || "No description"}</p>
                          </div>
                        </div>
                        <Button
                          variant="gradient"
                          loading={downloadingId === t.template_id}
                          onClick={() => handleDownload(t.template_id, t.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download with this Template
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary-400" />
                          Supported Placeholders
                        </h4>
                        <TokenPalette tokens={tokens} />
                        <p className="text-xs text-zinc-600 italic">
                          Use these keys inside double curly braces in your Word document.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <div className="rf-card p-12 flex flex-col items-center justify-center text-center border-dashed bg-transparent h-full min-h-[400px]">
                <FileText className="h-12 w-12 text-zinc-800 mb-4" />
                <h3 className="text-lg font-medium text-zinc-500">Select a template</h3>
                <p className="text-sm text-zinc-600 mt-1 max-w-xs">
                  Choose a template from the list to see details or upload a new one to get started.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
