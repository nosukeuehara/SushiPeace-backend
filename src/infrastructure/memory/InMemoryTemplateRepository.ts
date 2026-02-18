import {PlateTemplate} from "@/domain/entities/PlateTemplate";
import {TemplateRepository} from "@/domain/repositories/TemplateRepository";

const PLATE_TEMPLATES: PlateTemplate[] = [
  {
    prices: {
      赤: 120,
      青: 180,
      黄: 240,
    },
  },
  {
    prices: {
      赤: 115,
      青: 170,
      黄: 230,
    },
  },
];

export class InMemoryTemplateRepository implements TemplateRepository {
  async findAll(): Promise<PlateTemplate[]> {
    return PLATE_TEMPLATES;
  }
}
