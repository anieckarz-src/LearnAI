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
import type { Quiz, QuizQuestion, Lesson, Course } from "@/types";
import { Save, X, Plus, ArrowLeft, Sparkles } from "lucide-react";

const quizSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  lesson_id: z.string().uuid("Wybierz lekcję"),
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
      questions: questions,
    },
  });

  const lesson_id = watch("lesson_id");

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    setValue("questions", questions);
  }, [questions, setValue]);

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
          ai_generated: false,
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

          {/* AI Generation Placeholder */}
          <div className="p-4 rounded-lg bg-slate-700/30 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Generowanie quizu przez AI</p>
                <p className="text-sm text-gray-400 mt-1">Ta funkcja będzie wkrótce dostępna</p>
              </div>
              <Button
                type="button"
                disabled
                className="bg-gradient-to-r from-purple-600 to-blue-600 opacity-50 cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generuj przez AI
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Pytania ({questions.length})</h3>
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
    </form>
  );
}
