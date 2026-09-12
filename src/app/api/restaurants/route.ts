import { NextResponse } from "next/server";
import { createRestaurant, listRestaurants } from "@/lib/restaurants";

// DB に依存するため常に動的に評価する（ビルド時の静的化を防ぐ）。
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurants = await listRestaurants();
    return NextResponse.json(restaurants);
  } catch (e) {
    console.error("GET /api/restaurants failed", e);
    return NextResponse.json(
      { error: "failed to fetch restaurants" },
      { status: 500 },
    );
  }
}

// 未指定 / 空文字 は null に、それ以外はトリムした文字列にする。
function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name === "" || name.length > 255) {
    return NextResponse.json(
      { error: "name is required (1-255 chars)" },
      { status: 400 },
    );
  }

  let rating: number | null = null;
  if (data.rating != null && data.rating !== "") {
    const n = Number(data.rating);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      return NextResponse.json(
        { error: "rating must be between 0 and 5" },
        { status: 400 },
      );
    }
    rating = n > 0 ? n : null;
  }

  let visitedAt: Date | null = null;
  if (typeof data.visitedAt === "string" && data.visitedAt.trim() !== "") {
    const d = new Date(data.visitedAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "visitedAt is not a valid date" },
        { status: 400 },
      );
    }
    visitedAt = d;
  }

  const tags = Array.isArray(data.tags)
    ? Array.from(
        new Set(
          data.tags
            .map((t) => String(t).trim())
            .filter((t) => t.length > 0),
        ),
      )
    : [];

  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls
        .map((u) => String(u).trim())
        .filter((u) => u.length > 0 && u.length <= 1024)
        .slice(0, 4)
    : [];

  try {
    const created = await createRestaurant({
      name,
      description: optionalString(data.description),
      address: optionalString(data.address),
      nearestStation: optionalString(data.nearestStation),
      rating,
      visitedAt,
      tags,
      imageUrls,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST /api/restaurants failed", e);
    return NextResponse.json(
      { error: "failed to create restaurant" },
      { status: 500 },
    );
  }
}
