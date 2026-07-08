import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserPlan } from "@/hooks/use-user-plan";

const DISMISS_KEY = "callsheet-upgrade-banner-dismissed";

export function UpgradeBanner() {
  const { isLoaded, isPro } = useUserPlan();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!isLoaded || isPro || dismissed) {
    return null;
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-medium">Unlock Pro features</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create unlimited leagues, up to 50 members, and access beta sports.
          </p>
          <Link
            to="/settings/billing"
            className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
          >
            View plans
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss upgrade banner"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
