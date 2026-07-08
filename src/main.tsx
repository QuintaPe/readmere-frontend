import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { registerSW } from "virtual:pwa-register";

import { I18nProvider } from "./i18n";
import { initTheme } from "./lib/theme";
import "./index.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource-variable/fraunces";

// Import layouts and routes
import RootLayout from "./layouts/RootLayout";
import { ErrorBoundary } from "./layouts/components/ErrorBoundary";
import NotFoundRoute from "./routes/not-found/index";
import ProtectedRoute from "./routes/_authenticated/route";
import IndexRoute from "./routes/index/index";
import AuthRoute from "./routes/auth/index";
import AuthCallback from "./routes/auth/callback/index";
import DashboardRoute from "./routes/_authenticated/dashboard/index";
import AjustesRoute from "./routes/_authenticated/ajustes/index";
import EstadisticasRoute from "./routes/_authenticated/estadisticas/index";
import FlashcardsRoute from "./routes/_authenticated/flashcards/index";
import LectorIndexRoute from "./routes/_authenticated/lector/index";
import LectorBookRoute from "./routes/_authenticated/lector/$bookId/index";
import MazosIndexRoute from "./routes/_authenticated/mazos/index";
import MazosDeckRoute from "./routes/_authenticated/mazos/$deckId/index";
import VocabularioRoute from "./routes/_authenticated/vocabulario/index";
import AdminLayout from "./routes/_admin/route";
import AdminIndexPage from "./routes/_admin/index";
import AdminUsersPage from "./routes/_admin/users/index";
import AdminBooksPage from "./routes/_admin/books/index";
import AdminDecksPage from "./routes/_admin/decks/index";
import AdminWordsPage from "./routes/_admin/words/index";
import AdminUserDetailPage from "./routes/_admin/users/$id/index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <IndexRoute />,
      },
      {
        path: "auth",
        element: <AuthRoute />,
      },
      {
        path: "auth/callback",
        element: <AuthCallback />,
      },
      {
        path: "*",
        element: <NotFoundRoute />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "dashboard",
            element: <DashboardRoute />,
          },
          {
            path: "ajustes",
            element: <AjustesRoute />,
          },
          {
            path: "estadisticas",
            element: <EstadisticasRoute />,
          },
          {
            path: "flashcards",
            element: <FlashcardsRoute />,
          },
          {
            path: "lector",
            element: <LectorIndexRoute />,
          },
          {
            path: "lector/:bookId",
            element: <LectorBookRoute />,
          },
          {
            path: "mazos",
            element: <MazosIndexRoute />,
          },
          {
            path: "mazos/:deckId",
            element: <MazosDeckRoute />,
          },
          {
            path: "vocabulario",
            element: <VocabularioRoute />,
          },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminIndexPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "users/:id", element: <AdminUserDetailPage /> },
      { path: "books", element: <AdminBooksPage /> },
      { path: "decks", element: <AdminDecksPage /> },
      { path: "words", element: <AdminWordsPage /> },
    ],
  },
]);

// Reconcilia el tema (clase .dark + color-scheme + listener de sistema) con la
// preferencia guardada. El script inline de index.html ya evitó el parpadeo;
// esto activa el seguimiento en vivo del modo "sistema".
initTheme();

// Actualiza el SW en segundo plano; la nueva versión entra al recargar.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </StrictMode>,
);
