import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implement user profile fetching
      return {
        id: ctx.session.user.id,
        email: ctx.session.user.email,
        name: ctx.session.user.name,
        image: ctx.session.user.image,
        githubUsername: '', // Will be populated from GitHub OAuth
        createdAt: new Date(),
        subscription: {
          plan: 'free' as const,
          monthlyGenerations: 10,
          currentMonthUsage: 0,
        },
      };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      githubUsername: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement profile update
      return {
        success: true,
        user: {
          ...ctx.session.user,
          ...input,
        },
      };
    }),

  getUsage: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implement usage tracking
      return {
        monthlyLimit: 10,
        currentUsage: 0,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      };
    }),
});