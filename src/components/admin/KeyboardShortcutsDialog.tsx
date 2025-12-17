import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ["Ctrl", "M"],
    description: "Dodaj nowy moduł",
    category: "Moduły",
  },
  {
    keys: ["Escape"],
    description: "Anuluj edycję/dodawanie",
    category: "Ogólne",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Zapisz zmiany",
    category: "Ogólne",
  },
  {
    keys: ["?"],
    description: "Pokaż skróty klawiszowe",
    category: "Pomoc",
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-gray-400 hover:text-white border-white/10">
          <Keyboard className="w-4 h-4 mr-2" />
          Skróty
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Skróty klawiszowe</DialogTitle>
          <DialogDescription className="text-gray-400">
            Używaj skrótów klawiszowych aby szybciej zarządzać kursami
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold text-white bg-slate-900 border border-white/20 rounded">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && <span className="text-gray-500 text-xs">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            💡 <strong>Wskazówka:</strong> Naciśnij{" "}
            <kbd className="px-2 py-0.5 text-xs bg-slate-900 border border-white/20 rounded">?</kbd> w dowolnym momencie
            aby wyświetlić ten panel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
