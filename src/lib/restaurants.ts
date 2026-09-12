import "server-only";

import { prisma } from "@/lib/prisma";
import { deleteRestaurantImage } from "@/lib/s3";

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
  imageUrl?: string;
};

// 編集画面向けの詳細DTO。一覧用の Restaurant と異なり、全フィールド・全画像を含む。
export type RestaurantDetail = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  nearestStation?: string;
  rating: number;
  visitedAt?: string; // "YYYY-MM-DD"（<input type="date"> にそのまま渡せる形式）
  tags: string[];
  images: { url: string }[];
};

// Prisma から取得する行の必要部分だけを表す型。
type RestaurantRow = {
  id: bigint;
  name: string;
  description: string | null;
  nearestStation: string | null;
  rating: { toString(): string } | null;
  restaurantTags: { tag: { name: string } }[];
  images: { imageUrl: string }[];
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
    imageUrl: row.images[0]?.imageUrl,
  };
}

/**
 * 登録済みレストランを新しい順に全件返す。
 * 認証は未実装のため、現状は全ユーザー分を対象にする。
 */
export async function listRestaurants(): Promise<Restaurant[]> {
  const rows = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      restaurantTags: { include: { tag: true } },
      images: { orderBy: { id: "asc" }, take: 1 },
    },
  });

  return rows.map(toRestaurant);
}

/**
 * レストランを1件、編集画面向けの詳細DTOで返す。存在しなければ null。
 */
export async function getRestaurantById(
  id: number,
): Promise<RestaurantDetail | null> {
  const row = await prisma.restaurant.findUnique({
    where: { id: BigInt(id) },
    include: {
      restaurantTags: { include: { tag: true } },
      images: { orderBy: { id: "asc" } },
    },
  });
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    description: row.description ?? undefined,
    address: row.address ?? undefined,
    nearestStation: row.nearestStation ?? undefined,
    rating: row.rating == null ? 0 : Number(row.rating.toString()),
    visitedAt: row.visitedAt
      ? row.visitedAt.toISOString().slice(0, 10)
      : undefined,
    tags: row.restaurantTags.map((rt) => rt.tag.name),
    images: row.images.map((img) => ({ url: img.imageUrl })),
  };
}

// レストラン作成/更新時の入力。
// rating は 0 / null を「未設定」として扱う（列は nullable な Decimal(2,1)）。
// imageUrls は RestaurantImage の運用上限（4枚）に合わせてアプリ側で切り詰める。
export type CreateRestaurantInput = {
  name: string;
  description?: string | null;
  address?: string | null;
  nearestStation?: string | null;
  rating?: number | null;
  visitedAt?: Date | null;
  tags?: string[];
  imageUrls?: string[];
};

const MAX_IMAGES = 4;

type ParsedRestaurantInput =
  | { ok: true; value: CreateRestaurantInput }
  | { ok: false; error: string };

// 未指定 / 空文字 は null に、それ以外はトリムした文字列にする。
function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * リクエストボディ（JSON.parse 済み・型不明）を CreateRestaurantInput に検証・変換する。
 * POST（作成）と PATCH（更新）の両方から共有するバリデーションロジック。
 */
export function parseCreateRestaurantInput(
  data: Record<string, unknown>,
): ParsedRestaurantInput {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name === "" || name.length > 255) {
    return { ok: false, error: "name is required (1-255 chars)" };
  }

  let rating: number | null = null;
  if (data.rating != null && data.rating !== "") {
    const n = Number(data.rating);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      return { ok: false, error: "rating must be between 0 and 5" };
    }
    rating = n > 0 ? n : null;
  }

  let visitedAt: Date | null = null;
  if (typeof data.visitedAt === "string" && data.visitedAt.trim() !== "") {
    const d = new Date(data.visitedAt);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "visitedAt is not a valid date" };
    }
    visitedAt = d;
  }

  const tags = Array.isArray(data.tags)
    ? Array.from(
        new Set(
          data.tags.map((t) => String(t).trim()).filter((t) => t.length > 0),
        ),
      )
    : [];

  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls
        .map((u) => String(u).trim())
        .filter((u) => u.length > 0 && u.length <= 1024)
        .slice(0, MAX_IMAGES)
    : [];

  return {
    ok: true,
    value: {
      name,
      description: optionalString(data.description),
      address: optionalString(data.address),
      nearestStation: optionalString(data.nearestStation),
      rating,
      visitedAt,
      tags,
      imageUrls,
    },
  };
}

