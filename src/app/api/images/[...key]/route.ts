import { NextResponse } from "next/server";
import { getRestaurantImage } from "@/lib/s3";

// S3 への都度アクセスを伴うため常に動的に評価する。
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const { body, contentType } = await getRestaurantImage(objectKey);
    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("GET /api/images failed", e);
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
