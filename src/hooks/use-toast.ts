import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastOptions) => {
    const message = description ? `${title}\n${description}` : title;

    switch (variant) {
      case "success":
        sonnerToast.success(title, { description });
        break;
      case "error":
        sonnerToast.error(title, { description });
        break;
      case "warning":
        sonnerToast.warning(title, { description });
        break;
      default:
        sonnerToast(title, { description });
        break;
    }
  };

  return { toast };
}
