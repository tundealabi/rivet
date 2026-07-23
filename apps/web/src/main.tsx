// main.tsx

import "./index.css";

import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { UnsavedChangesProvider } from "./components/app/unsaved-changes-registry";
import { ActiveOrgProvider } from "./components/billing/ActiveOrgProvider";
import { AppErrorBoundary } from "./components/errors/AppErrorBoundary";
import { ColorModeProvider } from "./components/theme/color-mode";
import { system } from "./theme.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,

      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ColorModeProvider>
          <BrowserRouter>
            <UnsavedChangesProvider>
              <ActiveOrgProvider>
                <AppErrorBoundary>
                  <App />
                </AppErrorBoundary>

                <Toaster position="top-right" />
              </ActiveOrgProvider>
            </UnsavedChangesProvider>
          </BrowserRouter>
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>
);
