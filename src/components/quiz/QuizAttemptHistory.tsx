import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizAttempt } from "@/types";
import { Calendar, TrendingUp, Award, Eye, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface QuizAttemptHistoryProps {
  quizId: string;
}

interface AttemptsData {
  attempts: QuizAttempt[];
  stats: {
    total_attempts: number;
    best_score: number;
    avg_score: number;
    has_passed: boolean;
    can_retry: boolean;
  };
  quiz: {
    id: string;
    title: string;
    passing_score: number;
    max_attempts: number | null;
  };
}

export function QuizAttemptHistory({ quizId }: QuizAttemptHistoryProps) {
  const [data, setData] = useState<AttemptsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, [quizId]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}/attempts`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Nie udało się pobrać historii prób");
        return;
      }

      setData(result.data);
    } catch (err) {
      console.error("Error fetching attempts:", err);
      setError("Wystąpił błąd podczas pobierania historii prób");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <p className="text-red-400 text-lg">{error || "Brak danych"}</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Wróć
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{data.quiz.title}</h1>
          <p className="text-gray-400">Historia prób rozwiązania quizu</p>
        </div>
        <Button onClick={() => window.history.back()} variant="ghost" className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-600/20">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{data.stats.total_attempts}</div>
                <div className="text-sm text-gray-400">
                  {data.quiz.max_attempts ? `z ${data.quiz.max_attempts}` : "Wszystkie próby"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-600/20">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{data.stats.best_score}%</div>
                <div className="text-sm text-gray-400">Najlepszy wynik</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-600/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{data.stats.avg_score}%</div>
                <div className="text-sm text-gray-400">Średnia</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${data.stats.has_passed ? "bg-green-600/20" : "bg-gray-600/20"}`}>
                <Award className={`w-6 h-6 ${data.stats.has_passed ? "text-green-400" : "text-gray-400"}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${data.stats.has_passed ? "text-green-400" : "text-gray-400"}`}>
                  {data.stats.has_passed ? "TAK" : "NIE"}
                </div>
                <div className="text-sm text-gray-400">Zaliczony</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts List */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Wszystkie próby</CardTitle>
        </CardHeader>
        <CardContent>
          {data.attempts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nie masz jeszcze żadnych prób rozwiązania tego quizu</p>
              <Button onClick={() => (window.location.href = `/quizzes/${quizId}/take`)} className="mt-4">
                Rozpocznij quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    attempt.passed ? "border-green-500/30 bg-green-500/5" : "border-slate-700 bg-slate-700/20"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Badge className={`${attempt.passed ? "bg-green-600 text-white" : "bg-slate-600 text-white"}`}>
                        #{data.attempts.length - index}
                      </Badge>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-2xl font-bold ${attempt.passed ? "text-green-400" : "text-white"}`}>
                            {attempt.score}%
                          </span>
                          {attempt.passed && <Badge className="bg-green-600 text-white">✓ Zaliczony</Badge>}
                          {attempt.score === data.stats.best_score && (
                            <Badge className="bg-yellow-600 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Najlepszy
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(attempt.completed_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                          </div>
                          {attempt.time_spent_seconds > 0 && (
                            <div className="flex items-center gap-1">
                              Czas: {formatTime(attempt.time_spent_seconds)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = `/quizzes/${quizId}/results?attempt=${attempt.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Zobacz szczegóły
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Chart */}
      {data.attempts.length > 1 && (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Postęp wyników</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.attempts
                .slice()
                .reverse()
                .map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-400">#{index + 1}</div>
                    <div className="flex-1 h-8 bg-slate-700 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full transition-all ${
                          attempt.passed
                            ? "bg-gradient-to-r from-green-600 to-green-400"
                            : "bg-gradient-to-r from-blue-600 to-blue-400"
                        }`}
                        style={{ width: `${attempt.score}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                        {attempt.score}%
                      </div>
                    </div>
                    <div className="w-24 text-sm text-gray-400 text-right">
                      {format(new Date(attempt.completed_at), "dd MMM", { locale: pl })}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-white/10">
              <div className="text-sm text-gray-400">
                Próg zaliczenia: <span className="text-white font-medium">{data.quiz.passing_score}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              {data.stats.can_retry ? (
                <p className="text-sm text-gray-400">
                  {data.quiz.max_attempts
                    ? `Pozostałe próby: ${data.quiz.max_attempts - data.stats.total_attempts}`
                    : "Możesz spróbować ponownie bez limitu"}
                </p>
              ) : (
                <p className="text-sm text-red-400">Wykorzystałeś wszystkie próby</p>
              )}
            </div>
            {data.stats.can_retry && (
              <Button
                onClick={() => (window.location.href = `/quizzes/${quizId}/take`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Spróbuj ponownie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
