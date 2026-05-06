"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  Loader2,
  Star,
  LayoutTemplate,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { listTemplates, renderAndDownload, triggerDownload } from "@/lib/api/templates";
import type { ResumeTemplate } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Optional override content (e.g. AI-optimized data) */
  overrides?: Record<string, any>;
  filenameHint?: string;
}

export function TemplatePickerModal({
  open,
  onClose,
  title = "Download Resume",
  overrides,
  filenameHint = "my-resume",
}: TemplatePickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: templates = [], isLoading } = useQuery<ResumeTemplate[]>({
    queryKey: ["templates"],
    queryFn: listTemplates,
    enabled: open,
  });

  const handleDownload = async () => {
    if (!selectedId) return;
    const tmpl = templates.find((t) => t.template_id === selectedId);
    setIsDownloading(true);
    try {
      // New pipeline: templateId + overrides -> AI service -> PDF
      const url = await renderAndDownload(selectedId, overrides);
      
      const fileName = `${(filenameHint || tmpl?.name || "resume").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      triggerDownload(url, fileName);
      
      toast.success("Resume downloaded!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Download failed. Check your profile.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-select the default template
  React.useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      const def = templates.find((t) => t.is_default) ?? templates[0];
      setSelectedId(def.template_id);
    }
  }, [templates, selectedId]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <LayoutTemplate className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Select your custom DOCX template</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : templates.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No templates found</p>
                <Button
                  variant="link"
                  className="text-primary-400 text-xs"
                  onClick={() => window.location.href = "/dashboard/templates"}
                >
                  Upload one first
                </Button>
              </div>
            ) : (
              templates.map((t) => (
                <button
                  key={t.template_id}
                  onClick={() => setSelectedId(t.template_id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    selectedId === t.template_id
                      ? "border-primary-500/50 bg-primary-500/10"
                      : "border-surface-border bg-zinc-800/30 hover:border-zinc-700"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    selectedId === t.template_id ? "bg-primary-500/20" : "bg-zinc-800"
                  )}>
                    {selectedId === t.template_id ? (
                      <CheckCircle2 className="h-4 w-4 text-primary-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-200 truncate">{t.name}</p>
                      {t.is_default && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                      {!t.user_id && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary-500/20 text-primary-500/70">System</Badge>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-5 border-t border-surface-border bg-zinc-900/50 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              variant="gradient"
              className="flex-1"
              disabled={!selectedId || isDownloading || templates.length === 0}
              loading={isDownloading}
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
