"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_IMAGES = 4;

type ImageSlot = {
  id: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  url?: string;
  key?: string;
  error?: string;
};

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // アップロード中に削除された画像のID。アップロード完了時に後始末（S3削除）する。
  const pendingDeleteRef = useRef<Set<string>>(new Set());

  // プレビュー用の object URL をアンマウント時に解放
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const deleteFromS3 = async (key: string) => {
    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch {
      // ベストエフォート: UI上は既に消えているため失敗しても無視する
    }
  };

  const uploadImage = async (id: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        key?: string;
        error?: string;
      };
      if (!res.ok || !body.url || !body.key) {
        throw new Error(body.error ?? "アップロードに失敗しました");
      }

      if (pendingDeleteRef.current.has(id)) {
        // アップロード完了前に削除操作が行われていた場合はS3側だけ後始末する
        pendingDeleteRef.current.delete(id);
        void deleteFromS3(body.key);
        return;
      }

      const uploadedUrl = body.url;
      const uploadedKey = body.key;
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, status: "done", url: uploadedUrl, key: uploadedKey }
            : img,
        ),
      );
    } catch (err) {
      pendingDeleteRef.current.delete(id);
      const message = err instanceof Error ? err.message : "アップロードに失敗しました";
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, status: "error", error: message } : img,
        ),
      );
    }
  };

  const handleFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = Array.from(e.target.files ?? []);
    // 同じファイルを選び直しても onChange が発火するようにリセットしておく
    e.target.value = "";
    if (rawFiles.length === 0) return;

    const remaining = Math.max(MAX_IMAGES - images.length, 0);
    const files = rawFiles.slice(0, remaining);
    if (files.length === 0) return;

    const slots: ImageSlot[] = files.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));

    setImages((prev) => [...prev, ...slots]);

    files.forEach((file, i) => {
      void uploadImage(slots[i].id, file);
    });
  };

  const handleRemoveImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;

    URL.revokeObjectURL(target.previewUrl);
    setImages((prev) => prev.filter((img) => img.id !== id));

    if (target.status === "uploading") {
      pendingDeleteRef.current.add(id);
    } else if (target.status === "done" && target.key) {
      void deleteFromS3(target.key);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting || images.some((img) => img.status === "uploading")) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const tags = String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const imageUrls = images
      .filter((img) => img.status === "done" && img.url)
      .map((img) => img.url as string);

    const payload = {
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? ""),
      address: String(fd.get("address") ?? ""),
      nearestStation: String(fd.get("station") ?? ""),
      rating,
      visitedAt: String(fd.get("visitDate") ?? "") || null,
      tags,
      imageUrls,
    };

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "登録に失敗しました");
        return;
      }
      router.push("/restaurants");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full border-b">
        <div className="max-w-6xl mx-auto grid grid-cols-3 items-center py-4 px-4">
          <div className="justify-self-start">
            <Link href="/restaurants" className="inline-flex items-center gap-2 text-sm hover:opacity-70">
              <span className="text-lg">←</span>
              <span>一覧に戻る</span>
            </Link>
          </div>
          <div className="justify-self-center flex items-center gap-3">
            <div className="w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">☕</div>
            <h1 className="text-lg font-semibold">探してMeal</h1>
          </div>
          <div />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左: 画像アップロードエリア */}
          <section className="border rounded p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-600 overflow-hidden hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="text-lg font-bold">アップロードエリア</span>
            </button>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {Array.from({ length: MAX_IMAGES }).map((_, i) => (
                <div
                  key={i}
                  className="relative aspect-square border border-gray-300 rounded-2xl overflow-hidden bg-white flex items-center justify-center"
                >
                  {images[i] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[i].previewUrl}
                        alt={`サムネイル${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {images[i].status === "uploading" ? (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs">
                          アップロード中...
                        </div>
                      ) : null}
                      {images[i].status === "error" ? (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-xs text-red-600 text-center px-1">
                          失敗
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(images[i].id)}
                        aria-label={`サムネイル${i + 1}を削除`}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* 右: 入力フォーム */}
          <section className="border rounded p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm block mb-1">レストラン名</label>
                <input name="name" type="text" required className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">説明</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">住所</label>
                <input name="address" type="text" className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">最寄り駅</label>
                <input name="station" type="text" className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">評価</label>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star}つ星`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className={`text-3xl leading-none transition-colors ${
                          active ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1">訪問日</label>
                <input name="visitDate" type="date" className="w-full px-3 py-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">タグ（カンマ区切り）</label>
                <input
                  name="tags"
                  type="text"
                  placeholder="和食, 居酒屋, 駅近"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={submitting || images.some((img) => img.status === "uploading")}
                  className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                >
                  {submitting ? "登録中..." : "登録"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
