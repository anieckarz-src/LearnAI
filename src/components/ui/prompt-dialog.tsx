import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  isOpen,
  title,
  description,
  defaultValue = "",
  placeholder = "",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm(value);
    setValue(defaultValue);
  };

  const handleCancel = () => {
    onCancel();
    setValue(defaultValue);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-slate-800 border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-gray-400">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="prompt-input" className="text-white text-sm mb-2 block">
            {placeholder || "Wartość"}
          </Label>
          <Input
            id="prompt-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            className="bg-slate-700 text-white hover:bg-slate-600 border-white/10"
          >
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-blue-600 text-white hover:bg-blue-700">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
