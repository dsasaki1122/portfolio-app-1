import { NextResponse } from "next/server";
import {
  deleteRestaurant,
  parseCreateRestaurantInput,
  updateRestaurant,
} from "@/lib/restaurants";

// DB に依存するため常に動的に評価する（ビルド時の静的化を防ぐ）。
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

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
    const updated = await updateRestaurant(numId, parsed.value);
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    // P2025 = 更新対象が見つからない
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error("PATCH /api/restaurants/[id] failed", e);
    return NextResponse.json(
      { error: "failed to update restaurant" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    await deleteRestaurant(numId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    // P2025 = 削除対象が見つからない
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error("DELETE /api/restaurants/[id] failed", e);
    return NextResponse.json(
      { error: "failed to delete restaurant" },
      { status: 500 },
    );
  }
}
