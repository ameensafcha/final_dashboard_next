"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/lib/stores";

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
    <div className="mt-4">
      <label className="cursor-pointer">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 transition-all text-sm text-gray-600">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <Paperclip className="w-4 h-4 text-amber-600" />
          )}
          <span>{isUploading ? "Uploading..." : "Attach File (Max 5MB)"}</span>
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
