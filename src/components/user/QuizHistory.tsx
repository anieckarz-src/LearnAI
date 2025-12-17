import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileQuestion, Trophy, Clock, TrendingUp, ArrowRight } from "lucide-react";

interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  course_title: string;
  course_id: string;
  score: number;
  completed_at: string;
  total_questions: number;
}

export function QuizHistory() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  const fetchQuizHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/quiz-history");
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Nie udało się pobrać historii quizów");
        return;
      }

      setAttempts(result.data || []);
    } catch (err) {
      console.error("Error fetching quiz history:", err);
      setError("Wystąpił błąd podczas pobierania historii quizów");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    return "text-red-400 bg-red-500/20 border-red-500/30";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const calculateStats = () => {
    if (attempts.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        bestScore: 0,
        recentAttempts: 0,
      };
    }

    const avgScore = Math.round(
      attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length
    );
    const bestScore = Math.max(...attempts.map((a) => a.score));
    const recentAttempts = attempts.filter((a) => {
      const date = new Date(a.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;

    return {
      total: attempts.length,
      avgScore,
      bestScore,
      recentAttempts,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <p className="text-red-400 text-lg">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="text-center py-12">
          <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Brak ukończonych quizów</h3>
          <p className="text-gray-400 mb-6">
            Nie masz jeszcze żadnych ukończonych quizów. Rozpocznij naukę i sprawdź swoją wiedzę!
          </p>
          <Button
            onClick={() => (window.location.href = "/courses")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Przeglądaj kursy
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <FileQuestion className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.total}</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Wszystkie quizy</p>
            <p className="text-xs text-gray-400">Ukończone podejścia</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.avgScore}%</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Średni wynik</p>
            <p className="text-xs text-gray-400">Ze wszystkich quizów</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                <Trophy className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.bestScore}%</div>
            <p className="text-xs font-medium text-gray-300 mb-1">Najlepszy wynik</p>
            <p className="text-xs text-gray-400">Twój rekord</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <Clock className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{stats.recentAttempts}</div>
            <p className="text-xs font-medium text-gray-300 mb-1">W tym tygodniu</p>
            <p className="text-xs text-gray-400">Ostatnie 7 dni</p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz History List */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Historia Quizów</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 rounded-lg bg-slate-700/30 border border-white/10 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold mb-1 truncate">{attempt.quiz_title}</h4>
                    <p className="text-sm text-gray-400 mb-2">{attempt.course_title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(attempt.completed_at).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getScoreBadgeColor(attempt.score)}>
                      {attempt.score}%
                    </Badge>
                    <Button
                      onClick={() =>
                        (window.location.href = `/quizzes/${attempt.quiz_id}/results`)
                      }
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-gray-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-600/10"
                    >
                      Zobacz wyniki
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
