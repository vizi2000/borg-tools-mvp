import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { cvRouter } from './routers/cv';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  cv: cvRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;