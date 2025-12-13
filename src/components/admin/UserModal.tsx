import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User, UserRole } from '@/types';
import { X } from 'lucide-react';

interface UserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserModal({ user, isOpen, onClose, onSuccess }: UserModalProps) {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [isBlocked, setIsBlocked] = useState(user.is_blocked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          role,
          is_blocked: isBlocked,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Nie udało się zaktualizować użytkownika');
      }
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg border border-white/10 shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Edytuj użytkownika</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-slate-700/50 border-white/10 text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Email nie może być zmieniony</p>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
              Imię i nazwisko
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jan Kowalski"
              className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Rola
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="student">Student</option>
              <option value="instructor">Instruktor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isBlocked"
              type="checkbox"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-slate-700/50 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-800"
            />
            <label htmlFor="isBlocked" className="text-sm font-medium text-gray-300">
              Zablokuj konto użytkownika
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
