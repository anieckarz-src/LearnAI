import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, FileText, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import type { LessonMaterial, LessonMaterialType } from "@/types";

interface FileUploadProps {
  value: LessonMaterial[];
  onChange: (materials: LessonMaterial[]) => void;
  accept?: string;
  maxSize?: number;
}

const DEFAULT_ACCEPT = ".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.gif";
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB

export function FileUpload({
  value = [],
  onChange,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = ["pdf", "video", "image"],
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: LessonMaterialType) => {
    switch (type) {
      case "pdf":
        return FileText;
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress (since we can't get real progress from fetch easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/admin/lessons/upload-material", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Add uploaded file to the list
      const newMaterial: LessonMaterial = {
        id: crypto.randomUUID(),
        type: result.data.type,
        url: result.data.url,
        name: result.data.filename,
        size: result.data.size,
      };

      onChange([...value, newMaterial]);
      setUploadProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    await uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive ? "border-blue-500 bg-blue-500/10" : "border-white/20 bg-slate-700/30 hover:border-white/30"
        } ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-300">Uploading...</p>
              <div className="w-full max-w-xs h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{uploadProgress}%</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-sm text-gray-300">
                <span className="font-medium text-blue-400">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                PDF, Video (MP4, WebM), or Images (max {Math.floor(maxSize / (1024 * 1024))}MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Uploaded files:</p>
          <div className="space-y-2">
            {value.map((material) => {
              const Icon = getFileIcon(material.type);
              return (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-white/10"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{material.name}</p>
                    <p className="text-xs text-gray-400">
                      {material.type.toUpperCase()} • {formatFileSize(material.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(material.id)}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
