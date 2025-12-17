import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, FileQuestion, TrendingUp } from "lucide-react";

export function QuickActions() {
  return (
    <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Szybkie Akcje</h3>
            <p className="text-sm text-gray-400">Dostęp do najważniejszych funkcji</p>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => (window.location.href = "/courses")}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">Katalog Kursów</span>
              </div>
              <span className="text-xs text-gray-400 text-left">Przeglądaj dostępne kursy</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/dashboard/my-courses")}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300">
                <PlayCircle className="w-5 h-5" />
                <span className="font-semibold">Kontynuuj Naukę</span>
              </div>
              <span className="text-xs text-gray-400 text-left">Wróć do swoich kursów</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/dashboard/quizzes")}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 text-orange-400 group-hover:text-orange-300">
                <FileQuestion className="w-5 h-5" />
                <span className="font-semibold">Moje Quizy</span>
              </div>
              <span className="text-xs text-gray-400 text-left">Zobacz wyniki quizów</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/dashboard/profile")}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-green-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 text-green-400 group-hover:text-green-300">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Mój Profil</span>
              </div>
              <span className="text-xs text-gray-400 text-left">Zarządzaj swoim kontem</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
