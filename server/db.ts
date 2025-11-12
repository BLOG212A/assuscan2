import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, InsertProfile, contracts, InsertContract, chatMessages, InsertChatMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Profile queries
export async function upsertProfile(profile: InsertProfile): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert profile: database not available");
    return;
  }

  try {
    await db.insert(profiles).values(profile).onDuplicateKeyUpdate({
      set: {
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        subscriptionPlan: profile.subscriptionPlan,
        documentsUploaded: profile.documentsUploaded,
        documentsLimit: profile.documentsLimit,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert profile:", error);
    throw error;
  }
}

export async function getProfile(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profile: database not available");
    return undefined;
  }

  const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementDocumentsUploaded(userId: string) {
  const db = await getDb();
  if (!db) return;

  const profile = await getProfile(userId);
  if (!profile) return;

  await db.update(profiles)
    .set({ documentsUploaded: (profile.documentsUploaded || 0) + 1 })
    .where(eq(profiles.id, userId));
}

export async function decrementDocumentsUploaded(userId: string) {
  const db = await getDb();
  if (!db) return;

  const profile = await getProfile(userId);
  if (!profile) return;

  const newCount = Math.max(0, (profile.documentsUploaded || 0) - 1);
  await db.update(profiles)
    .set({ documentsUploaded: newCount })
    .where(eq(profiles.id, userId));
}

// Contract queries
export async function createContract(contract: InsertContract) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(contracts).values(contract);
  return contract;
}

export async function getContract(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserContracts(userId: string, filters?: { type?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  // Apply filters if provided
  const conditions = [eq(contracts.userId, userId)];
  if (filters?.type) {
    conditions.push(eq(contracts.contractType, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(contracts.status, filters.status as any));
  }

  const result = await db.select()
    .from(contracts)
    .where(and(...conditions))
    .orderBy(desc(contracts.createdAt));

  return result;
}

export async function deleteContract(id: string, userId: string) {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const contract = await getContract(id);
  if (!contract || contract.userId !== userId) {
    return false;
  }

  await db.delete(contracts).where(eq(contracts.id, id));
  return true;
}

// Chat message queries
export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(chatMessages).values(message);
  return message;
}

export async function getChatHistory(contractId: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.contractId, contractId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return result.reverse(); // Return in chronological order
}

export async function getUserStats(userId: string) {
  const db = await getDb();
  if (!db) return null;

  const userContracts = await getUserContracts(userId);
  
  const totalContracts = userContracts.length;
  const totalSavings = userContracts.reduce((sum, c) => sum + (c.potentialSavings || 0), 0);
  const avgScore = userContracts.length > 0
    ? Math.round(userContracts.reduce((sum, c) => sum + (c.optimizationScore || 0), 0) / userContracts.length)
    : 0;

  return {
    totalContracts,
    totalSavings,
    avgScore,
  };
}
