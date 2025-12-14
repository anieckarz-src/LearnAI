import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PaymentWithDetails, PaymentStatus, PaginatedResponse } from "@/types";
import { Search, ChevronLeft, ChevronRight, Download, Calendar, DollarSign } from "lucide-react";

export function PaymentsManagement() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");

  const limit = 20;

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/admin/payments?${params}`);
      const result = await response.json();

      if (result.success) {
        setPayments(result.data.data);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: "default" | "secondary" | "warning" | "destructive"; label: string }> = {
      succeeded: { variant: "default", label: "Opłacono" },
      pending: { variant: "warning", label: "Oczekuje" },
      failed: { variant: "destructive", label: "Niepowodzenie" },
      refunded: { variant: "secondary", label: "Zwrócono" },
    };

    const config = variants[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ["Data", "Użytkownik", "Kurs", "Kwota", "Status"];
    const rows = payments.map((payment) => [
      new Date(payment.created_at).toLocaleDateString("pl-PL"),
      payment.user.email,
      payment.course.title,
      `${payment.amount.toFixed(2)} ${payment.currency}`,
      payment.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platnosci_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700" disabled={payments.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Eksportuj do CSV
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Filtruj płatności</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PaymentStatus | "");
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="">Wszystkie statusy</option>
              <option value="succeeded">Opłacono</option>
              <option value="pending">Oczekuje</option>
              <option value="failed">Niepowodzenie</option>
              <option value="refunded">Zwrócono</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : payments.length === 0 ? (
        <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-12 text-gray-400">Nie znaleziono płatności</CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Data</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Użytkownik</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Kurs</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Kwota</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">ID Sesji</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(payment.created_at).toLocaleDateString("pl-PL")}
                          <span className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-white">
                        <div>
                          <div className="font-medium">{payment.user.full_name || "Brak imienia"}</div>
                          <div className="text-xs text-gray-400">{payment.user.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-white">{payment.course.title}</td>
                      <td className="p-4 text-sm text-white">
                        <div className="flex items-center gap-1 font-semibold text-green-400">
                          <DollarSign className="w-4 h-4" />
                          {payment.amount.toFixed(2)} {payment.currency}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(payment.status)}</td>
                      <td className="p-4 text-xs text-gray-500 font-mono max-w-[200px] truncate">
                        {payment.stripe_checkout_session_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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
