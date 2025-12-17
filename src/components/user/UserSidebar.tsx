import { LayoutDashboard, BookOpen, Library, FileQuestion, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

interface UserSidebarProps {
  currentPath: string;
  user: UserType;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Moje Kursy", href: "/dashboard/my-courses", icon: BookOpen },
  { name: "Katalog Kursów", href: "/courses", icon: Library },
  { name: "Quizy", href: "/dashboard/quizzes", icon: FileQuestion },
  { name: "Profil", href: "/dashboard/profile", icon: User },
];

export function UserSidebar({ currentPath, user }: UserSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-800 border border-white/10 text-white hover:bg-slate-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r border-white/10 bg-slate-900 transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-white/10 px-6">
            <a href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
              LearnAI
            </a>
          </div>

          {/* User info card */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || "Student"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
              const Icon = item.icon;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Sign out button */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Wyloguj się
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
