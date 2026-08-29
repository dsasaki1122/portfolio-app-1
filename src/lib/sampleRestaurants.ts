// DB 未接続のあいだ /restaurants 一覧で表示するモックデータ。
// 既存4件の駅名は prisma/seed.ts と揃えている。

export type Restaurant = {
  id: number;
  name: string;
  tags: string[];
  nearestStation: string;
  rating: number;
  description?: string;
};

export const sampleRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "和食 さくら",
    tags: ["和食", "居酒屋", "駅近"],
    nearestStation: "新宿駅",
    rating: 4.5,
    description: "落ち着いた雰囲気の和食店。",
  },
  {
    id: 2,
    name: "Bistro Lumiere",
    tags: ["フレンチ", "デート向け"],
    nearestStation: "表参道駅",
    rating: 4.2,
    description: "記念日に使えるフレンチビストロ。",
  },
  {
    id: 3,
    name: "麺屋 太郎",
    tags: ["ラーメン", "ランチ"],
    nearestStation: "池袋駅",
    rating: 3.8,
    description: "濃厚豚骨が人気のラーメン店。",
  },
  {
    id: 4,
    name: "Cafe 森の小径",
    tags: ["カフェ", "スイーツ"],
    nearestStation: "下北沢駅",
    rating: 4.0,
    description: "自家製スイーツが評判のカフェ。",
  },
  {
    id: 5,
    name: "鮨 神楽",
    tags: ["和食", "寿司", "デート向け"],
    nearestStation: "新宿駅",
    rating: 4.7,
    description: "カウンターで握る江戸前寿司。",
  },
  {
    id: 6,
    name: "Trattoria Sole",
    tags: ["イタリアン", "ランチ", "駅近"],
    nearestStation: "表参道駅",
    rating: 3.9,
    description: "手打ちパスタが名物のカジュアルイタリアン。",
  },
  {
    id: 7,
    name: "餃子酒場 大黒",
    tags: ["中華", "居酒屋"],
    nearestStation: "池袋駅",
    rating: 3.5,
    description: "焼きたて餃子とハイボールが安い。",
  },
  {
    id: 8,
    name: "Green Bowl",
    tags: ["カフェ", "ヘルシー", "ランチ"],
    nearestStation: "下北沢駅",
    rating: 4.1,
    description: "野菜たっぷりのグレインボウル専門店。",
  },
  {
    id: 9,
    name: "焼肉 炎",
    tags: ["焼肉", "デート向け"],
    nearestStation: "新宿駅",
    rating: 4.3,
    description: "希少部位が楽しめる焼肉店。",
  },
  {
    id: 10,
    name: "Bakery こむぎ",
    tags: ["ベーカリー", "スイーツ", "テイクアウト"],
    nearestStation: "下北沢駅",
    rating: 3.7,
    description: "早朝から焼きたてパンが並ぶ小さなお店。",
  },
];
