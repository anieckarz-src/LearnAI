import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ContentReport, ContentType, ReportStatus } from "@/types";
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Eye } from "lucide-react";

interface ContentReportWithUsers extends ContentReport {
  reporter: {
    id: string;
    email: string;
    full_name: string | null;
  };
  reviewer: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

export function ReportsManagement() {
  const [reports, setReports] = useState<ContentReportWithUsers[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | "">("");

  const limit = 10;

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, contentTypeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);
      if (contentTypeFilter) params.append("content_type", contentTypeFilter);

      const response = await fetch(`/api/admin/reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setReports(result.data.data);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (result.success) {
        fetchReports();
      } else {
        alert(result.error || "Nie udało się zaktualizować zgłoszenia");
      }
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Wystąpił błąd");
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const variants: Record<
      ReportStatus,
      { variant: "warning" | "secondary" | "success"; label: string; icon: React.ReactNode }
    > = {
      pending: { variant: "warning", label: "Oczekuje", icon: <AlertCircle className="w-3 h-3" /> },
      reviewed: { variant: "secondary", label: "Sprawdzone", icon: <Eye className="w-3 h-3" /> },
      resolved: { variant: "success", label: "Rozwiązane", icon: <CheckCircle className="w-3 h-3" /> },
    };

    const config = variants[status];

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getContentTypeBadge = (type: ContentType) => {
    const labels: Record<ContentType, string> = {
      course: "Kurs",
      lesson: "Lekcja",
      comment: "Komentarz",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Filtruj zgłoszenia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReportStatus | "");
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="">Wszystkie statusy</option>
              <option value="pending">Oczekujące</option>
              <option value="reviewed">Sprawdzone</option>
              <option value="resolved">Rozwiązane</option>
            </select>
            <select
              value={contentTypeFilter}
              onChange={(e) => {
                setContentTypeFilter(e.target.value as ContentType | "");
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="">Wszystkie typy</option>
              <option value="course">Kursy</option>
              <option value="lesson">Lekcje</option>
              <option value="comment">Komentarze</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-12 text-gray-400">Nie znaleziono zgłoszeń</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        {getContentTypeBadge(report.content_type)}
                      </div>
                      <div className="text-white">
                        <div className="font-medium mb-1">Powód zgłoszenia:</div>
                        <p className="text-gray-300">{report.reason}</p>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>
                          <span className="font-medium">Zgłoszone przez:</span>{" "}
                          {report.reporter.full_name || report.reporter.email}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>{" "}
                          {new Date(report.created_at).toLocaleString("pl-PL")}
                        </div>
                        {report.reviewer && (
                          <div>
                            <span className="font-medium">Sprawdzone przez:</span>{" "}
                            {report.reviewer.full_name || report.reviewer.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {report.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(report.id, "reviewed")}>
                            Oznacz jako sprawdzone
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateStatus(report.id, "resolved")}
                          >
                            Rozwiąż
                          </Button>
                        </>
                      )}
                      {report.status === "reviewed" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateStatus(report.id, "resolved")}
                        >
                          Rozwiąż
                        </Button>
                      )}
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
    </div>
  );
}
