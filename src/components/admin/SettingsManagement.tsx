import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface Settings {
  platform_name?: string;
  platform_email?: string;
  ai_chatbot_model?: string;
  ai_chatbot_temperature?: number;
  ai_chatbot_max_tokens?: number;
  ai_chatbot_system_prompt?: string;
  quiz_default_questions?: number;
  quiz_default_difficulty?: string;
  session_timeout_minutes?: number;
  rate_limit_per_minute?: number;
}

export function SettingsManagement() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (result.success) {
        // Extract values from the nested structure
        const extractedSettings: Settings = {};
        for (const [key, val] of Object.entries(result.data)) {
          extractedSettings[key as keyof Settings] = (val as any).value;
        }
        setSettings(extractedSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Ustawienia zostały zapisane pomyślnie" });
      } else {
        setMessage({ type: "error", text: result.error || "Nie udało się zapisać ustawień" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Wystąpił błąd podczas zapisywania" });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/50 text-green-400"
              : "bg-red-500/10 border border-red-500/50 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* General Settings */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Ustawienia ogólne</CardTitle>
          <CardDescription className="text-gray-400">Podstawowa konfiguracja platformy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="platform_name" className="block text-sm font-medium text-gray-300 mb-2">
              Nazwa platformy
            </label>
            <Input
              id="platform_name"
              type="text"
              value={settings.platform_name || ""}
              onChange={(e) => updateSetting("platform_name", e.target.value)}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
          <div>
            <label htmlFor="platform_email" className="block text-sm font-medium text-gray-300 mb-2">
              Email kontaktowy
            </label>
            <Input
              id="platform_email"
              type="email"
              value={settings.platform_email || ""}
              onChange={(e) => updateSetting("platform_email", e.target.value)}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Chatbot Settings */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Ustawienia AI Chatbot</CardTitle>
          <CardDescription className="text-gray-400">Konfiguracja chatbota edukacyjnego</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="ai_chatbot_model" className="block text-sm font-medium text-gray-300 mb-2">
              Model AI
            </label>
            <select
              id="ai_chatbot_model"
              value={settings.ai_chatbot_model || "gpt-4"}
              onChange={(e) => updateSetting("ai_chatbot_model", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
          <div>
            <label htmlFor="ai_chatbot_temperature" className="block text-sm font-medium text-gray-300 mb-2">
              Temperature (0-1)
            </label>
            <Input
              id="ai_chatbot_temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={settings.ai_chatbot_temperature || 0.7}
              onChange={(e) => updateSetting("ai_chatbot_temperature", parseFloat(e.target.value))}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
          <div>
            <label htmlFor="ai_chatbot_max_tokens" className="block text-sm font-medium text-gray-300 mb-2">
              Max Tokens
            </label>
            <Input
              id="ai_chatbot_max_tokens"
              type="number"
              value={settings.ai_chatbot_max_tokens || 2000}
              onChange={(e) => updateSetting("ai_chatbot_max_tokens", parseInt(e.target.value))}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
          <div>
            <label htmlFor="ai_chatbot_system_prompt" className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              id="ai_chatbot_system_prompt"
              rows={4}
              value={settings.ai_chatbot_system_prompt || ""}
              onChange={(e) => updateSetting("ai_chatbot_system_prompt", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz Settings */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Ustawienia quizów</CardTitle>
          <CardDescription className="text-gray-400">Domyślne parametry generowania quizów</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="quiz_default_questions" className="block text-sm font-medium text-gray-300 mb-2">
              Domyślna liczba pytań
            </label>
            <Input
              id="quiz_default_questions"
              type="number"
              min="1"
              max="20"
              value={settings.quiz_default_questions || 5}
              onChange={(e) => updateSetting("quiz_default_questions", parseInt(e.target.value))}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
          <div>
            <label htmlFor="quiz_default_difficulty" className="block text-sm font-medium text-gray-300 mb-2">
              Domyślny poziom trudności
            </label>
            <select
              id="quiz_default_difficulty"
              value={settings.quiz_default_difficulty || "medium"}
              onChange={(e) => updateSetting("quiz_default_difficulty", e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-slate-700/50 border border-white/10 text-white"
            >
              <option value="easy">Łatwy</option>
              <option value="medium">Średni</option>
              <option value="hard">Trudny</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Ustawienia bezpieczeństwa</CardTitle>
          <CardDescription className="text-gray-400">Parametry dotyczące sesji i limitów</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-300 mb-2">
              Czas wygaśnięcia sesji (minuty)
            </label>
            <Input
              id="session_timeout_minutes"
              type="number"
              min="15"
              max="1440"
              value={settings.session_timeout_minutes || 60}
              onChange={(e) => updateSetting("session_timeout_minutes", parseInt(e.target.value))}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
          <div>
            <label htmlFor="rate_limit_per_minute" className="block text-sm font-medium text-gray-300 mb-2">
              Limit zapytań na minutę
            </label>
            <Input
              id="rate_limit_per_minute"
              type="number"
              min="10"
              max="1000"
              value={settings.rate_limit_per_minute || 60}
              onChange={(e) => updateSetting("rate_limit_per_minute", parseInt(e.target.value))}
              className="bg-slate-700/50 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-8">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
        </Button>
      </div>
    </form>
  );
}
