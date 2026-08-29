import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 は Rust エンジンを廃止し、接続にはドライバアダプタが必須。
// MySQL / Aurora MySQL には mariadb ドライバベースの PrismaMariaDb を使う。
const connectionString = process.env.DATABASE_URL ?? "";

// Next.js の dev ではモジュール再読み込みのたびに new PrismaClient() されるため、
// グローバルにキャッシュして接続の作りすぎ（Too many connections）を防ぐ。
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaMariaDb(connectionString) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