// 認証未実装のため、作成レコードはすべて seed で作られる demo ユーザーに紐付ける。
const DEMO_USER_EMAIL = "demo@example.com";

/**
 * レストランを 1 件作成して、一覧と同じ正規化済みの型で返す。
 * タグは名前で connectOrCreate する（seed.ts と同じ方式）。
 * 画像は S3 にアップロード済みのURL（imageUrls）を RestaurantImage として保存する。
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

  const imageUrls = (input.imageUrls ?? []).slice(0, MAX_IMAGES);

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
      images: {
        create: imageUrls.map((imageUrl) => ({ imageUrl })),
      },
    },
    include: {
      restaurantTags: { include: { tag: true } },
      images: { orderBy: { id: "asc" }, take: 1 },
    },
  });

  return toRestaurant(row);
}

// uploadRestaurantImage/getRestaurantImage が返す "/api/images/<key>" 形式のURLから
// S3オブジェクトキーを取り出す。想定外の形式の場合は null を返す。
function extractS3KeyFromImageUrl(imageUrl: string): string | null {
  const prefix = "/api/images/";
  return imageUrl.startsWith(prefix) ? imageUrl.slice(prefix.length) : null;
}

// S3オブジェクトの削除はベストエフォート（失敗してもDB側の操作は継続する）。
async function deleteS3ImagesBestEffort(imageUrls: string[]): Promise<void> {
  await Promise.all(
    imageUrls.map(async (imageUrl) => {
      const key = extractS3KeyFromImageUrl(imageUrl);
      if (!key) return;
      try {
        await deleteRestaurantImage(key);
      } catch (e) {
        console.error("failed to delete S3 image", imageUrl, e);
      }
    }),
  );
}

/**
 * レストランを更新する。tags / imageUrls は「送信された内容が最終形」として扱い、
 * 既存との差分を計算して置き換える（一覧から外れた画像はS3オブジェクトも実削除する）。
 */
export async function updateRestaurant(
  id: number,
  input: CreateRestaurantInput,
): Promise<Restaurant> {
  const restaurantId = BigInt(id);

  const uniqueTags = Array.from(
    new Set((input.tags ?? []).map((t) => t.trim()).filter(Boolean)),
  );

  const rating =
    input.rating != null && input.rating > 0 ? input.rating : null;

  const imageUrls = (input.imageUrls ?? []).slice(0, MAX_IMAGES);

  const existingImages = await prisma.restaurantImage.findMany({
    where: { restaurantId },
  });
  const imagesToRemove = existingImages.filter(
    (img) => !imageUrls.includes(img.imageUrl),
  );
  const urlsToAdd = imageUrls.filter(
    (url) => !existingImages.some((img) => img.imageUrl === url),
  );

  await deleteS3ImagesBestEffort(imagesToRemove.map((img) => img.imageUrl));

  const row = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      nearestStation: input.nearestStation ?? null,
      rating,
      visitedAt: input.visitedAt ?? null,
      restaurantTags: {
        deleteMany: {},
        create: uniqueTags.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
      images: {
        deleteMany: { id: { in: imagesToRemove.map((img) => img.id) } },
        create: urlsToAdd.map((imageUrl) => ({ imageUrl })),
      },
    },
    include: {
      restaurantTags: { include: { tag: true } },
      images: { orderBy: { id: "asc" }, take: 1 },
    },
  });

  return toRestaurant(row);
}

/**
 * レストランを 1 件削除する。S3上の画像オブジェクトもベストエフォートで削除する。
 * restaurant_images / restaurant_tags はスキーマの onDelete: Cascade で連鎖削除される
 * （tags マスタは残す）。対象が存在しない場合 Prisma は P2025 を throw する。
 */
export async function deleteRestaurant(id: number): Promise<void> {
  const restaurantId = BigInt(id);
  const images = await prisma.restaurantImage.findMany({
    where: { restaurantId },
  });
  await deleteS3ImagesBestEffort(images.map((img) => img.imageUrl));
  await prisma.restaurant.delete({ where: { id: restaurantId } });
}
