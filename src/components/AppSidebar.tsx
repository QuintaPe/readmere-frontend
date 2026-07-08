import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { listWordsDue } from "@/modules/words";
import { clearSession } from "@/auth/auth-storage";
import {
  LayoutDashboard,
  Library,
  Brain,
  BookText,
  LogOut,
  Layers,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { BrandMark } from "@/components/BrandMark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
// La etiqueta es una clave del namespace `nav`; se traduce al renderizar.
const navItems = [
  { key: "dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "library", url: "/lector", icon: Library },
  { key: "vocabulary", url: "/vocabulario", icon: BookText },
  { key: "decks", url: "/mazos", icon: Layers },
  { key: "flashcards", url: "/flashcards", icon: Brain },
  { key: "stats", url: "/estadisticas", icon: BarChart3 },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation(["nav", "common"]);

  // Repasos vencidos, para el badge de Flashcards. Se refresca al cambiar de
  // página (barato: la query usa el índice user_id+srs_due y suele traer poco).
  const [dueCount, setDueCount] = useState(0);
  useEffect(() => {
    let alive = true;
    listWordsDue(0)
      .then((w) => {
        if (alive) setDueCount(w.length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  function signOut() {
    clearSession();
    navigate("/auth", { replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrandMark className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight truncate">
              {t("common:appName")}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {t("common:tagline")}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav:groupStudy")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(it.url)}
                    tooltip={t(`nav:${it.key}`)}
                  >
                    <Link to={it.url} viewTransition>
                      <it.icon className="h-4 w-4" />
                      <span>{t(`nav:${it.key}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                  {it.url === "/flashcards" && dueCount > 0 && (
                    <SidebarMenuBadge className="bg-primary/15 text-primary">
                      {dueCount > 99 ? "99+" : dueCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {user?.role === "admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin")}
                tooltip={t("nav:admin")}
              >
                <Link to="/admin" viewTransition>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("nav:admin")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/ajustes")}
              tooltip={t("nav:settings")}
            >
              <Link to="/ajustes" viewTransition>
                <Settings className="h-4 w-4" />
                <span>{t("nav:settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              tooltip={t("nav:signOut")}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav:signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
