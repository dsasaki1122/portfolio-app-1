"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import RestaurantFilter from "@/components/RestaurantFilter";
import { sampleRestaurants } from "@/lib/sampleRestaurants";
import {
  EMPTY_FILTER,
  filterRestaurants,
  getStationOptions,
  getTagOptions,
  type FilterState,
} from "@/lib/filterRestaurants";

export default function RestaurantsPage() {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  const tagOptions = useMemo(() => getTagOptions(sampleRestaurants), []);
  const stationOptions = useMemo(
    () => getStationOptions(sampleRestaurants),
    [],
  );
  const visible = useMemo(
    () => filterRestaurants(sampleRestaurants, filter),
    [filter],
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">☕</div>
            <h1 className="text-lg font-semibold">探してMeal</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 border rounded">ログアウト</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
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
                  <article key={r.id} className="bg-white border rounded shadow-sm p-4 flex items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded mr-4 shrink-0 flex items-center justify-center">写真</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{r.name}</h3>
                        <span className="text-sm text-gray-500">{r.nearestStation}</span>
                        <span className="text-sm text-yellow-500">★ {r.rating.toFixed(1)}</span>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-600">タグ</div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {r.tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-1 bg-white border rounded text-gray-700">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-10 flex justify-end">
                      <button className="text-gray-500">...</button>
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
      </main>
    </div>
  );
}
