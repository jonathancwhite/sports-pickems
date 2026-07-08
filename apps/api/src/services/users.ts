import { and, eq, isNull } from "drizzle-orm";
import { getDb, userPreferences, users } from "@callsheet/db";
import type { CurrentUser, Theme, UpdatePreferences } from "@callsheet/shared";

export async function findUserByClerkId(clerkId: string): Promise<CurrentUser | null> {
  const db = getDb();

  const row = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      theme: userPreferences.theme,
    })
    .from(users)
    .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
    .limit(1);

  const user = row[0];
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    preferences: { theme: user.theme },
  };
}

export async function updateUserPreferences(
  clerkId: string,
  preferences: UpdatePreferences,
): Promise<CurrentUser | null> {
  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
    .limit(1);

  const userId = existing[0]?.id;
  if (!userId) {
    return null;
  }

  await db
    .update(userPreferences)
    .set({ theme: preferences.theme, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId));

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
  const db = getDb();
  const { email, isVerified } = getPrimaryEmail(data);
  const username = data.username ?? data.id;
  const now = new Date();

  const existing = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.clerkId, data.id))
    .limit(1);

  let userId: string;

  if (existing[0]) {
    const emailVerifiedAt =
      existing[0].emailVerifiedAt ?? (isVerified ? now : null);

    await db
      .update(users)
      .set({
        email,
        username,
        avatarUrl: data.image_url,
        emailVerifiedAt,
        deletedAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, existing[0].id));

    userId = existing[0].id;
  } else {
    const [created] = await db
      .insert(users)
      .values({
        clerkId: data.id,
        email,
        username,
        avatarUrl: data.image_url,
        emailVerifiedAt: isVerified ? now : null,
        deletedAt: null,
        updatedAt: now,
      })
      .returning({ id: users.id });

    if (!created) {
      return;
    }

    userId = created.id;
  }

  await db
    .insert(userPreferences)
    .values({ userId, theme: "system" as Theme })
    .onConflictDoNothing();
}

export async function softDeleteUserByClerkId(clerkId: string): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db
    .update(users)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(users.clerkId, clerkId));
}
