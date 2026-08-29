"use client";

import React from "react";
import { EMPTY_FILTER, type FilterState } from "@/lib/filterRestaurants";

type Props = {
  tagOptions: string[];
  stationOptions: string[];
  value: FilterState;
  onChange: (next: FilterState) => void;
};

const RATING_OPTIONS = [
  { label: "すべて", value: 0 },
  { label: "★3 以上", value: 3 },
  { label: "★3.5 以上", value: 3.5 },
  { label: "★4 以上", value: 4 },
  { label: "★4.5 以上", value: 4.5 },
];

export default function RestaurantFilter({
  tagOptions,
  stationOptions,
  value,
  onChange,
}: Props) {
  const toggleTag = (tag: string) => {
    const next = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags: next });
  };

  return (
    <div className="space-y-5">
      {/* キーワード */}
      <div>
        <label className="text-sm block mb-1">キーワード</label>
        <input
          type="text"
          value={value.keyword}
          onChange={(e) => onChange({ ...value, keyword: e.target.value })}
          placeholder="店名・説明で検索"
          className="w-full px-3 py-2 border rounded bg-white"
        />
      </div>

      {/* タグ */}
      <div>
        <span className="text-sm block mb-2">タグ</span>
        <div className="flex gap-2 flex-wrap">
          {tagOptions.map((tag) => {
            const active = value.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={`text-xs px-2 py-1 border rounded transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 最寄り駅 */}
      <div>
        <label className="text-sm block mb-1">最寄り駅</label>
        <select
          value={value.station}
          onChange={(e) => onChange({ ...value, station: e.target.value })}
          className="w-full px-3 py-2 border rounded bg-white"
        >
          <option value="">すべて</option>
          {stationOptions.map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>

      {/* 評価下限 */}
      <div>
        <label className="text-sm block mb-1">評価</label>
        <select
          value={value.minRating}
          onChange={(e) =>
            onChange({ ...value, minRating: Number(e.target.value) })
          }
          className="w-full px-3 py-2 border rounded bg-white"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTER)}
        className="w-full px-3 py-2 border rounded bg-white text-sm hover:bg-gray-100"
      >
        クリア
      </button>
    </div>
  );
}
