import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Quiz } from '@/types';
import { Trash2, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface QuizWithLesson extends Quiz {
  lesson: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

export function QuizzesManagement() {
  const [quizzes, setQuizzes] = useState<QuizWithLesson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithLesson | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchQuizzes();
  }, [page]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/quizzes?${params}`);
      const result = await response.json();

      if (result.success) {
        setQuizzes(result.data.data);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten quiz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        fetchQuizzes();
      } else {
        alert(result.error || 'Nie udało się usunąć quizu');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Wystąpił błąd');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-12 text-gray-400">
            Nie znaleziono quizów
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-white text-lg">
                          {quiz.title}
                        </CardTitle>
                        {quiz.ai_generated && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>
                          <span className="font-medium">Kurs:</span> {quiz.lesson.course.title}
                        </div>
                        <div>
                          <span className="font-medium">Lekcja:</span> {quiz.lesson.title}
                        </div>
                        <div>
                          <span className="font-medium">Liczba pytań:</span> {quiz.questions.length}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Podgląd
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(quiz.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-400">
                Pokazuję {(page - 1) * limit + 1}-{Math.min(page * limit, total)} z {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-white">
                  Strona {page} z {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quiz Preview Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="bg-slate-800 border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b border-white/10 sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{selectedQuiz.title}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedQuiz(null)}
                >
                  Zamknij
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedQuiz.questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <div className="text-white font-medium">
                    {index + 1}. {q.question}
                  </div>
                  <div className="space-y-1 ml-4">
                    {q.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`text-sm px-3 py-2 rounded ${
                          optIndex === q.correct_answer
                            ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                            : 'bg-slate-700/50 text-gray-300'
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
