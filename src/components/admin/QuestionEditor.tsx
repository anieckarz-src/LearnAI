import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { QuizQuestion } from "@/types";
import { Trash2, Plus, Check } from "lucide-react";

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  onChange: (question: QuizQuestion) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, index, onChange, onRemove }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<QuizQuestion>(question);

  const updateQuestion = (updates: Partial<QuizQuestion>) => {
    const updated = { ...localQuestion, ...updates };
    setLocalQuestion(updated);
    onChange(updated);
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...localQuestion.options];
    newOptions[optionIndex] = value;
    updateQuestion({ options: newOptions });
  };

  const addOption = () => {
    if (localQuestion.options.length < 6) {
      updateQuestion({ options: [...localQuestion.options, ""] });
    }
  };

  const removeOption = (optionIndex: number) => {
    if (localQuestion.options.length > 2) {
      const newOptions = localQuestion.options.filter((_, i) => i !== optionIndex);
      const newCorrectAnswer =
        localQuestion.correct_answer >= newOptions.length
          ? newOptions.length - 1
          : localQuestion.correct_answer > optionIndex
            ? localQuestion.correct_answer - 1
            : localQuestion.correct_answer;
      updateQuestion({ options: newOptions, correct_answer: newCorrectAnswer });
    }
  };

  return (
    <Card className="bg-slate-700/50 border-white/10">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor={`question-${index}`} className="text-white">
              Pytanie {index + 1}
            </Label>
            <Input
              id={`question-${index}`}
              value={localQuestion.question}
              onChange={(e) => updateQuestion({ question: e.target.value })}
              placeholder="Wpisz treść pytania..."
              className="bg-slate-600/50 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-7"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-white">
            Odpowiedzi <span className="text-sm text-gray-400">(kliknij aby oznaczyć poprawną)</span>
          </Label>
          <div className="space-y-2">
            {localQuestion.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuestion({ correct_answer: optionIndex })}
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    localQuestion.correct_answer === optionIndex
                      ? "bg-green-600 border-green-500"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {localQuestion.correct_answer === optionIndex && <Check className="w-4 h-4 text-white" />}
                </button>
                <Input
                  value={option}
                  onChange={(e) => updateOption(optionIndex, e.target.value)}
                  placeholder={`Odpowiedź ${String.fromCharCode(65 + optionIndex)}`}
                  className="bg-slate-600/50 border-white/10 text-white placeholder:text-gray-400"
                />
                {localQuestion.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(optionIndex)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {localQuestion.options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj odpowiedź
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
