import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { Users, BookOpen, FileQuestion, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { ActivityChart } from "./ActivityChart";
import { CourseProgressChart } from "./CourseProgressChart";
import { QuizResultsChart } from "./QuizResultsChart";

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats/overview");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to load stats");
      }
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Użytkownicy",
      value: stats.total_users,
      change: `+${stats.new_users_this_month} w tym miesiącu`,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Kursy",
      value: stats.total_courses,
      change: `${stats.published_courses} opublikowanych`,
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Aktywni studenci",
      value: stats.active_students,
      change: `${stats.total_enrollments} zapisów`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Quizy",
      value: stats.total_quizzes,
      change: `${stats.total_quiz_attempts} podejść`,
      icon: FileQuestion,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Średni wynik quizów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-white">{stats.avg_quiz_score.toFixed(1)}%</div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Oczekujące zgłoszenia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-white">{stats.pending_reports}</div>
              {stats.pending_reports > 0 && <AlertCircle className="w-8 h-8 text-yellow-500" />}
            </div>
            {stats.pending_reports > 0 && (
              <a href="/admin/reports" className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block">
                Zobacz zgłoszenia →
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Szybkie akcje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/users"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-700/50 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-slate-700 hover:border-blue-500/50"
            >
              <Users className="w-4 h-4" />
              Zarządzaj użytkownikami
            </a>
            <a
              href="/admin/courses/new"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-700/50 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-slate-700 hover:border-blue-500/50"
            >
              <BookOpen className="w-4 h-4" />
              Dodaj nowy kurs
            </a>
            <a
              href="/admin/reports"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-700/50 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-slate-700 hover:border-blue-500/50"
            >
              <AlertCircle className="w-4 h-4" />
              Sprawdź zgłoszenia
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-700/50 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-slate-700 hover:border-blue-500/50"
            >
              <CheckCircle className="w-4 h-4" />
              Ustawienia systemu
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Analityka</h2>

        {/* Activity Chart */}
        <ActivityChart />

        {/* Course Progress Chart */}
        <CourseProgressChart />

        {/* Quiz Results Charts */}
        <QuizResultsChart />
      </div>
    </div>
  );
}
