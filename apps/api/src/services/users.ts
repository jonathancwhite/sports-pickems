import { prisma } from "@callsheet/db";
import type { CurrentUser, Theme, UpdatePreferences } from "@callsheet/shared";

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
    preferences: { theme: user.preferences?.theme ?? "system" },
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
    create: { userId: existing.id, theme: preferences.theme },
    update: { theme: preferences.theme },
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

export async function upsertUserFromClerk(data: ClerkUserData): Promise<void> {
  const { email, isVerified } = getPrimaryEmail(data);
  const username = data.username ?? data.id;
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
