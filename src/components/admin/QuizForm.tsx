import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionEditor } from "./QuestionEditor";
import { QuizGeneratorModal } from "./QuizGeneratorModal";
import type { Quiz, QuizQuestion, Lesson, Course } from "@/types";
import { Save, X, Plus, ArrowLeft, Sparkles } from "lucide-react";

const quizSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  lesson_id: z.string().uuid("Wybierz lekcję"),
  passing_score: z.number().min(0).max(100),
  max_attempts: z.number().min(1).nullable().optional(),
  questions: z
    .array(z.any())
    .min(1, "Quiz musi mieć co najmniej 1 pytanie")
    .max(50, "Quiz może mieć maksymalnie 50 pytań"),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface LessonWithCourse extends Lesson {
  course: Course;
}

interface QuizFormProps {
  quiz?: Quiz;
}

export function QuizForm({ quiz }: QuizFormProps) {
  const [lessons, setLessons] = useState<LessonWithCourse[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz?.questions || [
      {
        id: crypto.randomUUID(),
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
      },
    ]
  );
  const [loading, setLoading] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [passingScore, setPassingScore] = useState<number>(quiz?.passing_score || 70);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(quiz?.max_attempts || null);
  const [aiGenerated, setAiGenerated] = useState<boolean>(quiz?.ai_generated || false);

  const isEditMode = !!quiz;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: quiz?.title || "",
      lesson_id: quiz?.lesson_id || "",
      passing_score: quiz?.passing_score || 70,
      max_attempts: quiz?.max_attempts || null,
      questions: questions,
    },
  });

  const lesson_id = watch("lesson_id");

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    setValue("questions", questions);
    setValue("passing_score", passingScore);
    setValue("max_attempts", maxAttempts);
  }, [questions, passingScore, maxAttempts, setValue]);

  const fetchLessons = async () => {
    try {
      setLoadingLessons(true);
      // Fetch all courses and their lessons
      const coursesResponse = await fetch("/api/admin/courses?limit=100");
      const coursesResult = await coursesResponse.json();

      if (coursesResult.success) {
        const allLessons: LessonWithCourse[] = [];

        // Fetch lessons for each course
        for (const course of coursesResult.data.data) {
          const lessonsResponse = await fetch(`/api/admin/lessons?course_id=${course.id}`);
          const lessonsResult = await lessonsResponse.json();

          if (lessonsResult.success) {
            const lessonsWithCourse = lessonsResult.data.map((lesson: Lesson) => ({
              ...lesson,
              course: course,
            }));
            allLessons.push(...lessonsWithCourse);
          }
        }

        setLessons(allLessons);
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleAIGenerate = (generatedQuestions: QuizQuestion[], suggestedTitle: string) => {
    setQuestions(generatedQuestions);
    setValue("title", suggestedTitle);
    setAiGenerated(true);
    setShowAIModal(false);
  };

  const openAIModal = () => {
    if (!lesson_id) {
      setError("Najpierw wybierz lekcję");
      return;
    }
    setShowAIModal(true);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const validateQuestions = (): boolean => {
    for (const question of questions) {
      if (!question.question.trim()) {
        setError("Wszystkie pytania muszą mieć treść");
        return false;
      }
      if (question.options.some((opt) => !opt.trim())) {
        setError("Wszystkie odpowiedzi muszą być wypełnione");
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: QuizFormData) => {
    if (!validateQuestions()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = isEditMode ? `/api/admin/quizzes/${quiz.id}` : "/api/admin/quizzes";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          questions,
          passing_score: passingScore,
          max_attempts: maxAttempts,
          ai_generated: aiGenerated,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać quizu");
      }

      // Redirect to quizzes list
      window.location.href = "/admin/quizzes";
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setLoading(false);
    }
  };

  const selectedLesson = lessons.find((l) => l.id === lesson_id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (window.location.href = "/admin/quizzes")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót do listy quizów
        </Button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">{error}</div>}

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">{isEditMode ? "Edytuj quiz" : "Utwórz nowy quiz"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Tytuł quizu <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Wprowadź tytuł quizu"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
            {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
          </div>

          {/* Lesson Selection */}
          <div className="space-y-2">
            <Label htmlFor="lesson" className="text-white">
              Lekcja <span className="text-red-400">*</span>
            </Label>
            {loadingLessons ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                Ładowanie lekcji...
              </div>
            ) : (
              <Select value={lesson_id} onValueChange={(value) => setValue("lesson_id", value)}>
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz lekcję" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 max-h-[300px]">
                  {lessons.map((lesson) => (
                    <SelectItem
                      key={lesson.id}
                      value={lesson.id}
                      className="text-white focus:bg-slate-700 focus:text-white"
                    >
                      {lesson.course.title} - {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.lesson_id && <p className="text-sm text-red-400">{errors.lesson_id.message}</p>}
          </div>

          {/* AI Generation */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Generowanie quizu przez AI
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {lesson_id
                    ? "Kliknij aby wygenerować pytania na podstawie treści lekcji"
                    : "Najpierw wybierz lekcję"}
                </p>
              </div>
              <Button
                type="button"
                onClick={openAIModal}
                disabled={!lesson_id || loadingLessons}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generuj przez AI
              </Button>
            </div>
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <Label htmlFor="passing_score" className="text-white">
              Próg zaliczenia <span className="text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="passing_score"
                min="0"
                max="100"
                step="5"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="w-16 text-center">
                <span className="text-2xl font-bold text-white">{passingScore}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Student musi uzyskać co najmniej {passingScore}% punktów aby zaliczyć quiz
            </p>
          </div>

          {/* Max Attempts */}
          <div className="space-y-2">
            <Label htmlFor="max_attempts" className="text-white">
              Maksymalna liczba prób
            </Label>
            <div className="flex items-center gap-4">
              <Select
                value={maxAttempts === null ? "unlimited" : maxAttempts.toString()}
                onValueChange={(value) => setMaxAttempts(value === "unlimited" ? null : parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="unlimited" className="text-white focus:bg-slate-700 focus:text-white">
                    Bez limitu
                  </SelectItem>
                  {[1, 2, 3, 5, 10].map((num) => (
                    <SelectItem
                      key={num}
                      value={num.toString()}
                      className="text-white focus:bg-slate-700 focus:text-white"
                    >
                      {num} {num === 1 ? "próba" : num < 5 ? "próby" : "prób"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-400">
              {maxAttempts === null
                ? "Studenci mogą rozwiązywać quiz nieograniczoną liczbę razy"
                : `Studenci mogą rozwiązać quiz maksymalnie ${maxAttempts} ${maxAttempts === 1 ? "raz" : "razy"}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Pytania ({questions.length}) {aiGenerated && <span className="text-purple-400 text-sm ml-2">★ Wygenerowane przez AI</span>}
          </h3>
          <Button type="button" onClick={addQuestion} variant="outline" size="sm" disabled={questions.length >= 50}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pytanie
          </Button>
        </div>

        {questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            onChange={(updated) => updateQuestion(index, updated)}
            onRemove={() => removeQuestion(index)}
          />
        ))}
      </div>

      {errors.questions && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {errors.questions.message}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/quizzes")}
          disabled={loading}
        >
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
              {isEditMode ? "Zapisz zmiany" : "Utwórz quiz"}
            </>
          )}
        </Button>
      </div>

      {/* AI Generator Modal */}
      {showAIModal && selectedLesson && (
        <QuizGeneratorModal
          lessonId={selectedLesson.id}
          lessonTitle={selectedLesson.title}
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </form>
  );
}
