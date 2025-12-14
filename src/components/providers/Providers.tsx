import { AlertProvider } from "./AlertProvider";
import { Toaster } from "sonner";

export function Providers() {
  return (
    <AlertProvider>
      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-slate-800 border-white/10 text-white",
            description: "text-gray-400",
            actionButton: "bg-blue-600 text-white",
            cancelButton: "bg-slate-700 text-white",
            error: "bg-red-900/20 border-red-500/20 text-red-400",
            success: "bg-green-900/20 border-green-500/20 text-green-400",
            warning: "bg-yellow-900/20 border-yellow-500/20 text-yellow-400",
            info: "bg-blue-900/20 border-blue-500/20 text-blue-400",
          },
        }}
      />
    </AlertProvider>
  );
}
