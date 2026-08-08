import { prisma } from "@callsheet/db";
import {
  DEFAULT_PALETTE,
  paletteSchema,
  type CurrentUser,
  type Theme,
  type UpdatePreferences,
} from "@callsheet/shared";

export async function findUserByClerkId(clerkId: string): Promise<CurrentUser | null> {
  const user = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    include: { preferences: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    preferences: {
      theme: user.preferences?.theme ?? "system",
      // The column is free text; fall back to the default if a stored value no
      // longer matches a known palette.
      palette: paletteSchema.catch(DEFAULT_PALETTE).parse(user.preferences?.palette),
    },
  };
}

export async function updateUserPreferences(
  clerkId: string,
  preferences: UpdatePreferences,
): Promise<CurrentUser | null> {
  const existing = await prisma.user.findFirst({
    where: { clerkId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await prisma.userPreference.upsert({
    where: { userId: existing.id },
    create: { userId: existing.id, ...preferences },
    update: preferences,
  });

  return findUserByClerkId(clerkId);
}

interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: { status: string } | null;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  username: string | null;
  image_url: string | null;
}

function getPrimaryEmail(data: ClerkUserData): {
  email: string;
  isVerified: boolean;
} {
  const primary =
    data.email_addresses.find((entry) => entry.id === data.primary_email_address_id) ??
    data.email_addresses[0];

  if (!primary) {
    return { email: "", isVerified: false };
  }

  return {
    email: primary.email_address,
    isVerified: primary.verification?.status === "verified",
  };
}

/**
 * `username` is the user's public handle — it renders as `@username` on the
 * dashboard and appears on leaderboards, league rosters, pick reveals, and
 * transfer emails. Clerk requires a username at sign-up, so `data.username` is
 * populated in practice; the fallbacks only keep the non-null database column
 * satisfied if a webhook ever arrives without one. Deliberately no name-based
 * fallback — a real name has spaces and isn't unique, so it reads wrong behind
 * an `@` and collides between two members with the same name.
 */
export function resolveUsername(data: ClerkUserData, email: string): string {
  const candidates = [data.username, email.split("@")[0]];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return data.id;
}

export async function upsertUserFromClerk(data: ClerkUserData): Promise<void> {
  const { email, isVerified } = getPrimaryEmail(data);
  const username = resolveUsername(data, email);
  const now = new Date();

  const existing = await prisma.user.findUnique({
    where: { clerkId: data.id },
    select: { id: true, emailVerifiedAt: true },
  });

  if (existing) {
    const emailVerifiedAt = existing.emailVerifiedAt ?? (isVerified ? now : null);

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        username,
        avatarUrl: data.image_url,
        emailVerifiedAt,
        deletedAt: null,
        updatedAt: now,
      },
    });

    await prisma.userPreference.upsert({
      where: { userId: existing.id },
      create: { userId: existing.id, theme: "system" as Theme },
      update: {},
    });

    return;
  }

  await prisma.user.create({
    data: {
      clerkId: data.id,
      email,
      username,
      avatarUrl: data.image_url,
      emailVerifiedAt: isVerified ? now : null,
      preferences: {
        create: { theme: "system" as Theme },
      },
    },
  });
}

export async function softDeleteUserByClerkId(clerkId: string): Promise<void> {
  const now = new Date();

  await prisma.user.updateMany({
    where: { clerkId },
    data: { deletedAt: now, updatedAt: now },
  });
}
