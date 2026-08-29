import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "demo@example.com";

// 既存の画面モック（src/app/restaurants/page.tsx）と揃えたサンプルデータ
const restaurants = [
  {
    name: "和食 さくら",
    description: "落ち着いた雰囲気の和食店。",
    address: "東京都新宿区1-1-1",
    nearestStation: "新宿駅",
    rating: 4.5,
    tags: ["和食", "居酒屋", "駅近"],
  },
  {
    name: "Bistro Lumiere",
    description: "記念日に使えるフレンチビストロ。",
    address: "東京都渋谷区2-2-2",
    nearestStation: "表参道駅",
    rating: 4.2,
    tags: ["フレンチ", "デート向け"],
  },
  {
    name: "麺屋 太郎",
    description: "濃厚豚骨が人気のラーメン店。",
    address: "東京都豊島区3-3-3",
    nearestStation: "池袋駅",
    rating: 3.8,
    tags: ["ラーメン", "ランチ"],
  },
  {
    name: "Cafe 森の小径",
    description: "自家製スイーツが評判のカフェ。",
    address: "東京都世田谷区4-4-4",
    nearestStation: "下北沢駅",
    rating: 4.0,
    tags: ["カフェ", "スイーツ"],
  },
];

async function main() {
  // 冪等化: デモユーザーを削除すると restaurants / restaurant_images / restaurant_tags は
  // onDelete: Cascade で連鎖削除される（tags マスタは残す）
  await prisma.user.deleteMany({ where: { email: DEMO_USER_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: "デモユーザー",
      email: DEMO_USER_EMAIL,
      // 認証は未実装。実運用では bcrypt などでハッシュした値を格納する
      passwordHash: "dev-placeholder-not-a-real-hash",
    },
  });

  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        userId: user.id,
        name: r.name,
        description: r.description,
        address: r.address,
        nearestStation: r.nearestStation,
        rating: r.rating,
        visitedAt: new Date("2026-08-01"),
        restaurantTags: {
          create: r.tags.map((name) => ({
            tag: {
              connectOrCreate: { where: { name }, create: { name } },
            },
          })),
        },
      },
    });
  }

  const restaurantCount = await prisma.restaurant.count();
  const tagCount = await prisma.tag.count();
  console.log(
    `seeded: user=${user.email}, restaurants=${restaurantCount}, tags=${tagCount}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
