import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ActivityData {
  date: string;
  users: number;
  enrollments: number;
  quiz_attempts: number;
}

const chartColors = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  grid: "#1e293b",
  text: "#94a3b8",
};

export function ActivityChart() {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats/activity?days=30");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError("Failed to fetch activity data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Aktywność użytkowników</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Aktywność użytkowników</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-red-400">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Aktywność użytkowników (ostatnie 30 dni)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              stroke={chartColors.text}
              tick={{ fill: chartColors.text }}
              tickFormatter={(value) => new Date(value).toLocaleDateString("pl-PL", { month: "short", day: "numeric" })}
            />
            <YAxis stroke={chartColors.text} tick={{ fill: chartColors.text }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString("pl-PL")}
            />
            <Legend wrapperStyle={{ color: chartColors.text }} />
            <Area
              type="monotone"
              dataKey="users"
              stroke={chartColors.primary}
              fillOpacity={1}
              fill="url(#colorUsers)"
              name="Nowi użytkownicy"
            />
            <Area
              type="monotone"
              dataKey="enrollments"
              stroke={chartColors.secondary}
              fillOpacity={1}
              fill="url(#colorEnrollments)"
              name="Zapisy na kursy"
            />
            <Area
              type="monotone"
              dataKey="quiz_attempts"
              stroke={chartColors.success}
              fillOpacity={1}
              fill="url(#colorAttempts)"
              name="Podejścia do quizów"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
