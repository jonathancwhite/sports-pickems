import { createFileRoute, Link } from "@tanstack/react-router";
import { PricingTable } from "@clerk/clerk-react";
import { SubscriptionDetailsButton } from "@clerk/clerk-react/experimental";
import { useClerk } from "@clerk/clerk-react";
import { ArrowLeft, CreditCard } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ProBadge } from "@/components/pro-badge";
import { useUserBilling } from "@/hooks/use-billing";
import { useUserPlan } from "@/hooks/use-user-plan";

export const Route = createFileRoute("/_authenticated/settings/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { session } = useClerk();
  const { isLoaded, isPro } = useUserPlan();
  const { data: billing, isPending } = useUserBilling();

  if (!isLoaded || isPending) {
    return <LoadingSpinner label="Loading billing…" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to settings
        </Link>
        <div className="flex items-center gap-3">
          <CreditCard className="size-6 text-primary" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
            <p className="mt-1 text-muted-foreground">Manage your Callsheet subscription</p>
          </div>
        </div>
      </div>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">Current plan</p>
          {isPro ? <ProBadge /> : <span className="text-sm font-medium">Free</span>}
        </div>
        {isPro && billing?.proSince && (
          <p className="mt-2 text-sm text-muted-foreground">
            Pro member since {new Date(billing.proSince).toLocaleDateString()}
          </p>
        )}
        {!isPro && billing && (
          <p className="mt-2 text-sm text-muted-foreground">
            {billing.activeCreatedLeagueCount} of {billing.maxCreatedLeagues ?? "∞"} created
            leagues used · up to {billing.maxMembersPerLeague} members per league
          </p>
        )}
      </section>

      {isPro ? (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="font-medium">Subscription</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View invoices, update payment method, or cancel your subscription.
          </p>
          <div className="mt-4">
            <SubscriptionDetailsButton onSubscriptionCancel={() => session?.reload()}>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Manage subscription
              </button>
            </SubscriptionDetailsButton>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="font-medium">Upgrade to Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlimited leagues, up to 50 members, beta sports, and no upgrade prompts.
          </p>
          <div className="mt-6">
            <PricingTable
              for="user"
              newSubscriptionRedirectUrl="/settings/billing"
              fallback={<LoadingSpinner label="Loading plans…" />}
            />
          </div>
        </section>
      )}
    </div>
  );
}
