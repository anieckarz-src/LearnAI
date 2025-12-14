import { AlertProvider } from "./AlertProvider";
import type { ReactNode } from "react";

interface ClientWrapperProps {
  children: ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <AlertProvider>
      {children}
    </AlertProvider>
  );
}
