import "server-only";

import { prisma } from "@/lib/prisma";

// アプリ全体で共有するレストランのドメイン型。
// DB スキーマ（Prisma）では nearestStation / rating は nullable かつ
// rating は Decimal だが、ここでは画面が扱いやすい非 null の素の値に正規化する。
export type Restaurant = {
  id: number;
  name: string;
  tags: string[];
  nearestStation: string;
  rating: number;
  description?: string;
};

// Prisma から取得する行の必要部分だけを表す型。
type RestaurantRow = {
  id: bigint;
  name: string;
  description: string | null;
  nearestStation: string | null;
  rating: { toString(): string } | null;
  restaurantTags: { tag: { name: string } }[];
};

function toRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: Number(row.id),
    name: row.name,
    tags: row.restaurantTags.map((rt) => rt.tag.name),
    // null 潰し（rating→0 / station→""）は暫定対応。将来 nullable な DTO に
    // 変える場合は filterRestaurants.ts と一覧の描画側も更新が必要。
    nearestStation: row.nearestStation ?? "",
    rating: row.rating == null ? 0 : Number(row.rating.toString()),
    description: row.description ?? undefined,
  };
}

/**
 * 登録済みレストランを新しい順に全件返す。
 * 認証は未実装のため、現状は全ユーザー分を対象にする。
 */
export async function listRestaurants(): Promise<Restaurant[]> {
  const rows = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: { restaurantTags: { include: { tag: true } } },
  });

  return rows.map(toRestaurant);
}

// レストラン作成時の入力。DB スキーマに合わせて写真以外の項目を受け取る。
// rating は 0 / null を「未設定」として扱う（列は nullable な Decimal(2,1)）。
export type CreateRestaurantInput = {
  name: string;
  description?: string | null;
  address?: string | null;
  nearestStation?: string | null;
  rating?: number | null;
  visitedAt?: Date | null;
  tags?: string[];
};

// 認証未実装のため、作成レコードはすべて seed で作られる demo ユーザーに紐付ける。
const DEMO_USER_EMAIL = "demo@example.com";

/**
 * レストランを 1 件作成して、一覧と同じ正規化済みの型で返す。
 * タグは名前で connectOrCreate する（seed.ts と同じ方式）。
 * 写真は S3 未整備のため対象外＝ RestaurantImage は作らない。
 */
export async function createRestaurant(
  input: CreateRestaurantInput,
): Promise<Restaurant> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });
  if (!user) {
    throw new Error("demo user not found — run `npm run db:seed`");
  }

  // trim + 空除去 + 重複除去（RestaurantTag の複合 PK 衝突を避ける）。
  const uniqueTags = Array.from(
    new Set((input.tags ?? []).map((t) => t.trim()).filter(Boolean)),
  );

  const rating =
    input.rating != null && input.rating > 0 ? input.rating : null;

  const row = await prisma.restaurant.create({
    data: {
      userId: user.id,
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      nearestStation: input.nearestStation ?? null,
      rating,
      visitedAt: input.visitedAt ?? null,
      restaurantTags: {
        create: uniqueTags.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
    include: { restaurantTags: { include: { tag: true } } },
  });

  return toRestaurant(row);
}

/**
 * レストランを 1 件削除する。
 * restaurant_images / restaurant_tags はスキーマの onDelete: Cascade で連鎖削除される
 * （tags マスタは残す）。対象が存在しない場合 Prisma は P2025 を throw する。
 */
export async function deleteRestaurant(id: number): Promise<void> {
  await prisma.restaurant.delete({ where: { id: BigInt(id) } });
}
