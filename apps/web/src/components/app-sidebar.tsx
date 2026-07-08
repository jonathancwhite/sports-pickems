import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  LayoutDashboard,
  Menu,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { APP_NAME } from "@callsheet/shared";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leagues/my", label: "My Leagues", icon: Trophy },
  { to: "/leagues", label: "Browse Leagues", icon: Compass },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function isNavActive(pathname: string, to: string): boolean {
  if (to === "/leagues") {
    return pathname === "/leagues";
  }
  if (to === "/leagues/my") {
    return pathname === "/leagues/my" || pathname.startsWith("/leagues/my/");
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = isNavActive(pathname, to);

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const sidebarContent = (
    <>
      <div className="px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        <nav className="mt-2 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.to} {...item} onNavigate={onMobileClose} />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t px-3 py-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your leagues
        </p>
        <p className="mt-2 px-3 text-sm text-muted-foreground">
          Join or create a league to see it here.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/dashboard" className="text-lg font-semibold text-primary">
            {APP_NAME}
          </Link>
        </div>
        <div className="flex flex-1 flex-col">{sidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link
                to="/dashboard"
                className="text-lg font-semibold text-primary"
                onClick={onMobileClose}
              >
                {APP_NAME}
              </Link>
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <Menu className="size-5" />
    </button>
  );
}
