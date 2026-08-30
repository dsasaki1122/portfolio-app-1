import type { Restaurant } from "@/lib/restaurants";

export type FilterState = {
  keyword: string;
  tags: string[];
  station: string;
  minRating: number;
};

export const EMPTY_FILTER: FilterState = {
  keyword: "",
  tags: [],
  station: "",
  minRating: 0,
};

/**
 * すべての条件を AND で満たす店だけを返す純粋関数。
 * - keyword: name / description のいずれかに部分一致（大小無視）
 * - tags: 選択タグのいずれかを持つ（OR）
 * - station: 最寄り駅が完全一致
 * - minRating: rating が下限以上
 */
export function filterRestaurants(
  list: Restaurant[],
  filter: FilterState,
): Restaurant[] {
  const keyword = filter.keyword.trim().toLowerCase();

  return list.filter((r) => {
    if (keyword) {
      const haystack = `${r.name} ${r.description ?? ""}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    if (filter.tags.length > 0) {
      if (!filter.tags.some((t) => r.tags.includes(t))) return false;
    }

    if (filter.station && r.nearestStation !== filter.station) return false;

    if (filter.minRating > 0 && r.rating < filter.minRating) return false;

    return true;
  });
}

export function getTagOptions(list: Restaurant[]): string[] {
  return Array.from(new Set(list.flatMap((r) => r.tags))).sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}

export function getStationOptions(list: Restaurant[]): string[] {
  return Array.from(new Set(list.map((r) => r.nearestStation))).sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}
