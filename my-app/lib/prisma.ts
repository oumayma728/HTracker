import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// Initialize the Prisma Client
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
//creating or reusing the prisma client instance to avoid creating multiple instances in development mode
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;