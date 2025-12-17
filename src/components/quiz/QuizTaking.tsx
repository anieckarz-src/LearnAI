import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizWithAttemptInfo } from "@/types";
import { Check, Clock, AlertCircle, ArrowLeft, Send } from "lucide-react";

interface QuizTakingProps {
  quizId: string;
  onComplete: (attemptId: string) => void;
}

export function QuizTaking({ quizId, onComplete }: QuizTakingProps) {
  const [quiz, setQuiz] = useState<QuizWithAttemptInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Nie udało się pobrać quizu");
        return;
      }

      setQuiz(result.data);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError("Wystąpił błąd podczas pobierania quizu");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Proszę odpowiedzieć na wszystkie pytania (pozostało: ${unanswered.length})`);
      return;
    }

    // Confirm submission
    if (
      !confirm(
        `Czy na pewno chcesz wysłać odpowiedzi?\n\nOdpowiedziałeś na ${quiz.questions.length} pytań.\nPo wysłaniu nie będziesz mógł zmienić odpowiedzi.`
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          time_spent_seconds: timeSpent,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Nie udało się zapisać odpowiedzi");
      }

      // Redirect to results page
      onComplete(result.data.attempt.id);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas wysyłania odpowiedzi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg">{error}</p>
          <Button onClick={() => (window.location.href = "/courses")} className="mt-4">
            Wróć do kursów
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || !quiz.can_attempt) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Nie możesz rozpocząć quizu</p>
          <p className="text-gray-400">
            {quiz?.max_attempts ? `Wykorzystałeś wszystkie ${quiz.max_attempts} próby.` : "Brak dostępu do tego quizu."}
          </p>
          <Button onClick={() => window.history.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć
          </Button>
        </CardContent>
      </Card>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / quiz.questions.length) * 100);

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-2xl mb-2">{quiz.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Liczba pytań: {quiz.questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Próg zaliczenia: {quiz.passing_score}%</span>
                </div>
                {quiz.max_attempts && (
                  <div className="flex items-center gap-2">
                    <span>
                      Próba {quiz.user_attempts_count + 1} / {quiz.max_attempts}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Postęp</span>
              <span className="text-white font-medium">
                {answeredCount} / {quiz.questions.length} pytań
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <Card key={question.id} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Badge
                  className={`flex-shrink-0 ${
                    answers[question.id] !== undefined ? "bg-blue-600 text-white" : "bg-slate-700 text-gray-300"
                  }`}
                >
                  {index + 1}
                </Badge>
                <CardTitle className="text-white text-lg font-medium leading-relaxed">{question.question}</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(question.id, optionIndex)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      answers[question.id] === optionIndex
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-white/10 bg-slate-700/30 text-gray-300 hover:border-blue-500/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          answers[question.id] === optionIndex ? "border-blue-500 bg-blue-500" : "border-gray-400"
                        }`}
                      >
                        {answers[question.id] === optionIndex && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm sticky bottom-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-white font-medium">
                Odpowiedziano: {answeredCount} / {quiz.questions.length}
              </p>
              <p className="text-gray-400">
                {answeredCount === quiz.questions.length
                  ? "Wszystkie pytania odpowiedziane!"
                  : `Pozostało ${quiz.questions.length - answeredCount} pytań`}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < quiz.questions.length}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Wyślij odpowiedzi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
