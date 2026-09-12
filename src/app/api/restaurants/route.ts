import { NextResponse } from "next/server";
import {
  createRestaurant,
  listRestaurants,
  parseCreateRestaurantInput,
} from "@/lib/restaurants";

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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCreateRestaurantInput((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await createRestaurant(parsed.value);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST /api/restaurants failed", e);
    return NextResponse.json(
      { error: "failed to create restaurant" },
      { status: 500 },
    );
  }
}
