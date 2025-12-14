import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Module } from "@/types";
import { Save, X } from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface InlineModuleFormProps {
  courseId: string;
  module?: Module;
  onSave: (module: Module) => void;
  onCancel: () => void;
}

export function InlineModuleForm({ courseId, module, onSave, onCancel }: InlineModuleFormProps) {
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

      // Pass the saved module data back to parent
      onSave(result.data);
    } catch (err) {
      console.error("Error saving module:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
      <CardHeader>
        <CardTitle className="text-white text-lg">
          {isEditMode ? "Edytuj moduł" : "Nowy moduł"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white text-sm">
              Tytuł modułu <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="np. MODULE 01 - Onboarding"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
              autoFocus
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="hover:bg-white/5 transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Anuluj
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200">
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
      </CardContent>
    </Card>
  );
}
