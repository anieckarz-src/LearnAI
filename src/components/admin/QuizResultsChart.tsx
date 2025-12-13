import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QuizResultsData {
  distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  timeline: {
    date: string;
    avg_score: number;
  }[];
  total_attempts: number;
  average_score: number;
}

const chartColors = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  grid: "#1e293b",
  text: "#94a3b8",
};

const PIE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

export function QuizResultsChart() {
  const [data, setData] = useState<QuizResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats/quiz-results?days=30");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError("Failed to fetch quiz results data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Wyniki quizów</CardTitle>
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
          <CardTitle className="text-white">Wyniki quizów</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-red-400">{error}</CardContent>
      </Card>
    );
  }

  if (!data || data.total_attempts === 0) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Wyniki quizów</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-gray-400">
          Brak danych o quizach
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Score Distribution Pie Chart */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Rozkład wyników</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}%: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [`${value} podejść`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-white">{data.average_score.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Średni wynik</p>
              <p className="text-xs text-gray-500 mt-1">{data.total_attempts} podejść</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Średni wynik w czasie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                stroke={chartColors.text}
                tick={{ fill: chartColors.text }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("pl-PL", { month: "short", day: "numeric" })
                }
              />
              <YAxis
                stroke={chartColors.text}
                tick={{ fill: chartColors.text }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString("pl-PL")}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Średni wynik"]}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke={chartColors.success}
                strokeWidth={2}
                dot={{ fill: chartColors.success, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
