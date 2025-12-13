import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CourseProgressData {
  course_id: string;
  title: string;
  enrollments: number;
  completions: number;
  completion_rate: number;
  avg_score: number;
}

const chartColors = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  grid: "#1e293b",
  text: "#94a3b8",
};

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

export function CourseProgressChart() {
  const [data, setData] = useState<CourseProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/stats/course-progress?limit=10");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError("Failed to fetch course progress data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Postępy w kursach</CardTitle>
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
          <CardTitle className="text-white">Postępy w kursach</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-red-400">{error}</CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Postępy w kursach</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-gray-400">Brak danych</CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Postępy w kursach (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis type="number" stroke={chartColors.text} tick={{ fill: chartColors.text }} />
            <YAxis
              type="category"
              dataKey="title"
              stroke={chartColors.text}
              tick={{ fill: chartColors.text }}
              width={150}
              tickFormatter={(value) => (value.length > 20 ? value.substring(0, 20) + "..." : value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => {
                if (name === "completion_rate") return `${value.toFixed(1)}%`;
                return value;
              }}
            />
            <Legend wrapperStyle={{ color: chartColors.text }} />
            <Bar dataKey="enrollments" fill={chartColors.primary} name="Zapisy" radius={[0, 4, 4, 0]} />
            <Bar dataKey="completions" fill={chartColors.success} name="Ukończenia" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
