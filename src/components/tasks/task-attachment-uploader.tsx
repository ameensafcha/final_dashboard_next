"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

interface TaskAttachmentUploaderProps {
  taskId: string;
  onSuccess: () => void;
}

export function TaskAttachmentUploader({ taskId, onSuccess }: TaskAttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { addNotification } = useUIStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({ type: "error", message: "File is too large (max 5MB)" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      // 3. Save metadata to DB via API
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to save attachment metadata");

      addNotification({ type: "success", message: "File uploaded successfully" });
      onSuccess();
    } catch (error: any) {
      addNotification({ type: "error", message: error.message || "Upload failed" });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="h-full">
      <label className="cursor-pointer h-full block">
        <div className="flex flex-col items-center justify-center gap-4 h-full px-6 py-10 rounded-[var(--radius-xl)] bg-[var(--surface)] border-none shadow-inner group transition-all hover:bg-[var(--surface-container-lowest)] hover:shadow-[var(--shadow-xl)] hover:scale-[1.02]">
          <div className={cn(
            "w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center transition-all",
            isUploading ? "bg-[var(--surface-container)]" : "bg-[var(--surface-container-lowest)] shadow-[var(--shadow-sm)] group-hover:bg-[var(--accent)]/20"
          )}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            ) : (
              <Paperclip className="w-6 h-6 text-[var(--primary)]" />
            )}
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">
              {isUploading ? "Transmitting..." : "Attach Intelligence"}
            </span>
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Max 5MB • All Sectors
            </span>
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
