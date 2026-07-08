import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, Shield, Trophy, Users } from "lucide-react";
import { APP_NAME } from "@callsheet/shared";

export const Route = createFileRoute("/_public/")({
  component: LandingPage,
});

const steps = [
  {
    step: "1",
    title: "Create a league",
    description: "Set up your pick'em league in minutes with custom rules and invite settings.",
  },
  {
    step: "2",
    title: "Set the slate",
    description: "Each week, the commissioner picks which games count toward scoring.",
  },
  {
    step: "3",
    title: "Make your picks",
    description: "Members submit picks before kickoff and climb the weekly leaderboard.",
  },
];

const features = [
  {
    icon: Shield,
    title: "Commissioner controls",
    description: "Full control over slates, scoring rules, and league settings.",
  },
  {
    icon: Link2,
    title: "Discord-style invites",
    description: "Share a simple invite link — no codes to memorize.",
  },
  {
    icon: Trophy,
    title: "Weekly leaderboards",
    description: "Track standings week by week and across the full season.",
  },
];

function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              {APP_NAME}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Pick games.{" "}
              <span className="text-primary">Beat your friends.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Run a pick&apos;em league with friends — set the slate, make your picks,
              and compete on weekly leaderboards all season long.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/sign-up"
                className="w-full rounded-md bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
              >
                Get started
              </Link>
              <Link
                to="/sign-in"
                className="w-full rounded-md border px-6 py-3 text-center text-sm font-medium hover:bg-muted sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to get your league running
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map(({ step, title, description }) => (
              <div
                key={step}
                className="relative rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Built for commissioners</h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to run a competitive pick&apos;em league
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center sm:text-left">
                <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/10 sm:mx-0">
                  <Icon className="size-6 text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <Users className="mx-auto size-10 text-primary-foreground/80" aria-hidden />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-foreground">
            Ready to start your league?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Create your account and set up your first league in minutes.
          </p>
          <Link
            to="/sign-up"
            className="mt-8 inline-block rounded-md bg-background px-6 py-3 text-sm font-medium text-primary hover:opacity-90"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>
    </div>
  );
}
