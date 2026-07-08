import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLeagueSchema,
  FREE_TIER_MAX_LEAGUES,
  FREE_TIER_MAX_MEMBERS,
  PRO_TIER_MAX_MEMBERS,
  TIE_POLICY_OPTIONS,
  type CreateLeagueInput,
} from "@callsheet/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ProBadge } from "@/components/pro-badge";
import { useCreatedLeagueCount } from "@/hooks/use-billing";
import { useUserPlan } from "@/hooks/use-user-plan";
import { useCreateLeague, useSports } from "@/hooks/use-leagues";
import { showApiError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leagues/new")({
  component: CreateLeaguePage,
});

const STEPS = [
  "Sport",
  "Name",
  "Privacy",
  "Members",
  "Tie policy",
  "Review",
] as const;

type WizardForm = CreateLeagueInput;

function CreateLeaguePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data: sports, isPending: sportsLoading } = useSports();
  const { data: createdCountData, isPending: countLoading } = useCreatedLeagueCount();
  const { isLoaded: planLoaded, isPro } = useUserPlan();
  const createLeague = useCreateLeague();

  const activeCreatedCount = createdCountData?.count ?? 0;
  const atLeagueLimit = !isPro && activeCreatedCount >= FREE_TIER_MAX_LEAGUES;
  const maxMembersLimit = isPro ? PRO_TIER_MAX_MEMBERS : FREE_TIER_MAX_MEMBERS;

  const form = useForm<WizardForm>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      name: "",
      sportId: "",
      classificationId: "",
      isPublic: true,
      password: null,
      maxMembers: FREE_TIER_MAX_MEMBERS,
      tiePolicy: "no_points",
    },
    mode: "onChange",
  });

  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = form;

  const isPublic = watch("isPublic");
  const sportId = watch("sportId");
  const classificationId = watch("classificationId");
  const selectedSport = sports?.find((sport) => sport.id === sportId);
  const selectedClassification = selectedSport?.classifications.find(
    (classification) => classification.id === classificationId,
  );

  useEffect(() => {
    if (!sports || sportId) {
      return;
    }

    const football = sports.find((sport) => sport.slug === "football");
    const defaultClassification =
      football?.classifications.find((classification) => classification.tier === "core" && classification.active) ??
      football?.classifications.find((classification) => classification.slug === "ncaa-fbs");

    if (football && defaultClassification) {
      setValue("sportId", football.id);
      setValue("classificationId", defaultClassification.id);
    }
  }, [sports, sportId, setValue]);

  useEffect(() => {
    const current = watch("maxMembers");
    if (current > maxMembersLimit) {
      setValue("maxMembers", maxMembersLimit);
    }
  }, [maxMembersLimit, setValue, watch]);

  if (sportsLoading || countLoading || !planLoaded) {
    return <LoadingSpinner label="Loading league options…" />;
  }

  if (atLeagueLimit) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create League</h1>
          <p className="mt-1 text-muted-foreground">
            You&apos;ve reached the free tier limit
          </p>
        </div>
        <div className="rounded-lg border border-dashed bg-muted/40 p-6">
          <p className="text-sm text-muted-foreground">
            Free accounts can create up to {FREE_TIER_MAX_LEAGUES} active leagues.
            Upgrade to Pro for unlimited leagues.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/settings/billing"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function goNext() {
    let valid = false;

    switch (step) {
      case 0:
        valid = await trigger(["sportId", "classificationId"]);
        break;
      case 1:
        valid = await trigger(["name"]);
        break;
      case 2:
        valid = await trigger(["isPublic", "password"]);
        break;
      case 3:
        valid = await trigger(["maxMembers"]);
        break;
      case 4:
        valid = await trigger(["tiePolicy"]);
        break;
      default:
        valid = true;
    }

    if (valid) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  }

  async function onSubmit(values: WizardForm) {
    try {
      const league = await createLeague.mutateAsync({
        ...values,
        password: values.isPublic ? null : values.password,
      });
      showSuccess("League created!");
      navigate({
        to: "/leagues/$leagueId/invite",
        params: { leagueId: league.id },
      });
    } catch (error) {
      showApiError(error, "Failed to create league");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create League</h1>
        <p className="mt-1 text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <div className="flex gap-2">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= step ? "bg-primary" : "bg-muted",
            )}
            aria-hidden
          />
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-lg border bg-card p-6"
      >
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the sport and classification for your league.
            </p>
            <div className="space-y-3">
              {sports?.map((sport) => (
                <div key={sport.id} className="space-y-2">
                  <p className="text-sm font-medium">{sport.name}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sport.classifications.map((classification) => {
                      const isBeta = classification.tier === "beta";
                      const enabled = classification.active && (!isBeta || isPro);
                      const selected = classificationId === classification.id;

                      return (
                        <button
                          key={classification.id}
                          type="button"
                          disabled={!enabled}
                          onClick={() => {
                            setValue("sportId", sport.id, { shouldValidate: true });
                            setValue("classificationId", classification.id, {
                              shouldValidate: true,
                            });
                          }}
                          className={cn(
                            "rounded-md border px-4 py-3 text-left text-sm transition-colors",
                            selected && enabled
                              ? "border-primary bg-primary/10 text-primary"
                              : enabled
                                ? "hover:border-primary/40 hover:bg-muted/50"
                                : "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            {classification.name}
                            {isBeta && <ProBadge className="px-1.5 py-0 text-[10px]" />}
                          </span>
                          {!enabled && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {isBeta ? "Pro only" : "Coming soon"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {(errors.sportId || errors.classificationId) && (
              <p className="text-sm text-destructive">Please select a sport and classification.</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              League name
            </label>
            <input
              id="name"
              {...register("name")}
              placeholder="Sunday Pick'em Crew"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue("isPublic", true, { shouldValidate: true });
                  setValue("password", null);
                }}
                className={cn(
                  "flex-1 rounded-md border px-4 py-3 text-sm font-medium",
                  isPublic ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50",
                )}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setValue("isPublic", false, { shouldValidate: true })}
                className={cn(
                  "flex-1 rounded-md border px-4 py-3 text-sm font-medium",
                  !isPublic ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50",
                )}
              >
                Private
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? "Anyone with the invite link can join."
                : "Members need a password in addition to the invite link."}
            </p>
            {!isPublic && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  League password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="maxMembers" className="text-sm font-medium">
                Max members
              </label>
              <span className="text-sm font-semibold">{watch("maxMembers")}</span>
            </div>
            <input
              id="maxMembers"
              type="range"
              min={2}
              max={maxMembersLimit}
              {...register("maxMembers", { valueAsNumber: true })}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {isPro
                ? `Pro allows 2–${PRO_TIER_MAX_MEMBERS} members per league.`
                : `Free tier allows 2–${FREE_TIER_MAX_MEMBERS} members.`}
            </p>
            {!isPro && (
              <Link to="/settings/billing" className="text-sm font-medium text-primary hover:underline">
                Upgrade to Pro for up to {PRO_TIER_MAX_MEMBERS} members
              </Link>
            )}
            {errors.maxMembers && (
              <p className="text-sm text-destructive">{errors.maxMembers.message}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {TIE_POLICY_OPTIONS.map((option) => {
              const selected = watch("tiePolicy") === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue("tiePolicy", option.value, { shouldValidate: true })
                  }
                  className={cn(
                    "w-full rounded-md border px-4 py-3 text-left",
                    selected
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm">
            <ReviewRow label="Sport" value={`${selectedSport?.name} · ${selectedClassification?.name}`} />
            <ReviewRow label="Name" value={watch("name")} />
            <ReviewRow label="Privacy" value={isPublic ? "Public" : "Private"} />
            <ReviewRow label="Max members" value={String(watch("maxMembers"))} />
            <ReviewRow
              label="Tie policy"
              value={
                TIE_POLICY_OPTIONS.find((option) => option.value === watch("tiePolicy"))?.label ??
                ""
              }
            />
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || createLeague.isPending}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={createLeague.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createLeague.isPending ? "Creating…" : "Create league"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
