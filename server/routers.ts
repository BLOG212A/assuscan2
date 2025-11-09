import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getProfile, 
  upsertProfile, 
  getUserContracts, 
  getContract,
  deleteContract,
  decrementDocumentsUploaded,
  getUserStats,
  createContract,
  incrementDocumentsUploaded,
  createChatMessage,
  getChatHistory
} from "./db";
import { randomBytes } from "crypto";
import { scanContractFile } from "./scanContract";
import { chatWithAI } from "./openrouter";
import { createCheckoutSession } from "./stripe";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Auto-create profile if it doesn't exist
      let profile = await getProfile(ctx.user.id);
      if (!profile) {
        await upsertProfile({
          id: ctx.user.id,
          email: ctx.user.email || null,
          fullName: ctx.user.name || null,
          subscriptionPlan: "free",
          documentsUploaded: 0,
          documentsLimit: 3,
        });
        profile = await getProfile(ctx.user.id);
      }

      return {
        ...ctx.user,
        profile,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getProfile(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
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
          documentsLimit: profile.documentsLimit,
        });

        return await getProfile(ctx.user.id);
      }),
  }),

  contracts: router({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserContracts(ctx.user.id, input);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContract(input.id);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found or access denied");
        }
        return contract;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContract(input.id);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found");
        }
        return contract;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteContract(input.id, ctx.user.id);
        if (success) {
          await decrementDocumentsUploaded(ctx.user.id);
        }
        return { success };
      }),

    create: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file
        contractType: z.string().optional(),
        extractedText: z.string().optional(),
        mainCoverages: z.array(z.string()).optional(),
        amounts: z.object({
          prime_mensuelle: z.number().optional(),
          franchise: z.number().optional(),
          plafond_garantie: z.number().optional(),
        }).optional(),
        exclusions: z.array(z.string()).optional(),
        optimizationScore: z.number().optional(),
        potentialSavings: z.number().optional(),
        coverageGaps: z.array(z.object({
          title: z.string(),
          description: z.string(),
          impact: z.string(),
          solution: z.string(),
        })).optional(),
        recommendations: z.array(z.object({
          title: z.string(),
          description: z.string(),
          savings: z.number(),
          priority: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfile(ctx.user.id);
        if (!profile) {
          throw new Error("Profile not found");
        }

        // Check document limit
        if (profile.documentsUploaded >= profile.documentsLimit) {
          throw new Error("Document limit reached. Please upgrade to Premium.");
        }

        // Decode base64 file
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        
        // Scan and analyze the contract
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
          recommendations: analysis.recommendations,
        });

        await incrementDocumentsUploaded(ctx.user.id);

        return { contract, analysis };
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStats(ctx.user.id);
    }),
  }),

  billing: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ plan: z.enum(["premium", "enterprise"]) }))
      .mutation(async ({ input, ctx }) => {
        const { plan } = input;
        const user = ctx.user;

        // Déterminer le price ID selon le plan
        const priceId = plan === "premium" 
          ? process.env.STRIPE_PREMIUM_PRICE_ID 
          : process.env.STRIPE_ENTERPRISE_PRICE_ID;

        if (!priceId) {
          throw new Error(`Price ID not configured for plan: ${plan}`);
        }

        const session = await createCheckoutSession({
          priceId,
          userId: user.id,
          userEmail: user.email || '',
          successUrl: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
          cancelUrl: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/pricing?payment=cancelled`,
        });

        return { url: session.url };
      }),
  }),

  chat: router({
    send: protectedProcedure
      .input(z.object({
        contractId: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify contract ownership
        const contract = await getContract(input.contractId);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found or access denied");
        }

        // Save user message
        const userMessageId = randomBytes(16).toString("hex");
        await createChatMessage({
          id: userMessageId,
          userId: ctx.user.id,
          contractId: input.contractId,
          role: "user",
          content: input.message,
        });

        // Get chat history
        const history = await getChatHistory(input.contractId, 10);

        // Call OpenRouter API to get AI response
        const aiResponse = await chatWithAI(
          input.message,
          {
            contractType: contract.contractType || "inconnu",
            mainCoverages: contract.mainCoverages || [],
            amounts: contract.amounts || {},
            exclusions: contract.exclusions || [],
            optimizationScore: contract.optimizationScore || 0,
            potentialSavings: contract.potentialSavings || 0,
            coverageGaps: contract.coverageGaps || [],
          },
          history.map(m => ({ role: m.role, content: m.content }))
        );

        // Save assistant message
        const assistantMessageId = randomBytes(16).toString("hex");
        await createChatMessage({
          id: assistantMessageId,
          userId: ctx.user.id,
          contractId: input.contractId,
          role: "assistant",
          content: aiResponse,
        });

        return {
          success: true,
          response: aiResponse,
          timestamp: new Date().toISOString(),
        };
      }),

    history: protectedProcedure
      .input(z.object({
        contractId: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Verify contract ownership
        const contract = await getContract(input.contractId);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found or access denied");
        }

        return await getChatHistory(input.contractId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
