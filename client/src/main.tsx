import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "./index.css";
import { AppRouter } from "./router/AppRouter";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppRouter />
    <Toaster position="top-right" theme="dark" richColors />
  </QueryClientProvider>,
);
