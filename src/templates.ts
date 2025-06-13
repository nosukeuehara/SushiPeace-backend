export type PlateTemplate = {
  name: string;
  prices: {
    [color: string]: number;
  };
};

export const templates: PlateTemplate[] = [
  {
    name: "スシロー",
    prices: {
      赤: 100,
      青: 150,
      黄: 200,
    },
  },
  {
    name: "くら寿司",
    prices: {
      赤: 120,
      青: 170,
      黄: 220,
    },
  },
];
