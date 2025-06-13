import { PlateTemplate } from "../types/plate";

export const createInitialCounts = (template: PlateTemplate) => {
  return Object.keys(template.prices).reduce((acc, color) => {
    acc[color] = 0;
    return acc;
  }, {} as Record<string, number>);
};
