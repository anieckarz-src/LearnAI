import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Lock, Info, Loader2, Save, Eye, EyeOff } from "lucide-react";
import type { User } from "@/types";

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { toast } = useToast();

  // Profile form state
  const [fullName, setFullName] = useState(user.full_name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    // Validation
    if (!fullName.trim()) {
      setProfileError("Imię i nazwisko jest wymagane");
      return;
    }

    if (fullName.trim().length < 2) {
      setProfileError("Imię i nazwisko musi mieć minimum 2 znaki");
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Profil zaktualizowany",
          description: "Twoje dane zostały pomyślnie zapisane.",
        });
        // Reload to update user data in sidebar
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setProfileError(result.error || "Nie udało się zaktualizować profilu");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError("Wystąpił błąd podczas aktualizacji profilu");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validation
    if (!currentPassword) {
      setPasswordError("Obecne hasło jest wymagane");
      return;
    }

    if (!newPassword) {
      setPasswordError("Nowe hasło jest wymagane");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Nowe hasło musi mieć minimum 8 znaków");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Nowe hasła nie są identyczne");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Nowe hasło musi być inne niż obecne");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Hasło zmienione",
          description: "Twoje hasło zostało pomyślnie zmienione.",
        });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error || "Nie udało się zmienić hasła");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("Wystąpił błąd podczas zmiany hasła");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Brak danych";
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20">
              <UserIcon className="w-5 h-5 text-blue-400" />
            </div>
            <CardTitle className="text-white">Informacje o Profilu</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300">
                Imię i Nazwisko
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Kowalski"
                className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/50"
                disabled={isUpdatingProfile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email (nie można zmienić)
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-slate-700/30 border-white/10 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Zmiana adresu email wymaga weryfikacji. Skontaktuj się z administratorem.
              </p>
            </div>

            {profileError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{profileError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isUpdatingProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz zmiany
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-600/20">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <CardTitle className="text-white">Zmiana Hasła</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-300">
                Obecne Hasło
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50 pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-300">
                Nowe Hasło
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50 pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Minimum 8 znaków</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Potwierdź Nowe Hasło
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50 pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{passwordError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isChangingPassword}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zmiana hasła...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Zmień hasło
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-600/20">
              <Info className="w-5 h-5 text-green-400" />
            </div>
            <CardTitle className="text-white">Informacje o Koncie</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">Rola</Label>
              <div className="mt-1">
                <Badge className="bg-blue-600 text-white capitalize">
                  {user.role === "admin" ? "Administrator" : "Użytkownik"}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Status Konta</Label>
              <div className="mt-1">
                {user.is_blocked ? (
                  <Badge className="bg-red-600 text-white">Zablokowany</Badge>
                ) : (
                  <Badge className="bg-green-600 text-white">Aktywny</Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Data utworzenia</Label>
              <p className="text-white mt-1 text-sm">{formatDate(user.created_at)}</p>
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Ostatnie logowanie</Label>
              <p className="text-white mt-1 text-sm">{formatDate(user.last_login)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">
              ID konta: <span className="text-gray-400 font-mono">{user.id}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
