"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 8 * 60 * 1000, // 8 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
            refetchOnWindowFocus: false, // Prevents refetching when switching tabs back and forth
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
