import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuizQuestion, QuizDifficulty } from "@/types";
import { Sparkles, X, AlertCircle } from "lucide-react";

interface QuizGeneratorModalProps {
  lessonId: string;
  lessonTitle: string;
  onGenerate: (questions: QuizQuestion[], suggestedTitle: string) => void;
  onClose: () => void;
}

export function QuizGeneratorModal({ lessonId, lessonTitle, onGenerate, onClose }: QuizGeneratorModalProps) {
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/quizzes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          num_questions: numQuestions,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się wygenerować quizu");
      }

      onGenerate(result.data.questions, result.data.suggested_title);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas generowania quizu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="bg-slate-800 border-white/10 w-full max-w-2xl">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-white">Generuj quiz przez AI</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Błąd generowania</p>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Lesson info */}
          <div className="p-4 rounded-lg bg-slate-700/30 border border-white/10">
            <Label className="text-gray-400 text-sm">Lekcja</Label>
            <p className="text-white font-medium mt-1">{lessonTitle}</p>
          </div>

          {/* Number of questions */}
          <div className="space-y-2">
            <Label htmlFor="num_questions" className="text-white">
              Liczba pytań
            </Label>
            <Select value={numQuestions.toString()} onValueChange={(value) => setNumQuestions(parseInt(value))}>
              <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {[3, 5, 7, 10, 12, 15].map((num) => (
                  <SelectItem
                    key={num}
                    value={num.toString()}
                    className="text-white focus:bg-slate-700 focus:text-white"
                  >
                    {num} pytań
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Wybierz liczbę pytań do wygenerowania (3-15)</p>
          </div>

          {/* Difficulty level */}
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-white">
              Poziom trudności
            </Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as QuizDifficulty)}>
              <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="easy" className="text-white focus:bg-slate-700 focus:text-white">
                  <div>
                    <div className="font-medium">Łatwy</div>
                    <div className="text-xs text-gray-400">Podstawowe pytania sprawdzające znajomość pojęć</div>
                  </div>
                </SelectItem>
                <SelectItem value="medium" className="text-white focus:bg-slate-700 focus:text-white">
                  <div>
                    <div className="font-medium">Średni</div>
                    <div className="text-xs text-gray-400">Pytania wymagające zrozumienia materiału</div>
                  </div>
                </SelectItem>
                <SelectItem value="hard" className="text-white focus:bg-slate-700 focus:text-white">
                  <div>
                    <div className="font-medium">Trudny</div>
                    <div className="text-xs text-gray-400">Pytania wymagające głębokiej analizy i syntezy</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Jak to działa?</p>
                <ul className="space-y-1 text-blue-300/80">
                  <li>• AI przeanalizuje treść lekcji</li>
                  <li>• Wygeneruje pytania testujące zrozumienie materiału</li>
                  <li>• Będziesz mógł przejrzeć i edytować pytania przed zapisaniem</li>
                  <li>• Proces może potrwać 10-30 sekund</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Anuluj
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generowanie...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generuj quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
