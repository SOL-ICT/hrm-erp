// src/components/Providers.tsx
"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <RBACProvider>{children}</RBACProvider>
    </AuthProvider>
  );
}
