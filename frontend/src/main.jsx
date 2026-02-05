import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "./contexts/UserContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
          <Toaster position="top-center" />
        </QueryClientProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
