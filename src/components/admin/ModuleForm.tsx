import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Module } from "@/types";
import { Save, X } from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  description: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface ModuleFormProps {
  courseId: string;
  module?: Module;
  onSave: () => void;
  onCancel: () => void;
}

export function ModuleForm({ courseId, module, onSave, onCancel }: ModuleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!module;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: module?.title || "",
      description: module?.description || "",
    },
  });

  const onSubmit = async (data: ModuleFormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEditMode ? `/api/admin/modules/${module.id}` : "/api/admin/modules";
      const method = isEditMode ? "PATCH" : "POST";

      const payload = {
        ...data,
        course_id: courseId,
        order_index: module?.order_index || 0,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać modułu");
      }

      onSave();
    } catch (err) {
      console.error("Error saving module:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>}

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">{isEditMode ? "Edytuj moduł" : "Nowy moduł"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Tytuł modułu <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="np. MODULE 01 - Onboarding"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Opis modułu (opcjonalnie)
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Wprowadź opis modułu..."
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400 min-h-[100px]"
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Anuluj
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? "Zapisz zmiany" : "Utwórz moduł"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
