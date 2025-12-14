import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User, PaginatedResponse, UserRole } from "@/types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Ban,
  CheckCircle,
} from "lucide-react";
import { UserModal } from "./UserModal";

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.data);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm("Czy na pewno chcesz zmienić status blokady tego użytkownika?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        fetchUsers();
      } else {
        alert(result.error || "Nie udało się zmienić statusu blokady");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Wystąpił błąd");
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, { variant: "default" | "secondary"; icon: React.ReactNode }> = {
      admin: { variant: "default", icon: <ShieldCheck className="w-3 h-3" /> },
      user: { variant: "secondary", icon: <UserIcon className="w-3 h-3" /> },
    };

    const config = variants[role];

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {role === "admin" ? "Administrator" : "Użytkownik"}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Filtruj użytkowników</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj po email lub nazwie..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "");
                setPage(1);
              }}
              className="px-4 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="">Wszystkie role</option>
              <option value="admin">Administrator</option>
              <option value="user">Użytkownik</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nie znaleziono użytkowników</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-slate-700/50">
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Imię i nazwisko</TableHead>
                      <TableHead className="text-gray-300">Rola</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Data utworzenia</TableHead>
                      <TableHead className="text-gray-300 text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-white/10 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">{user.email}</TableCell>
                        <TableCell className="text-gray-300">{user.full_name || "-"}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.is_blocked ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <Ban className="w-3 h-3" />
                              Zablokowany
                            </Badge>
                          ) : (
                            <Badge variant="success" className="flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Aktywny
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.created_at).toLocaleDateString("pl-PL")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsModalOpen(true);
                              }}
                            >
                              Edytuj
                            </Button>
                            <Button
                              size="sm"
                              variant={user.is_blocked ? "secondary" : "destructive"}
                              onClick={() => handleBlockUser(user.id)}
                            >
                              {user.is_blocked ? "Odblokuj" : "Zablokuj"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
