import { NextResponse } from "next/server";
import { deleteRestaurant } from "@/lib/restaurants";

// DB に依存するため常に動的に評価する（ビルド時の静的化を防ぐ）。
export const dynamic = "force-dynamic";

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
