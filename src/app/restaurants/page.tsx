import React from "react";

type Restaurant = {
	id: number;
	name: string;
	tags: string[];
	description?: string;
};

const sampleRestaurants: Restaurant[] = [
	{ id: 1, name: "和食 さくら", tags: ["和食", "居酒屋", "駅近"] },
	{ id: 2, name: "Bistro Lumiere", tags: ["フレンチ", "デート向け"] },
	{ id: 3, name: "麺屋 太郎", tags: ["ラーメン", "ランチ"] },
	{ id: 4, name: "Cafe 森の小径", tags: ["カフェ", "スイーツ"] },
];

export default function RestaurantsPage() {
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
					<aside className="w-72 border rounded bg-gray-50 p-4 shadow-sm">
						<h2 className="font-medium mb-4">検索フィルター</h2>
						<div className="h-[60vh] bg-gray-200 rounded" />
					</aside>

					{/* Main list area */}
					<section className="flex-1">
						<div className="flex items-center justify-end mb-4">
							<button className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded shadow">
								<span className="text-lg">＋</span>
								<span>レストラン情報追加</span>
							</button>
						</div>

						<div className="space-y-6">
							{sampleRestaurants.map((r) => (
								<article key={r.id} className="bg-white border rounded shadow-sm p-4 flex items-center">
									<div className="w-24 h-24 bg-gray-200 rounded mr-4 flex-shrink-0 flex items-center justify-center">写真</div>
									<div className="flex-1">
										<h3 className="font-medium mb-2">{r.name}</h3>
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
