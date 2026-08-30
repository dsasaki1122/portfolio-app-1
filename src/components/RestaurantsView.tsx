"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import RestaurantFilter from "@/components/RestaurantFilter";
import type { Restaurant } from "@/lib/restaurants";
import {
  EMPTY_FILTER,
  filterRestaurants,
  getStationOptions,
  getTagOptions,
  type FilterState,
} from "@/lib/filterRestaurants";

type Props = {
  initialRestaurants: Restaurant[];
};

export default function RestaurantsView({ initialRestaurants }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/restaurants/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteError(body.error ?? "削除に失敗しました");
        return;
      }
      setPendingDelete(null);
      // /restaurants は force-dynamic の Server Component。props が更新されリスト再描画。
      router.refresh();
    } catch {
      setDeleteError("通信エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  const tagOptions = useMemo(
    () => getTagOptions(initialRestaurants),
    [initialRestaurants],
  );
  const stationOptions = useMemo(
    () => getStationOptions(initialRestaurants),
    [initialRestaurants],
  );
  const visible = useMemo(
    () => filterRestaurants(initialRestaurants, filter),
    [initialRestaurants, filter],
  );

  return (
    <div className="flex gap-8">
      {/* メニューを開いている間、外側クリックで閉じるための透明レイヤー */}
      {openMenuId !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {pendingDelete && (
        <Modal
          title="レストランを削除"
          onClose={() => {
            if (!deleting) setPendingDelete(null);
          }}
        >
          <p className="mb-2">
            「{pendingDelete.name}」を削除します。よろしいですか？
          </p>
          <p className="text-sm text-gray-500 mb-6">この操作は取り消せません。</p>
          {deleteError && (
            <p className="text-sm text-red-600 mb-3">{deleteError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
              className="px-4 py-2 rounded border disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
            >
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        </Modal>
      )}

      {/* Sidebar */}
      <aside className="w-72 border rounded bg-gray-50 p-4 shadow-sm self-start">
        <h2 className="font-medium mb-4">検索フィルター</h2>
        <RestaurantFilter
          tagOptions={tagOptions}
          stationOptions={stationOptions}
          value={filter}
          onChange={setFilter}
        />
      </aside>

      {/* Main list area */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">{visible.length} 件</span>
          <Link
            href="/restaurants/register"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded shadow"
          >
            <span className="text-lg">＋</span>
            <span>レストラン情報追加</span>
          </Link>
        </div>

        {visible.length === 0 ? (
          <div className="border rounded bg-white p-12 text-center text-gray-500">
            条件に一致するレストランがありません
          </div>
        ) : (
          <div className="space-y-6">
            {visible.map((r) => (
              <article
                key={r.id}
                className="bg-white border rounded shadow-sm p-4 flex items-center"
              >
                <div className="w-24 h-24 bg-gray-200 rounded mr-4 shrink-0 flex items-center justify-center">
                  写真
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{r.name}</h3>
                    <span className="text-sm text-gray-500">
                      {r.nearestStation}
                    </span>
                    <span className="text-sm text-yellow-500">
                      ★ {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <div className="text-sm text-gray-600">タグ</div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-1 bg-white border rounded text-gray-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-10 flex justify-end relative">
                  <button
                    type="button"
                    aria-label="操作メニュー"
                    aria-haspopup="menu"
                    onClick={() =>
                      setOpenMenuId(openMenuId === r.id ? null : r.id)
                    }
                    className="text-gray-500 px-2"
                  >
                    ...
                  </button>
                  {openMenuId === r.id && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 z-20 w-32 bg-white border rounded shadow-md py-1"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(r);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex justify-center text-sm text-gray-600">
          <nav className="flex items-center gap-3">
            <span className="px-1">1</span>
            <span className="px-1">2</span>
            <span className="px-1">3</span>
            <span className="px-1">4</span>
            <span className="px-1">5</span>
            <span className="px-1">&gt;</span>
          </nav>
        </div>
      </section>
    </div>
  );
}
