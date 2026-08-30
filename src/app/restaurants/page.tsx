import React from "react";
import RestaurantsView from "@/components/RestaurantsView";
import { listRestaurants } from "@/lib/restaurants";

// DB から一覧を取得するため常に動的レンダリングにする。
export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="w-full border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white">
              ☕
            </div>
            <h1 className="text-lg font-semibold">探してMeal</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 border rounded">ログアウト</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <RestaurantsView initialRestaurants={restaurants} />
      </main>
    </div>
  );
}
