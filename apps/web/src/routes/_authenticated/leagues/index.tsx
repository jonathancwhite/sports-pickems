import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { PublicLeagueSummary, PublicLeaguesQuery } from "@callsheet/shared";
import { Compass, Plus, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { LeagueListSkeleton } from "@/components/league-list-skeleton";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  useJoinPublicLeague,
  useJoinWaitlist,
  usePublicLeagues,
  useSports,
} from "@/hooks/use-leagues";
import { showApiError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated/leagues/")({
  component: BrowseLeaguesPage,
});

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "members", label: "Most members" },
  { value: "name", label: "Name" },
] as const;

function BrowseLeaguesPage() {
  const navigate = useNavigate();
  const [sportId, setSportId] = useState<string>("");
  const [classificationId, setClassificationId] = useState<string>("");
  const [sort, setSort] = useState<PublicLeaguesQuery["sort"]>("newest");
  const [page, setPage] = useState(1);

  const { data: sports, isPending: sportsPending } = useSports();

  const query = useMemo(
    (): PublicLeaguesQuery => ({
      sportId: sportId || undefined,
      classificationId: classificationId || undefined,
      sort,
      page,
      limit: 12,
    }),
    [sportId, classificationId, sort, page],
  );

  const { data, isPending, isError } = usePublicLeagues(query);
  const joinLeague = useJoinPublicLeague();
  const joinWaitlist = useJoinWaitlist();

  const selectedSport = sports?.find((sport) => sport.id === sportId);
  const classifications = selectedSport?.classifications ?? [];

  function handleSportChange(nextSportId: string) {
    setSportId(nextSportId);
    setClassificationId("");
    setPage(1);
  }

  async function handleJoin(league: PublicLeagueSummary) {
    try {
      const joined = await joinLeague.mutateAsync(league.id);
      showSuccess(`Joined ${league.name}!`);
      navigate({ to: "/leagues/$leagueId", params: { leagueId: joined.id } });
    } catch (error) {
      showApiError(error, "Failed to join league");
    }
  }

  async function handleJoinWaitlist(league: PublicLeagueSummary) {
    try {
      const result = await joinWaitlist.mutateAsync(league.id);
      showSuccess(`Added to waitlist — you're #${result.position}`);
    } catch (error) {
      showApiError(error, "Failed to join waitlist");
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Leagues</h1>
        <p className="mt-1 text-muted-foreground">Discover public leagues to join</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterField label="Sport" id="browse-sport-filter">
          {sportsPending ? (
            <LoadingSpinner label="Loading sports…" />
          ) : (
            <select
              id="browse-sport-filter"
              value={sportId}
              onChange={(event) => handleSportChange(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-48"
            >
              <option value="">All sports</option>
              {sports?.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          )}
        </FilterField>

        <FilterField label="Classification" id="browse-classification-filter">
          <select
            id="browse-classification-filter"
            value={classificationId}
            onChange={(event) => {
              setClassificationId(event.target.value);
              setPage(1);
            }}
            disabled={!sportId}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50 sm:w-48"
          >
            <option value="">All classifications</option>
            {classifications.map((classification) => (
              <option key={classification.id} value={classification.id}>
                {classification.name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Sort by" id="browse-sort-filter">
          <select
            id="browse-sort-filter"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as PublicLeaguesQuery["sort"]);
              setPage(1);
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-48"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {isPending ? (
        <LeagueListSkeleton count={6} />
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load public leagues.</p>
      ) : !data || data.leagues.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No public leagues found"
          description="Try adjusting your filters or create your own league."
          action={
            <Link
              to="/leagues/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              Create league
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.leagues.map((league) => (
              <PublicLeagueCard
                key={league.id}
                league={league}
                onJoin={() => handleJoin(league)}
                onJoinWaitlist={() => handleJoinWaitlist(league)}
                isJoining={joinLeague.isPending && joinLeague.variables === league.id}
                isJoiningWaitlist={
                  joinWaitlist.isPending && joinWaitlist.variables === league.id
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function PublicLeagueCard({
  league,
  onJoin,
  onJoinWaitlist,
  isJoining,
  isJoiningWaitlist,
}: {
  league: PublicLeagueSummary;
  onJoin: () => void;
  onJoinWaitlist: () => void;
  isJoining: boolean;
  isJoiningWaitlist: boolean;
}) {
  return (
    <article className="flex flex-col rounded-lg border bg-card p-4">
      <div className="flex-1">
        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {league.sportName}
        </span>
        <h3 className="mt-2 font-semibold">{league.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{league.classificationName}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Hosted by {league.commissionerUsername}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          {league.memberCount} / {league.maxMembers} members
        </div>
      </div>

      <div className="mt-4">
        {league.isFull ? (
          <button
            type="button"
            onClick={onJoinWaitlist}
            disabled={isJoiningWaitlist}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {isJoiningWaitlist ? "Joining waitlist…" : "Join waitlist"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={isJoining}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isJoining ? "Joining…" : "Join"}
          </button>
        )}
      </div>
    </article>
  );
}
