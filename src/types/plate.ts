export type MemberPlates = {
  userId: string;
  name: string;
  counts: Record<string, number>;
};

export type PlateTemplate = {
  id: string;
  name: string;
  prices: Record<string, number>; // 赤, 青, 黄など自由に定義
};
