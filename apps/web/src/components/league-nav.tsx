import { Link } from "@tanstack/react-router";
import { Calendar, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeagueNav({
  leagueId,
  isCommissioner,
  active,
}: {
  leagueId: string;
  isCommissioner: boolean;
  active: "overview" | "picks" | "leaderboard" | "schedule";
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      <NavTab
        to="/leagues/$leagueId"
        params={{ leagueId }}
        active={active === "overview"}
        icon={Trophy}
      >
        Overview
      </NavTab>
      <NavTab
        to="/leagues/$leagueId/picks"
        params={{ leagueId }}
        active={active === "picks"}
        icon={Calendar}
      >
        Picks
      </NavTab>
      <NavTab
        to="/leagues/$leagueId/leaderboard"
        params={{ leagueId }}
        active={active === "leaderboard"}
        icon={Trophy}
      >
        Leaderboard
      </NavTab>
      {isCommissioner && (
        <NavTab
          to="/leagues/$leagueId/schedule"
          params={{ leagueId }}
          active={active === "schedule"}
          icon={Calendar}
        >
          Schedule
        </NavTab>
      )}
      <span className="inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
        <Settings className="size-4" aria-hidden />
        Settings
      </span>
    </nav>
  );
}

function NavTab({
  to,
  params,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  params: { leagueId: string };
  active?: boolean;
  icon: typeof Trophy;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Link>
  );
}
