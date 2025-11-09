// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow()
});
var profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 64 }).primaryKey().references(() => users.id),
  email: varchar("email", { length: 320 }),
  fullName: text("fullName"),
  avatarUrl: text("avatarUrl"),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "premium"]).default("free").notNull(),
  documentsUploaded: int("documentsUploaded").default(0).notNull(),
  documentsLimit: int("documentsLimit").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow()
});
var contracts = mysqlTable("contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl"),
  contractType: varchar("contractType", { length: 64 }),
  status: mysqlEnum("status", ["actif", "resilie", "a_renouveler"]).default("actif"),
  extractedText: text("extractedText"),
  mainCoverages: json("mainCoverages").$type(),
  amounts: json("amounts").$type(),
  exclusions: json("exclusions").$type(),
  optimizationScore: int("optimizationScore"),
  potentialSavings: int("potentialSavings"),
  coverageGaps: json("coverageGaps").$type(),
  recommendations: json("recommendations").$type(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow()
});
var chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  contractId: varchar("contractId", { length: 64 }).references(() => contracts.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      id: user.id
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === void 0) {
      if (user.id === ENV.ownerId) {
        user.role = "admin";
        values.role = "admin";
        updateSet.role = "admin";
      }
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUser(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertProfile(profile) {
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
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert profile:", error);
    throw error;
  }
}
async function getProfile(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profile: database not available");
    return void 0;
  }
  const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function incrementDocumentsUploaded(userId) {
  const db = await getDb();
  if (!db) return;
  const profile = await getProfile(userId);
  if (!profile) return;
  await db.update(profiles).set({ documentsUploaded: (profile.documentsUploaded || 0) + 1 }).where(eq(profiles.id, userId));
}
async function decrementDocumentsUploaded(userId) {
  const db = await getDb();
  if (!db) return;
  const profile = await getProfile(userId);
  if (!profile) return;
  const newCount = Math.max(0, (profile.documentsUploaded || 0) - 1);
  await db.update(profiles).set({ documentsUploaded: newCount }).where(eq(profiles.id, userId));
}
async function createContract(contract) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(contracts).values(contract);
  return contract;
}
async function getContract(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserContracts(userId, filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(contracts).where(eq(contracts.userId, userId));
  const conditions = [eq(contracts.userId, userId)];
  if (filters?.type) {
    conditions.push(eq(contracts.contractType, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(contracts.status, filters.status));
  }
  const result = await db.select().from(contracts).where(and(...conditions)).orderBy(desc(contracts.createdAt));
  return result;
}
async function deleteContract(id, userId) {
  const db = await getDb();
  if (!db) return false;
  const contract = await getContract(id);
  if (!contract || contract.userId !== userId) {
    return false;
  }
  await db.delete(contracts).where(eq(contracts.id, id));
  return true;
}
async function createChatMessage(message) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(chatMessages).values(message);
  return message;
}
async function getChatHistory(contractId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(chatMessages).where(eq(chatMessages.contractId, contractId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  return result.reverse();
}
async function getUserStats(userId) {
  const db = await getDb();
  if (!db) return null;
  const userContracts = await getUserContracts(userId);
  const totalContracts = userContracts.length;
  const totalSavings = userContracts.reduce((sum, c) => sum + (c.potentialSavings || 0), 0);
  const avgScore = userContracts.length > 0 ? Math.round(userContracts.reduce((sum, c) => sum + (c.optimizationScore || 0), 0) / userContracts.length) : 0;
  return {
    totalContracts,
    totalSavings,
    avgScore
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user ID
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.id);
   */
  async createSessionToken(userId, options = {}) {
    return this.signSession(
      {
        openId: userId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUser(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          id: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUser(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      id: user.id,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        id: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
import { randomBytes } from "crypto";

// server/openrouter.ts
var OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
var OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
async function analyzeContract(extractedText) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  const prompt = `Tu es ClaireAI, l'intelligence artificielle d'AssurScan, expert en analyse de contrats d'assurance fran\xE7ais.

Ta mission : Analyser ce contrat d'assurance et extraire les informations cl\xE9s au format JSON structur\xE9.

ANALYSE CE CONTRAT :
---
${extractedText}
---

R\xC9PONDS UNIQUEMENT AVEC CE JSON (aucun texte avant ou apr\xE8s) :
{
  "contractType": "type pr\xE9cis (auto/habitation/sant\xE9/vie/pr\xE9voyance/pro)",
  "mainCoverages": [
    "garantie 1",
    "garantie 2",
    "garantie 3"
  ],
  "amounts": {
    "prime_mensuelle": nombre,
    "franchise": nombre,
    "plafond_garantie": nombre
  },
  "exclusions": [
    "exclusion 1",
    "exclusion 2"
  ],
  "optimizationScore": nombre entre 0 et 100,
  "potentialSavings": nombre en euros par an,
  "coverageGaps": [
    {
      "title": "titre de la lacune",
      "description": "explication d\xE9taill\xE9e",
      "impact": "co\xFBt potentiel en cas de sinistre",
      "solution": "comment combler cette lacune"
    }
  ],
  "recommendations": [
    {
      "title": "titre de la recommandation",
      "description": "explication claire",
      "savings": nombre en euros,
      "priority": "haute/moyenne/basse"
    }
  ]
}

CRIT\xC8RES D'\xC9VALUATION DU SCORE :
- 90-100 : Excellent contrat, tr\xE8s bien optimis\xE9
- 75-89 : Bon contrat, quelques am\xE9liorations possibles
- 50-74 : Contrat moyen, optimisations importantes disponibles
- 0-49 : Contrat sous-optimal, changement recommand\xE9

SOIS PR\xC9CIS, FACTUEL ET ORIENT\xC9 ACTION.`;
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://assurscan.fr",
        "X-Title": "AssurScan"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es ClaireAI, expert en analyse de contrats d'assurance fran\xE7ais. Tu r\xE9ponds uniquement en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2e3
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenRouter");
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from AI");
    }
    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}
async function chatWithAI(userMessage, contractContext, chatHistory) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }
  const systemPrompt = `Tu es ClaireAI, l'assistant virtuel intelligent d'AssurScan, expert en assurance fran\xE7aise.

CONTEXTE DU CONTRAT DE L'UTILISATEUR :
Type : ${contractContext.contractType}
Garanties : ${contractContext.mainCoverages.join(", ")}
Montants : Prime ${contractContext.amounts.prime_mensuelle}\u20AC/mois, Franchise ${contractContext.amounts.franchise}\u20AC
Exclusions : ${contractContext.exclusions.join(", ")}
Score : ${contractContext.optimizationScore}/100
\xC9conomies potentielles : ${contractContext.potentialSavings}\u20AC/an
Lacunes : ${contractContext.coverageGaps.length} d\xE9tect\xE9es

INSTRUCTIONS :
- R\xE9ponds de mani\xE8re claire, pr\xE9cise et p\xE9dagogique en fran\xE7ais
- Base-toi UNIQUEMENT sur le contexte du contrat fourni
- Si tu ne sais pas, dis-le honn\xEAtement et propose de contacter un expert humain
- Utilise des exemples concrets
- Reste professionnel mais accessible
- Si la question concerne des \xE9conomies, sois pr\xE9cis sur les montants
- Si la question concerne une garantie, explique clairement ce qui est couvert ou non

R\xC9PONDS EN 2-3 PARAGRAPHES MAXIMUM.`;
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10),
      // Keep last 10 messages
      { role: "user", content: userMessage }
    ];
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://assurscan.fr",
        "X-Title": "AssurScan"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenRouter");
    }
    return content;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/scanContract.ts
async function scanContractFile(file, fileName) {
  const { url: fileUrl } = await storagePut(
    `contracts/${Date.now()}-${fileName}`,
    file,
    "application/pdf"
  );
  const extractedText = `
CONTRAT D'ASSURANCE AUTOMOBILE

Assur\xE9 : Jean Dupont
V\xE9hicule : Renault Clio 2020
Immatriculation : AB-123-CD

GARANTIES INCLUSES :
- Responsabilit\xE9 civile
- Dommages tous accidents
- Vol et incendie
- Protection juridique

MONTANTS :
Prime mensuelle : 45\u20AC
Franchise : 350\u20AC
Plafond de garantie : 50 000\u20AC

EXCLUSIONS :
- Conduite en \xE9tat d'ivresse
- Catastrophes naturelles
- Usage professionnel du v\xE9hicule

Date de souscription : 01/01/2024
\xC9ch\xE9ance annuelle : 31/12/2024
  `.trim();
  const analysis = await analyzeContract(extractedText);
  return {
    extractedText,
    fileUrl,
    analysis
  };
}

// server/stripe.ts
import Stripe from "stripe";
var stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
var stripe = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
    typescript: true
  });
} else {
  console.warn("[Stripe] STRIPE_SECRET_KEY not configured - billing features disabled");
}
var PRICING_PLANS = {
  free: {
    name: "Free",
    price: 0,
    documents_limit: 3,
    features: [
      "3 scans de contrats par mois",
      "Analyse IA basique",
      "Acc\xE8s \xE0 ClaireAI (limit\xE9)",
      "Statistiques de base"
    ]
  },
  premium: {
    name: "Premium",
    price: 19.99,
    documents_limit: 50,
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID || "",
    features: [
      "50 scans de contrats par mois",
      "Analyse IA avanc\xE9e",
      "Acc\xE8s illimit\xE9 \xE0 ClaireAI",
      "Statistiques d\xE9taill\xE9es",
      "Export PDF des analyses",
      "Support prioritaire"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: 99.99,
    documents_limit: -1,
    // illimité
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    features: [
      "Scans illimit\xE9s",
      "Analyse IA premium",
      "ClaireAI avec contexte \xE9tendu",
      "Statistiques avanc\xE9es",
      "Export multi-formats",
      "API access",
      "Support d\xE9di\xE9 24/7",
      "Onboarding personnalis\xE9"
    ]
  }
};
async function createCheckoutSession(params) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
  }
  const { priceId, userId, userEmail, successUrl, cancelUrl } = params;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer_email: userEmail,
    metadata: {
      userId
    },
    subscription_data: {
      metadata: {
        userId
      }
    },
    success_url: successUrl,
    cancel_url: cancelUrl
  });
  return session;
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      let profile = await getProfile(ctx.user.id);
      if (!profile) {
        await upsertProfile({
          id: ctx.user.id,
          email: ctx.user.email || null,
          fullName: ctx.user.name || null,
          subscriptionPlan: "free",
          documentsUploaded: 0,
          documentsLimit: 3
        });
        profile = await getProfile(ctx.user.id);
      }
      return {
        ...ctx.user,
        profile
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getProfile(ctx.user.id);
    }),
    update: protectedProcedure.input(z2.object({
      fullName: z2.string().optional(),
      avatarUrl: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const profile = await getProfile(ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      await upsertProfile({
        id: ctx.user.id,
        email: profile.email,
        fullName: input.fullName ?? profile.fullName,
        avatarUrl: input.avatarUrl ?? profile.avatarUrl,
        subscriptionPlan: profile.subscriptionPlan,
        documentsUploaded: profile.documentsUploaded,
        documentsLimit: profile.documentsLimit
      });
      return await getProfile(ctx.user.id);
    })
  }),
  contracts: router({
    list: protectedProcedure.input(z2.object({
      type: z2.string().optional(),
      status: z2.string().optional()
    }).optional()).query(async ({ ctx, input }) => {
      return await getUserContracts(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.string() })).query(async ({ ctx, input }) => {
      const contract = await getContract(input.id);
      if (!contract || contract.userId !== ctx.user.id) {
        throw new Error("Contract not found or access denied");
      }
      return contract;
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.string() })).query(async ({ ctx, input }) => {
      const contract = await getContract(input.id);
      if (!contract || contract.userId !== ctx.user.id) {
        throw new Error("Contract not found");
      }
      return contract;
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.string() })).mutation(async ({ ctx, input }) => {
      const success = await deleteContract(input.id, ctx.user.id);
      if (success) {
        await decrementDocumentsUploaded(ctx.user.id);
      }
      return { success };
    }),
    create: protectedProcedure.input(z2.object({
      fileName: z2.string(),
      fileData: z2.string(),
      // base64 encoded file
      contractType: z2.string().optional(),
      extractedText: z2.string().optional(),
      mainCoverages: z2.array(z2.string()).optional(),
      amounts: z2.object({
        prime_mensuelle: z2.number().optional(),
        franchise: z2.number().optional(),
        plafond_garantie: z2.number().optional()
      }).optional(),
      exclusions: z2.array(z2.string()).optional(),
      optimizationScore: z2.number().optional(),
      potentialSavings: z2.number().optional(),
      coverageGaps: z2.array(z2.object({
        title: z2.string(),
        description: z2.string(),
        impact: z2.string(),
        solution: z2.string()
      })).optional(),
      recommendations: z2.array(z2.object({
        title: z2.string(),
        description: z2.string(),
        savings: z2.number(),
        priority: z2.string()
      })).optional()
    })).mutation(async ({ ctx, input }) => {
      const profile = await getProfile(ctx.user.id);
      if (!profile) {
        throw new Error("Profile not found");
      }
      if (profile.documentsUploaded >= profile.documentsLimit) {
        throw new Error("Document limit reached. Please upgrade to Premium.");
      }
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const { extractedText, fileUrl, analysis } = await scanContractFile(fileBuffer, input.fileName);
      const contractId = randomBytes(16).toString("hex");
      const contract = await createContract({
        id: contractId,
        userId: ctx.user.id,
        fileName: input.fileName,
        fileUrl,
        extractedText,
        contractType: analysis.contractType,
        mainCoverages: analysis.mainCoverages,
        amounts: analysis.amounts,
        exclusions: analysis.exclusions,
        optimizationScore: analysis.optimizationScore,
        potentialSavings: analysis.potentialSavings,
        coverageGaps: analysis.coverageGaps,
        recommendations: analysis.recommendations
      });
      await incrementDocumentsUploaded(ctx.user.id);
      return { contract, analysis };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStats(ctx.user.id);
    })
  }),
  billing: router({
    createCheckoutSession: protectedProcedure.input(z2.object({ plan: z2.enum(["premium", "enterprise"]) })).mutation(async ({ input, ctx }) => {
      const { plan } = input;
      const user = ctx.user;
      const priceId = plan === "premium" ? process.env.STRIPE_PREMIUM_PRICE_ID : process.env.STRIPE_ENTERPRISE_PRICE_ID;
      if (!priceId) {
        throw new Error(`Price ID not configured for plan: ${plan}`);
      }
      const session = await createCheckoutSession({
        priceId,
        userId: user.id,
        userEmail: user.email || "",
        successUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
        cancelUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/pricing?payment=cancelled`
      });
      return { url: session.url };
    })
  }),
  chat: router({
    send: protectedProcedure.input(z2.object({
      contractId: z2.string(),
      message: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const contract = await getContract(input.contractId);
      if (!contract || contract.userId !== ctx.user.id) {
        throw new Error("Contract not found or access denied");
      }
      const userMessageId = randomBytes(16).toString("hex");
      await createChatMessage({
        id: userMessageId,
        userId: ctx.user.id,
        contractId: input.contractId,
        role: "user",
        content: input.message
      });
      const history = await getChatHistory(input.contractId, 10);
      const aiResponse = await chatWithAI(
        input.message,
        {
          contractType: contract.contractType || "inconnu",
          mainCoverages: contract.mainCoverages || [],
          amounts: contract.amounts || {},
          exclusions: contract.exclusions || [],
          optimizationScore: contract.optimizationScore || 0,
          potentialSavings: contract.potentialSavings || 0,
          coverageGaps: contract.coverageGaps || []
        },
        history.map((m) => ({ role: m.role, content: m.content }))
      );
      const assistantMessageId = randomBytes(16).toString("hex");
      await createChatMessage({
        id: assistantMessageId,
        userId: ctx.user.id,
        contractId: input.contractId,
        role: "assistant",
        content: aiResponse
      });
      return {
        success: true,
        response: aiResponse,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }),
    history: protectedProcedure.input(z2.object({
      contractId: z2.string(),
      limit: z2.number().optional()
    })).query(async ({ ctx, input }) => {
      const contract = await getContract(input.contractId);
      if (!contract || contract.userId !== ctx.user.id) {
        throw new Error("Contract not found or access denied");
      }
      return await getChatHistory(input.contractId, input.limit);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
