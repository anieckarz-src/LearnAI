import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Dozwolone są tylko pliki JPEG, PNG i WebP");
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Plik nie może być większy niż 5MB");
        return;
      }

      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/courses/upload-thumbnail", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Nie udało się przesłać pliku");
        }

        onChange(result.data.url);
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas przesyłania");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0]);
      }
    },
    [handleUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload]
  );

  const handleRemove = useCallback(() => {
    onChange("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {value ? (
        <div className="flex items-start gap-4 p-4 rounded-lg border border-white/10 bg-slate-700/30">
          <div className="relative group flex-shrink-0">
            <img src={value} alt="Thumbnail" className="w-32 h-32 object-cover rounded-lg border border-white/10" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Usuń
              </Button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">Miniatura przesłana</p>
            <p className="text-xs text-gray-400 mb-3">Najedź na obraz aby usunąć</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={uploading}
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Zmień miniaturę
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/20 bg-slate-700/30 hover:border-white/40 hover:bg-slate-700/50",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-400">Przesyłanie...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-slate-600/50 p-3">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-0.5">Przeciągnij i upuść lub kliknij</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WebP (max. 5MB)</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">{error}</div>
      )}
    </div>
  );
}
