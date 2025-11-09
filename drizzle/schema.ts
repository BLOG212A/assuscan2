import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles with subscription and usage tracking
 */
export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 64 }).primaryKey().references(() => users.id),
  email: varchar("email", { length: 320 }),
  fullName: text("fullName"),
  avatarUrl: text("avatarUrl"),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "premium"]).default("free").notNull(),
  documentsUploaded: int("documentsUploaded").default(0).notNull(),
  documentsLimit: int("documentsLimit").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Scanned insurance contracts with AI analysis
 */
export const contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl"),
  contractType: varchar("contractType", { length: 64 }),
  status: mysqlEnum("status", ["actif", "resilie", "a_renouveler"]).default("actif"),
  extractedText: text("extractedText"),
  mainCoverages: json("mainCoverages").$type<string[]>(),
  amounts: json("amounts").$type<{
    prime_mensuelle?: number;
    franchise?: number;
    plafond_garantie?: number;
  }>(),
  exclusions: json("exclusions").$type<string[]>(),
  optimizationScore: int("optimizationScore"),
  potentialSavings: int("potentialSavings"),
  coverageGaps: json("coverageGaps").$type<Array<{
    title: string;
    description: string;
    impact: string;
    solution: string;
  }>>(),
  recommendations: json("recommendations").$type<Array<{
    title: string;
    description: string;
    savings: number;
    priority: string;
  }>>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Chat messages for the ClaireAI assistant
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  contractId: varchar("contractId", { length: 64 }).references(() => contracts.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
