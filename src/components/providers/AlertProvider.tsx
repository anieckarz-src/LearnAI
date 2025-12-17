import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
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

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface AlertContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | null>(null);

interface DialogState {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "destructive";
  resolve: ((value: boolean) => void) | null;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "OK",
    cancelText: "Anuluj",
    variant: "default",
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText || "Anuluj",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [dialogState.resolve]);

  const contextValue: AlertContextType = {
    confirm,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <AlertDialog open={dialogState.isOpen} onOpenChange={handleCancel}>
        <AlertDialogContent className="bg-slate-800 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{dialogState.title}</AlertDialogTitle>
            {dialogState.description && (
              <AlertDialogDescription className="text-gray-400">{dialogState.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancel}
              className="bg-slate-700 text-white hover:bg-slate-600 border-white/10"
            >
              {dialogState.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                dialogState.variant === "destructive"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }
            >
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  // Fallback for SSR or when provider is not available
  // This prevents errors during server-side rendering
  // The component will work correctly after client-side hydration
  if (!context) {
    if (typeof window === "undefined") {
      // During SSR, return a no-op function
      return {
        confirm: async (): Promise<boolean> => {
          return false;
        },
      };
    }
    // If we're in the browser but provider is missing, throw error
    throw new Error("useAlert must be used within AlertProvider");
  }

  return context;
}
