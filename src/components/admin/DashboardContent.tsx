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
      title: "Quizy",
      value: stats.total_quizzes,
      change: `${stats.total_quiz_attempts} podejść`,
      icon: FileQuestion,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Aktywni studenci",
      value: stats.active_students,
      change: `${stats.total_enrollments} zapisów`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Średni wynik quizów",
      value: `${stats.avg_quiz_score.toFixed(1)}%`,
      change: "Wynik wszystkich quizów",
      icon: CheckCircle,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Oczekujące zgłoszenia",
      value: stats.pending_reports,
      change: stats.pending_reports > 0 ? "Wymaga uwagi" : "Brak zgłoszeń",
      icon: AlertCircle,
      color: stats.pending_reports > 0 ? "from-yellow-500 to-yellow-600" : "from-gray-500 to-gray-600",
      link: stats.pending_reports > 0 ? "/admin/reports" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid - Compact Version */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.title} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
              {stat.link ? (
                <a href={stat.link} className="block transition-transform hover:scale-[1.02]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-white mb-0.5">{stat.value}</div>
                    <p className="text-xs font-medium text-gray-300 mb-1">{stat.title}</p>
                    <p className="text-xs text-gray-400">{stat.change}</p>
                  </CardContent>
                </a>
              ) : (
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white mb-0.5">{stat.value}</div>
                  <p className="text-xs font-medium text-gray-300 mb-1">{stat.title}</p>
                  <p className="text-xs text-gray-400">{stat.change}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="space-y-6">
        {/* Activity Chart - Full Width */}
        <ActivityChart />

        {/* Course Progress and Quiz Results - Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CourseProgressChart />
          <QuizResultsChart />
        </div>
      </div>
    </div>
  );
}
