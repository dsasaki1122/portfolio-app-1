import { NextResponse } from "next/server";
import { deleteRestaurantImage, uploadRestaurantImage } from "@/lib/s3";

// S3 へのアップロード/削除を伴うため常に動的に評価する。
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  try {
    const { url, key } = await uploadRestaurantImage(file);
    return NextResponse.json({ url, key }, { status: 201 });
  } catch (e) {
    console.error("POST /api/uploads failed", e);
    const message = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const key = typeof data.key === "string" ? data.key : "";
  if (key === "") {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  try {
    await deleteRestaurantImage(key);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/uploads failed", e);
    const message = e instanceof Error ? e.message : "delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
